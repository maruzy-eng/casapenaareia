"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccommodationActionState = {
  success: boolean;
  message: string;
};

const STORAGE_BUCKET = "property-media";

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseAmenities(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: FormDataEntryValue | null) {
  if (!value) return 0;

  const parsed = Number(String(value).replace(",", "."));

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  const extension = parts[parts.length - 1];

  if (!extension) {
    return "jpg";
  }

  return extension.toLowerCase();
}

async function uploadCoverImage({
  file,
  slug,
}: {
  file: File | null;
  slug: string;
}) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo enviado precisa ser uma imagem.");
  }

  const maxSizeInBytes = 10 * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    throw new Error("A imagem precisa ter no máximo 10MB.");
  }

  const supabase = createAdminClient();

  const extension = getFileExtension(file.name);
  const filePath = `acomodacoes/capas/${slug}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function createAccommodation(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const coverImageInput = String(formData.get("cover_image") || "").trim();
  const amenitiesInput = String(formData.get("amenities") || "").trim();
  const coverImageFile = formData.get("cover_image_file");

  const maxGuests = parseNumber(formData.get("max_guests")) || 1;
  const bedrooms = parseNumber(formData.get("bedrooms")) || 1;
  const bathrooms = parseNumber(formData.get("bathrooms")) || 1;
  const basePrice = parseNumber(formData.get("base_price"));
  const cleaningFee = parseNumber(formData.get("cleaning_fee"));
  const isActive = formData.get("is_active") === "on";

  if (!name) {
    throw new Error("O nome da acomodação é obrigatório.");
  }

  if (basePrice < 0 || cleaningFee < 0) {
    throw new Error("Os valores não podem ser negativos.");
  }

  const slug = slugInput ? toSlug(slugInput) : toSlug(name);

  const uploadedCoverImage = await uploadCoverImage({
    file: coverImageFile instanceof File ? coverImageFile : null,
    slug,
  });

  const coverImage = uploadedCoverImage || coverImageInput || null;

  const supabase = createAdminClient();

  const { data: createdUnit, error } = await supabase
    .from("units")
    .insert({
      name,
      slug,
      description,
      cover_image: coverImage,
      max_guests: maxGuests,
      bedrooms,
      bathrooms,
      base_price: basePrice,
      cleaning_fee: cleaningFee,
      amenities: parseAmenities(amenitiesInput),
      is_active: isActive,
    })
    .select("id, slug")
    .single();

  if (error || !createdUnit) {
    throw new Error(error?.message || "Erro ao criar acomodação.");
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/acomodacoes");
  revalidatePath("/admin/calendario");
  revalidatePath("/acomodacoes");
  revalidatePath(`/acomodacoes/${createdUnit.slug}`);

  redirect(`/admin/acomodacoes/${createdUnit.id}?created=1`);
}

export async function updateAccommodation(
  _previousState: AccommodationActionState,
  formData: FormData
): Promise<AccommodationActionState> {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const coverImageInput = String(formData.get("cover_image") || "").trim();
  const amenitiesInput = String(formData.get("amenities") || "").trim();
  const coverImageFile = formData.get("cover_image_file");

  const maxGuests = parseNumber(formData.get("max_guests")) || 1;
  const bedrooms = parseNumber(formData.get("bedrooms")) || 1;
  const bathrooms = parseNumber(formData.get("bathrooms")) || 1;
  const basePrice = parseNumber(formData.get("base_price"));
  const cleaningFee = parseNumber(formData.get("cleaning_fee"));
  const isActive = formData.get("is_active") === "on";

  if (!id) {
    return {
      success: false,
      message: "Acomodação não encontrada.",
    };
  }

  if (!name) {
    return {
      success: false,
      message: "O nome da acomodação é obrigatório.",
    };
  }

  if (basePrice < 0 || cleaningFee < 0) {
    return {
      success: false,
      message: "Os valores não podem ser negativos.",
    };
  }

  const slug = slugInput ? toSlug(slugInput) : toSlug(name);

  try {
    const uploadedCoverImage = await uploadCoverImage({
      file: coverImageFile instanceof File ? coverImageFile : null,
      slug,
    });

    const coverImage = uploadedCoverImage || coverImageInput || null;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("units")
      .update({
        name,
        slug,
        description,
        cover_image: coverImage,
        max_guests: maxGuests,
        bedrooms,
        bathrooms,
        base_price: basePrice,
        cleaning_fee: cleaningFee,
        amenities: parseAmenities(amenitiesInput),
        is_active: isActive,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/acomodacoes");
    revalidatePath(`/admin/acomodacoes/${id}`);
    revalidatePath("/admin/calendario");
    revalidatePath("/acomodacoes");
    revalidatePath(`/acomodacoes/${slug}`);

    return {
      success: true,
      message: "Acomodação atualizada com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar acomodação.",
    };
  }
}