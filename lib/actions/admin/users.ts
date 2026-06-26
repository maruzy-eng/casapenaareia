"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const emptyState: UserActionState = {
  success: false,
  message: "",
};

const allowedRoles = ["admin", "manager", "editor"];

function normalizeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeText(value).toLowerCase();
}

function normalizeRole(value: FormDataEntryValue | null) {
  return normalizeText(value).toLowerCase();
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha precisa ter pelo menos uma letra minúscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha precisa ter pelo menos uma letra maiúscula.";
  }

  if (!/[0-9]/.test(password)) {
    return "A senha precisa ter pelo menos um número.";
  }

  return null;
}

async function requireAdministrator() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Sessão administrativa inválida.");
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Perfil administrativo não encontrado.");
  }

  const role = String(profile.role || "").toLowerCase();

  if (!["admin", "administrator"].includes(role)) {
    throw new Error("Você não possui permissão para gerenciar usuários.");
  }

  return {
    currentUser: user,
    adminClient,
  };
}

function revalidateUsers() {
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin", "layout");
}

export async function createAdminUser(
  _previousState: UserActionState = emptyState,
  formData: FormData
): Promise<UserActionState> {
  try {
    const { adminClient } = await requireAdministrator();

    const name = normalizeText(formData.get("name"));
    const email = normalizeEmail(formData.get("email"));
    const phone = normalizeText(formData.get("phone"));
    const role = normalizeRole(formData.get("role"));
    const password = normalizeText(formData.get("password"));
    const confirmPassword = normalizeText(
      formData.get("confirm_password")
    );

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

    if (!allowedRoles.includes(role)) {
      fieldErrors.role = "Selecione uma função válida.";
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      fieldErrors.password = passwordError;
    }

    if (password !== confirmPassword) {
      fieldErrors.confirm_password = "As senhas não coincidem.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "Revise os campos destacados.",
        fieldErrors,
      };
    }

    const { data: existingProfile, error: existingProfileError } =
      await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (existingProfileError) {
      console.error(
        "Erro ao verificar usuário existente:",
        existingProfileError
      );

      return {
        success: false,
        message: "Não foi possível verificar o e-mail informado.",
      };
    }

    if (existingProfile) {
      return {
        success: false,
        message: "Já existe um usuário com esse e-mail.",
        fieldErrors: {
          email: "E-mail já cadastrado.",
        },
      };
    }

    const {
      data: createdUserData,
      error: createUserError,
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (createUserError || !createdUserData.user) {
      console.error(
        "Erro ao criar usuário no Supabase Auth:",
        createUserError
      );

      return {
        success: false,
        message:
          createUserError?.message ||
          "Não foi possível criar o usuário.",
      };
    }

    const createdUser = createdUserData.user;

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: createdUser.id,
          name,
          email,
          phone: phone || null,
          role,
          created_at: createdUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error(
        "Erro ao criar perfil do usuário:",
        profileError
      );

      await adminClient.auth.admin.deleteUser(createdUser.id);

      return {
        success: false,
        message:
          "O acesso foi criado, mas o perfil não pôde ser salvo.",
      };
    }

    revalidateUsers();

    return {
      success: true,
      message: "Usuário criado com sucesso.",
    };
  } catch (error) {
    console.error("Erro inesperado ao criar usuário:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível criar o usuário.",
    };
  }
}

export async function updateAdminUser(
  _previousState: UserActionState = emptyState,
  formData: FormData
): Promise<UserActionState> {
  try {
    const { currentUser, adminClient } =
      await requireAdministrator();

    const userId = normalizeText(formData.get("user_id"));
    const name = normalizeText(formData.get("name"));
    const email = normalizeEmail(formData.get("email"));
    const phone = normalizeText(formData.get("phone"));
    const role = normalizeRole(formData.get("role"));
    const password = normalizeText(formData.get("password"));
    const confirmPassword = normalizeText(
      formData.get("confirm_password")
    );

    const fieldErrors: Record<string, string> = {};

    if (!userId) {
      return {
        success: false,
        message: "Usuário inválido.",
      };
    }

    if (name.length < 2) {
      fieldErrors.name = "Informe um nome válido.";
    }

    if (!email || !email.includes("@")) {
      fieldErrors.email = "Informe um e-mail válido.";
    }

    if (!allowedRoles.includes(role)) {
      fieldErrors.role = "Selecione uma função válida.";
    }

    if (phone.length > 30) {
      fieldErrors.phone = "O telefone informado é muito longo.";
    }

    if (password) {
      const passwordError = validatePassword(password);

      if (passwordError) {
        fieldErrors.password = passwordError;
      }

      if (password !== confirmPassword) {
        fieldErrors.confirm_password = "As senhas não coincidem.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "Revise os campos destacados.",
        fieldErrors,
      };
    }

    const { data: currentProfile, error: currentProfileError } =
      await adminClient
        .from("profiles")
        .select("id, email, role")
        .eq("id", userId)
        .maybeSingle();

    if (currentProfileError || !currentProfile) {
      return {
        success: false,
        message: "Usuário não encontrado.",
      };
    }

    if (
      userId === currentUser.id &&
      !["admin", "administrator"].includes(role)
    ) {
      return {
        success: false,
        message:
          "Você não pode remover sua própria permissão de administrador.",
        fieldErrors: {
          role: "Mantenha sua conta como administrador.",
        },
      };
    }

    const { data: duplicatedProfile, error: duplicatedError } =
      await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("id", userId)
        .maybeSingle();

    if (duplicatedError) {
      return {
        success: false,
        message: "Não foi possível verificar o e-mail.",
      };
    }

    if (duplicatedProfile) {
      return {
        success: false,
        message: "Esse e-mail já está em uso.",
        fieldErrors: {
          email: "E-mail já cadastrado.",
        },
      };
    }

    const previousEmail = String(currentProfile.email || "")
      .trim()
      .toLowerCase();

    const authUpdatePayload: {
      email?: string;
      email_confirm?: boolean;
      password?: string;
      user_metadata?: Record<string, string>;
    } = {
      user_metadata: {
        name,
        role,
      },
    };

    if (email !== previousEmail) {
      authUpdatePayload.email = email;
      authUpdatePayload.email_confirm = true;
    }

    if (password) {
      authUpdatePayload.password = password;
    }

    const { error: authUpdateError } =
      await adminClient.auth.admin.updateUserById(
        userId,
        authUpdatePayload
      );

    if (authUpdateError) {
      console.error(
        "Erro ao atualizar usuário no Auth:",
        authUpdateError
      );

      return {
        success: false,
        message:
          authUpdateError.message ||
          "Não foi possível atualizar o acesso do usuário.",
      };
    }

    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({
        name,
        email,
        phone: phone || null,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error(
        "Erro ao atualizar perfil:",
        profileUpdateError
      );

      if (email !== previousEmail && previousEmail) {
        await adminClient.auth.admin.updateUserById(userId, {
          email: previousEmail,
          email_confirm: true,
        });
      }

      return {
        success: false,
        message:
          "O acesso foi atualizado, mas o perfil não pôde ser salvo.",
      };
    }

    revalidateUsers();

    return {
      success: true,
      message: password
        ? "Usuário e senha atualizados com sucesso."
        : "Usuário atualizado com sucesso.",
    };
  } catch (error) {
    console.error("Erro inesperado ao atualizar usuário:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário.",
    };
  }
}

export async function deleteAdminUser(
  _previousState: UserActionState = emptyState,
  formData: FormData
): Promise<UserActionState> {
  try {
    const { currentUser, adminClient } =
      await requireAdministrator();

    const userId = normalizeText(formData.get("user_id"));

    if (!userId) {
      return {
        success: false,
        message: "Usuário inválido.",
      };
    }

    if (userId === currentUser.id) {
      return {
        success: false,
        message: "Você não pode excluir sua própria conta.",
      };
    }

    const { data: profile, error: profileError } =
      await adminClient
        .from("profiles")
        .select("id, avatar_path")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Erro ao localizar perfil para exclusão:",
        profileError
      );

      return {
        success: false,
        message: "Não foi possível localizar o usuário.",
      };
    }

    if (profile?.avatar_path) {
      const { error: avatarError } = await adminClient.storage
        .from("admin-avatars")
        .remove([profile.avatar_path]);

      if (avatarError) {
        console.warn(
          "Não foi possível remover a foto do usuário:",
          avatarError
        );
      }
    }

    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(
        "Erro ao excluir usuário do Auth:",
        authDeleteError
      );

      return {
        success: false,
        message:
          authDeleteError.message ||
          "Não foi possível excluir o acesso do usuário.",
      };
    }

    const { error: profileDeleteError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.warn(
        "O Auth foi removido, mas o perfil permaneceu:",
        profileDeleteError
      );
    }

    revalidateUsers();

    return {
      success: true,
      message: "Usuário excluído com sucesso.",
    };
  } catch (error) {
    console.error("Erro inesperado ao excluir usuário:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o usuário.",
    };
  }
}