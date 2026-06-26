import { redirect } from "next/navigation";

import { EmailTemplatesClient } from "@/components/admin/email-templates-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EmailTemplateItem = {
  id: string;
  template_key: string;
  title: string;
  subject: string;
  description: string | null;
  html_body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export default async function AdminEmailsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?redirect=/admin/emails");
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/admin/login?redirect=/admin/emails");
  }

  const { data: templates, error } = await adminClient
    .from("email_templates")
    .select(
      `
      id,
      template_key,
      title,
      subject,
      description,
      html_body,
      is_active,
      created_at,
      updated_at
    `
    )
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("Erro ao buscar templates de email:", error);
  }

  return (
    <EmailTemplatesClient
      initialTemplates={(templates || []) as EmailTemplateItem[]}
    />
  );
}