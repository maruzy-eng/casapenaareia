"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = [
  "admin",
  "administrator",
  "manager",
  "editor",
];

export type UpdateEmailTemplatePayload = {
  id: string;
  title: string;
  subject: string;
  html_body: string;
  description?: string | null;
  is_active: boolean;
};

async function requireAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sessão inválida.");
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Perfil administrativo não encontrado.");
  }

  const normalizedRole = String(profile.role || "")
    .trim()
    .toLowerCase();

  if (!allowedRoles.includes(normalizedRole)) {
    throw new Error("Sem permissão para editar emails.");
  }

  return {
    user,
    adminClient,
  };
}

function normalizePayload(payload: UpdateEmailTemplatePayload) {
  const id = String(payload.id || "").trim();
  const title = String(payload.title || "").trim();
  const subject = String(payload.subject || "").trim();
  const htmlBody = String(payload.html_body || "").trim();
  const description =
    String(payload.description || "").trim() || null;

  if (!id) {
    throw new Error("Template inválido.");
  }

  if (!title) {
    throw new Error("Informe o título do email.");
  }

  if (!subject) {
    throw new Error("Informe o assunto do email.");
  }

  if (!htmlBody) {
    throw new Error("Informe o corpo HTML do email.");
  }

  return {
    id,
    title,
    subject,
    html_body: htmlBody,
    description,
    is_active: Boolean(payload.is_active),
  };
}

export async function updateEmailTemplateAction(
  payload: UpdateEmailTemplatePayload
) {
  const { adminClient } = await requireAdminAccess();
  const data = normalizePayload(payload);

  const { error } = await adminClient
    .from("email_templates")
    .update({
      title: data.title,
      subject: data.subject,
      description: data.description,
      html_body: data.html_body,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) {
    console.error("Erro ao atualizar template de email:", error);

    throw new Error("Não foi possível atualizar o email.");
  }

  revalidatePath("/admin/emails");

  return {
    ok: true,
  };
}