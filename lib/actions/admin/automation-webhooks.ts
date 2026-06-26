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

export type AutomationWebhookPayload = {
  id?: string;
  name: string;
  event_key: string;
  webhook_url: string;
  description?: string | null;
  headers_json?: string;
  is_active: boolean;
};

type TestWebhookPayload = {
  webhookId: string;
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
    throw new Error("Sem permissão para gerenciar automações.");
  }

  return {
    user,
    adminClient,
  };
}

function validateUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseHeaders(headersJson: string | undefined) {
  const cleanValue = String(headersJson || "").trim();

  if (!cleanValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(cleanValue);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("Headers inválidos.");
    }

    return parsed as Record<string, string>;
  } catch {
    throw new Error("Headers precisam estar em JSON válido.");
  }
}

function normalizePayload(payload: AutomationWebhookPayload) {
  const id = String(payload.id || "").trim();
  const name = String(payload.name || "").trim();
  const eventKey = String(payload.event_key || "").trim();
  const webhookUrl = String(payload.webhook_url || "").trim();
  const description =
    String(payload.description || "").trim() || null;

  if (!name) {
    throw new Error("Informe o nome da automação.");
  }

  if (!eventKey) {
    throw new Error("Selecione o evento da automação.");
  }

  if (!webhookUrl) {
    throw new Error("Informe a URL do webhook.");
  }

  if (!validateUrl(webhookUrl)) {
    throw new Error("Informe uma URL válida começando com http ou https.");
  }

  const headers = parseHeaders(payload.headers_json);

  return {
    id: id || undefined,
    name,
    event_key: eventKey,
    webhook_url: webhookUrl,
    method: "POST",
    headers_json: headers,
    description,
    is_active: Boolean(payload.is_active),
  };
}

export async function createAutomationWebhookAction(
  payload: AutomationWebhookPayload
) {
  const { adminClient } = await requireAdminAccess();
  const data = normalizePayload(payload);

  const { error } = await adminClient
    .from("automation_webhooks")
    .insert({
      name: data.name,
      event_key: data.event_key,
      webhook_url: data.webhook_url,
      method: data.method,
      headers_json: data.headers_json,
      description: data.description,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Erro ao criar automação:", error);
    throw new Error("Não foi possível criar a automação.");
  }

  revalidatePath("/admin/automacoes");

  return {
    ok: true,
  };
}

export async function updateAutomationWebhookAction(
  payload: AutomationWebhookPayload
) {
  const { adminClient } = await requireAdminAccess();
  const data = normalizePayload(payload);

  if (!data.id) {
    throw new Error("Automação inválida.");
  }

  const { error } = await adminClient
    .from("automation_webhooks")
    .update({
      name: data.name,
      event_key: data.event_key,
      webhook_url: data.webhook_url,
      method: data.method,
      headers_json: data.headers_json,
      description: data.description,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) {
    console.error("Erro ao atualizar automação:", error);
    throw new Error("Não foi possível atualizar a automação.");
  }

  revalidatePath("/admin/automacoes");

  return {
    ok: true,
  };
}

export async function toggleAutomationWebhookAction(
  webhookId: string,
  isActive: boolean
) {
  const { adminClient } = await requireAdminAccess();

  const { error } = await adminClient
    .from("automation_webhooks")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", webhookId);

  if (error) {
    console.error("Erro ao alterar status da automação:", error);
    throw new Error("Não foi possível alterar o status da automação.");
  }

  revalidatePath("/admin/automacoes");

  return {
    ok: true,
  };
}

export async function deleteAutomationWebhookAction(webhookId: string) {
  const { adminClient } = await requireAdminAccess();

  const { error } = await adminClient
    .from("automation_webhooks")
    .delete()
    .eq("id", webhookId);

  if (error) {
    console.error("Erro ao excluir automação:", error);
    throw new Error("Não foi possível excluir a automação.");
  }

  revalidatePath("/admin/automacoes");

  return {
    ok: true,
  };
}

export async function testAutomationWebhookAction({
  webhookId,
}: TestWebhookPayload) {
  const { adminClient } = await requireAdminAccess();

  const { data: webhook, error } = await adminClient
    .from("automation_webhooks")
    .select(
      `
      id,
      name,
      event_key,
      webhook_url,
      method,
      headers_json
    `
    )
    .eq("id", webhookId)
    .maybeSingle();

  if (error || !webhook) {
    throw new Error("Webhook não encontrado.");
  }

  const testPayload = {
    test: true,
    event: webhook.event_key,
    automation_name: webhook.name,
    triggered_at: new Date().toISOString(),
    reservation: {
      id: "test_reservation_id",
      guest_name: "Maria Silva",
      guest_email: "maria@email.com",
      unit_name: "Suíte Jardim",
      check_in: "2026-12-29",
      check_out: "2027-01-02",
      total: 2480,
      payment_status: "paid",
      status: "confirmed",
    },
  };

  let lastStatus = "success";
  let lastStatusCode: number | null = null;
  let lastResponse = "";

  try {
    const response = await fetch(webhook.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhook.headers_json || {}),
      },
      body: JSON.stringify(testPayload),
    });

    lastStatusCode = response.status;

    const responseText = await response.text();

    lastResponse = responseText.slice(0, 2000);

    if (!response.ok) {
      lastStatus = "failed";
    }
  } catch (fetchError) {
    lastStatus = "failed";
    lastResponse =
      fetchError instanceof Error
        ? fetchError.message
        : "Erro desconhecido ao testar webhook.";
  }

  const { error: updateError } = await adminClient
    .from("automation_webhooks")
    .update({
      last_status: lastStatus,
      last_status_code: lastStatusCode,
      last_response: lastResponse,
      last_triggered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", webhook.id);

  if (updateError) {
    console.error("Erro ao salvar resultado do teste:", updateError);
  }

  revalidatePath("/admin/automacoes");

  if (lastStatus === "failed") {
    throw new Error(
      `Webhook testado, mas retornou erro. Status: ${
        lastStatusCode || "sem resposta"
      }.`
    );
  }

  return {
    ok: true,
    statusCode: lastStatusCode,
    response: lastResponse,
  };
}