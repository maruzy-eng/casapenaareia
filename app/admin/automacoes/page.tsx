import { redirect } from "next/navigation";

import { AutomationWebhooksClient } from "@/components/admin/automation-webhooks-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AutomationWebhookItem = {
  id: string;
  name: string;
  event_key: string;
  webhook_url: string;
  method: string;
  headers_json: Record<string, string> | null;
  description: string | null;
  is_active: boolean;
  last_status: string | null;
  last_status_code: number | null;
  last_response: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export default async function AdminAutomationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?redirect=/admin/automacoes");
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/admin/login?redirect=/admin/automacoes");
  }

  const { data: webhooks, error } = await adminClient
    .from("automation_webhooks")
    .select(
      `
      id,
      name,
      event_key,
      webhook_url,
      method,
      headers_json,
      description,
      is_active,
      last_status,
      last_status_code,
      last_response,
      last_triggered_at,
      created_at,
      updated_at
    `
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Erro ao buscar automações:", error);
  }

  return (
    <AutomationWebhooksClient
      initialWebhooks={(webhooks || []) as AutomationWebhookItem[]}
    />
  );
}