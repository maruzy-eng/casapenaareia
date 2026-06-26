"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const emptyState: ProfileActionState = {
  success: false,
  message: "",
};

function normalizeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeText(value).toLowerCase();
}

function refreshProfilePages() {
  revalidatePath("/admin/perfil");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin", "layout");
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sessão administrativa inválida.");
  }

  return {
    user,
    supabase,
  };
}

export async function updateAdminProfile(
  _previousState: ProfileActionState = emptyState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    const { user } = await getAuthenticatedUser();

    const name = normalizeText(formData.get("name"));
    const email = normalizeEmail(formData.get("email"));
    const phone = normalizeText(formData.get("phone"));

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2) {
      fieldErrors.name = "Informe um nome válido.";
    }

    if (!email || !email.includes("@")) {
      fieldErrors.email = "Informe um e-mail válido.";
    }

    if (phone.length > 30) {
      fieldErrors.phone = "O telefone informado é muito longo.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "Revise os campos destacados.",
        fieldErrors,
      };
    }

    const adminClient = createAdminClient();

    const { data: currentProfile, error: currentProfileError } =
      await adminClient
        .from("profiles")
        .select("id, email")
        .eq("id", user.id)
        .single();

    if (currentProfileError || !currentProfile) {
      console.error(
        "Erro ao localizar perfil do administrador:",
        currentProfileError
      );

      return {
        success: false,
        message: "Não foi possível localizar seu perfil.",
      };
    }

    const { data: duplicatedProfile, error: duplicatedProfileError } =
      await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("id", user.id)
        .maybeSingle();

    if (duplicatedProfileError) {
      console.error(
        "Erro ao verificar e-mail duplicado:",
        duplicatedProfileError
      );

      return {
        success: false,
        message: "Não foi possível verificar o e-mail informado.",
      };
    }

    if (duplicatedProfile) {
      return {
        success: false,
        message: "Esse e-mail já está sendo usado.",
        fieldErrors: {
          email: "E-mail já cadastrado.",
        },
      };
    }

    const previousEmail = String(
      user.email || currentProfile.email || ""
    )
      .trim()
      .toLowerCase();

    const emailChanged = email !== previousEmail;

    if (emailChanged) {
      const { error: authEmailError } =
        await adminClient.auth.admin.updateUserById(user.id, {
          email,
          email_confirm: true,
        });

      if (authEmailError) {
        console.error(
          "Erro ao atualizar e-mail no Supabase Auth:",
          authEmailError
        );

        return {
          success: false,
          message: "Não foi possível atualizar o e-mail de acesso.",
          fieldErrors: {
            email: "Verifique se o e-mail já está em uso.",
          },
        };
      }
    }

    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        name,
        email,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateProfileError) {
      console.error(
        "Erro ao atualizar perfil:",
        updateProfileError
      );

      if (emailChanged && previousEmail) {
        const { error: rollbackError } =
          await adminClient.auth.admin.updateUserById(user.id, {
            email: previousEmail,
            email_confirm: true,
          });

        if (rollbackError) {
          console.error(
            "Erro ao restaurar o e-mail anterior:",
            rollbackError
          );
        }
      }

      return {
        success: false,
        message: "Não foi possível atualizar os dados do perfil.",
      };
    }

    refreshProfilePages();

    return {
      success: true,
      message: emailChanged
        ? "Dados e e-mail de acesso atualizados com sucesso."
        : "Dados do perfil atualizados com sucesso.",
    };
  } catch (error) {
    console.error(
      "Erro inesperado ao atualizar perfil:",
      error
    );

    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente no painel.",
    };
  }
}

export async function updateAdminPassword(
  _previousState: ProfileActionState = emptyState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    const newPassword = normalizeText(
      formData.get("new_password")
    );

    const confirmPassword = normalizeText(
      formData.get("confirm_password")
    );

    const fieldErrors: Record<string, string> = {};

    if (!newPassword) {
      fieldErrors.new_password =
        "Informe uma nova senha.";
    } else if (newPassword.length < 8) {
      fieldErrors.new_password =
        "A nova senha precisa ter pelo menos 8 caracteres.";
    } else if (!/[a-z]/.test(newPassword)) {
      fieldErrors.new_password =
        "Inclua pelo menos uma letra minúscula.";
    } else if (!/[A-Z]/.test(newPassword)) {
      fieldErrors.new_password =
        "Inclua pelo menos uma letra maiúscula.";
    } else if (!/[0-9]/.test(newPassword)) {
      fieldErrors.new_password =
        "Inclua pelo menos um número.";
    }

    if (!confirmPassword) {
      fieldErrors.confirm_password =
        "Confirme a nova senha.";
    } else if (newPassword !== confirmPassword) {
      fieldErrors.confirm_password =
        "As senhas não coincidem.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "Revise os campos da nova senha.",
        fieldErrors,
      };
    }

    const { supabase } = await getAuthenticatedUser();

    const { error: updatePasswordError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updatePasswordError) {
      console.error(
        "Erro ao atualizar senha:",
        updatePasswordError
      );

      return {
        success: false,
        message:
          updatePasswordError.message ||
          "Não foi possível alterar sua senha.",
      };
    }

    refreshProfilePages();

    return {
      success: true,
      message: "Senha alterada com sucesso.",
    };
  } catch (error) {
    console.error(
      "Erro inesperado ao alterar senha:",
      error
    );

    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente no painel.",
    };
  }
}

export async function uploadAdminAvatar(
  _previousState: ProfileActionState = emptyState,
  formData: FormData
): Promise<ProfileActionState> {
  try {
    const { user } = await getAuthenticatedUser();

    const avatar = formData.get("avatar");

    if (!(avatar instanceof File) || avatar.size === 0) {
      return {
        success: false,
        message: "Selecione uma imagem.",
        fieldErrors: {
          avatar: "Selecione uma imagem para enviar.",
        },
      };
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(avatar.type)) {
      return {
        success: false,
        message: "Formato de imagem inválido.",
        fieldErrors: {
          avatar: "Use uma imagem JPG, PNG ou WebP.",
        },
      };
    }

    const maximumSize = 3 * 1024 * 1024;

    if (avatar.size > maximumSize) {
      return {
        success: false,
        message: "A imagem ultrapassa o limite de tamanho.",
        fieldErrors: {
          avatar: "A imagem pode ter no máximo 3 MB.",
        },
      };
    }

    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensions[avatar.type];

    const newAvatarPath =
      `admin/${user.id}/${crypto.randomUUID()}.${extension}`;

    const adminClient = createAdminClient();

    const { data: currentProfile, error: currentProfileError } =
      await adminClient
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .single();

    if (currentProfileError) {
      console.error(
        "Erro ao consultar avatar atual:",
        currentProfileError
      );

      return {
        success: false,
        message: "Não foi possível carregar sua foto atual.",
      };
    }

    const fileBuffer = Buffer.from(
      await avatar.arrayBuffer()
    );

    const { error: uploadError } = await adminClient.storage
      .from("admin-avatars")
      .upload(newAvatarPath, fileBuffer, {
        contentType: avatar.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Erro ao enviar avatar:",
        uploadError
      );

      return {
        success: false,
        message: "Não foi possível enviar a foto.",
      };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage
      .from("admin-avatars")
      .getPublicUrl(newAvatarPath);

    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        avatar_path: newAvatarPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateProfileError) {
      console.error(
        "Erro ao salvar avatar no perfil:",
        updateProfileError
      );

      await adminClient.storage
        .from("admin-avatars")
        .remove([newAvatarPath]);

      return {
        success: false,
        message: "A foto foi enviada, mas não pôde ser salva.",
      };
    }

    if (
      currentProfile?.avatar_path &&
      currentProfile.avatar_path !== newAvatarPath
    ) {
      const { error: removeOldAvatarError } =
        await adminClient.storage
          .from("admin-avatars")
          .remove([currentProfile.avatar_path]);

      if (removeOldAvatarError) {
        console.warn(
          "Não foi possível remover o avatar anterior:",
          removeOldAvatarError
        );
      }
    }

    refreshProfilePages();

    return {
      success: true,
      message: "Foto de perfil atualizada com sucesso.",
    };
  } catch (error) {
    console.error(
      "Erro inesperado ao enviar avatar:",
      error
    );

    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente no painel.",
    };
  }
}

export async function removeAdminAvatar(
  _previousState: ProfileActionState = emptyState,
  _formData: FormData
): Promise<ProfileActionState> {
  try {
    const { user } = await getAuthenticatedUser();

    const adminClient = createAdminClient();

    const { data: currentProfile, error: currentProfileError } =
      await adminClient
        .from("profiles")
        .select("avatar_path")
        .eq("id", user.id)
        .single();

    if (currentProfileError) {
      console.error(
        "Erro ao consultar foto do perfil:",
        currentProfileError
      );

      return {
        success: false,
        message: "Não foi possível localizar sua foto atual.",
      };
    }

    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        avatar_url: null,
        avatar_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateProfileError) {
      console.error(
        "Erro ao remover avatar do perfil:",
        updateProfileError
      );

      return {
        success: false,
        message: "Não foi possível remover sua foto.",
      };
    }

    if (currentProfile?.avatar_path) {
      const { error: removeFileError } =
        await adminClient.storage
          .from("admin-avatars")
          .remove([currentProfile.avatar_path]);

      if (removeFileError) {
        console.warn(
          "O perfil foi atualizado, mas o arquivo antigo não foi removido:",
          removeFileError
        );
      }
    }

    refreshProfilePages();

    return {
      success: true,
      message: "Foto de perfil removida.",
    };
  } catch (error) {
    console.error(
      "Erro inesperado ao remover avatar:",
      error
    );

    return {
      success: false,
      message: "Sua sessão expirou. Entre novamente no painel.",
    };
  }
}