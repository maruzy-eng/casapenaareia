"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const STORAGE_BUCKET = "property-media";

export type UpdateMediaOrderState = {
  success: boolean;
  message: string;
};

export type UpdateMediaState = {
  success: boolean;
  message: string;
};

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts[parts.length - 1];

  if (!extension) {
    return "jpg";
  }

  return extension.toLowerCase();
}

function isValidMediaType(value: string): value is "image" | "video" {
  return value === "image" || value === "video";
}

function isValidFileForMediaType(file: File, mediaType: "image" | "video") {
  if (mediaType === "image") {
    return file.type.startsWith("image/");
  }

  return file.type.startsWith("video/");
}

function getStoragePathFromPublicUrl(url: string) {
  if (!url) {
    return null;
  }

  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

  if (!url.includes(marker)) {
    return null;
  }

  const path = url.split(marker)[1];

  if (!path) {
    return null;
  }

  return decodeURIComponent(path.split("?")[0]);
}

async function deleteFileFromStorageIfNeeded(url: string) {
  const storagePath = getStoragePathFromPublicUrl(url);

  if (!storagePath) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("Erro ao remover arquivo do Storage:", error.message);
  }
}

async function uploadMediaFile({
  file,
  unitId,
  mediaType,
}: {
  file: File | null;
  unitId: string;
  mediaType: "image" | "video";
}) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!isValidFileForMediaType(file, mediaType)) {
    throw new Error(
      mediaType === "image"
        ? "O arquivo enviado precisa ser uma imagem."
        : "O arquivo enviado precisa ser um vídeo."
    );
  }

  const maxSizeInBytes =
    mediaType === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    throw new Error(
      mediaType === "image"
        ? "A imagem precisa ter no máximo 10MB."
        : "O vídeo precisa ter no máximo 100MB."
    );
  }

  const supabase = createAdminClient();

  const extension = getFileExtension(file.name);
  const folder = mediaType === "image" ? "fotos" : "videos";
  const filePath = `acomodacoes/${unitId}/${folder}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
}

function revalidateMediaPaths({
  unitId,
  unitSlug,
}: {
  unitId: string;
  unitSlug: string;
}) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/acomodacoes");
  revalidatePath(`/admin/acomodacoes/${unitId}`);
  revalidatePath("/acomodacoes");

  if (unitSlug) {
    revalidatePath(`/acomodacoes/${unitSlug}`);
  }
}

export async function createAccommodationMedia(formData: FormData) {
  const unitId = String(formData.get("unit_id") || "");
  const unitSlug = String(formData.get("unit_slug") || "");
  const mediaTypeInput = String(formData.get("media_type") || "");
  const urlInput = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const mediaFile = formData.get("media_file");

  if (!unitId) {
    throw new Error("Acomodação não encontrada.");
  }

  if (!isValidMediaType(mediaTypeInput)) {
    throw new Error("Tipo de mídia inválido.");
  }

  const uploadedUrl = await uploadMediaFile({
    file: mediaFile instanceof File ? mediaFile : null,
    unitId,
    mediaType: mediaTypeInput,
  });

  const finalUrl = uploadedUrl || urlInput;

  if (!finalUrl) {
    throw new Error("Envie um arquivo ou informe uma URL.");
  }

  const supabase = createAdminClient();

  const { count, error: countError } = await supabase
    .from("unit_media")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("unit_id", unitId);

  if (countError) {
    throw new Error(countError.message);
  }

  const nextSortOrder = Number(count || 0) + 1;

  const { error } = await supabase.from("unit_media").insert({
    unit_id: unitId,
    media_type: mediaTypeInput,
    url: finalUrl,
    title: title || null,
    sort_order: nextSortOrder,
  });

  if (error) {
    if (uploadedUrl) {
      await deleteFileFromStorageIfNeeded(uploadedUrl);
    }

    throw new Error(error.message);
  }

  revalidateMediaPaths({
    unitId,
    unitSlug,
  });

  redirect(`/admin/acomodacoes/${unitId}?media=created`);
}

export async function updateAccommodationMedia(
  _previousState: UpdateMediaState,
  formData: FormData
): Promise<UpdateMediaState> {
  const mediaId = String(formData.get("media_id") || "");
  const unitId = String(formData.get("unit_id") || "");
  const unitSlug = String(formData.get("unit_slug") || "");
  const mediaTypeInput = String(formData.get("media_type") || "");
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!mediaId || !unitId) {
    return {
      success: false,
      message: "Mídia não encontrada.",
    };
  }

  if (!isValidMediaType(mediaTypeInput)) {
    return {
      success: false,
      message: "Tipo de mídia inválido.",
    };
  }

  if (!url) {
    return {
      success: false,
      message: "A URL da mídia é obrigatória.",
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("unit_media")
    .update({
      media_type: mediaTypeInput,
      title: title || null,
      url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId)
    .eq("unit_id", unitId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidateMediaPaths({
    unitId,
    unitSlug,
  });

  return {
    success: true,
    message: "Mídia atualizada com sucesso.",
  };
}

export async function deleteAccommodationMedia(formData: FormData) {
  const mediaId = String(formData.get("media_id") || "");
  const unitId = String(formData.get("unit_id") || "");
  const unitSlug = String(formData.get("unit_slug") || "");

  if (!mediaId || !unitId) {
    throw new Error("Mídia não encontrada.");
  }

  const supabase = createAdminClient();

  const { data: mediaToDelete, error: mediaToDeleteError } = await supabase
    .from("unit_media")
    .select("id, url")
    .eq("id", mediaId)
    .eq("unit_id", unitId)
    .single();

  if (mediaToDeleteError || !mediaToDelete) {
    throw new Error(
      mediaToDeleteError?.message || "Mídia não encontrada para exclusão."
    );
  }

  const { error } = await supabase
    .from("unit_media")
    .delete()
    .eq("id", mediaId)
    .eq("unit_id", unitId);

  if (error) {
    throw new Error(error.message);
  }

  await deleteFileFromStorageIfNeeded(mediaToDelete.url);

  const { data: remainingMedia, error: remainingError } = await supabase
    .from("unit_media")
    .select("id")
    .eq("unit_id", unitId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!remainingError && remainingMedia) {
    await Promise.all(
      remainingMedia.map((item, index) =>
        supabase
          .from("unit_media")
          .update({
            sort_order: index + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)
      )
    );
  }

  revalidateMediaPaths({
    unitId,
    unitSlug,
  });

  redirect(`/admin/acomodacoes/${unitId}?media=deleted`);
}

export async function updateAccommodationMediaOrder(
  _previousState: UpdateMediaOrderState,
  formData: FormData
): Promise<UpdateMediaOrderState> {
  const unitId = String(formData.get("unit_id") || "");
  const unitSlug = String(formData.get("unit_slug") || "");
  const orderedIdsRaw = String(formData.get("ordered_ids") || "");

  if (!unitId) {
    return {
      success: false,
      message: "Acomodação não encontrada.",
    };
  }

  if (!orderedIdsRaw) {
    return {
      success: false,
      message: "Nenhuma mídia enviada para reordenar.",
    };
  }

  let orderedIds: string[] = [];

  try {
    orderedIds = JSON.parse(orderedIdsRaw);
  } catch {
    return {
      success: false,
      message: "Formato inválido da ordenação.",
    };
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return {
      success: false,
      message: "Nenhuma mídia enviada para reordenar.",
    };
  }

  const supabase = createAdminClient();

  const { data: existingMedia, error: existingError } = await supabase
    .from("unit_media")
    .select("id")
    .eq("unit_id", unitId);

  if (existingError) {
    return {
      success: false,
      message: existingError.message,
    };
  }

  const existingIds = new Set((existingMedia || []).map((item) => item.id));

  const hasInvalidId = orderedIds.some((id) => !existingIds.has(id));

  if (hasInvalidId) {
    return {
      success: false,
      message: "A lista contém uma mídia inválida.",
    };
  }

  const now = new Date().toISOString();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("unit_media")
      .update({
        sort_order: index + 1,
        updated_at: now,
      })
      .eq("id", id)
      .eq("unit_id", unitId)
  );

  const results = await Promise.all(updates);

  const firstError = results.find((result) => result.error)?.error;

  if (firstError) {
    return {
      success: false,
      message: firstError.message,
    };
  }

  revalidateMediaPaths({
    unitId,
    unitSlug,
  });

  return {
    success: true,
    message: "Ordem da galeria atualizada com sucesso.",
  };
}