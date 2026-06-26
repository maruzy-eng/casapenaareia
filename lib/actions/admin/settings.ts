"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeValue(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

async function upsertSetting(key: string, value: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("system_settings").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "key",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSystemSettings(formData: FormData) {
  const settings = {
    site_name: normalizeValue(formData.get("site_name")),
    business_name: normalizeValue(formData.get("business_name")),
    contact_email: normalizeValue(formData.get("contact_email")),
    contact_phone: normalizeValue(formData.get("contact_phone")),
    whatsapp_number: normalizeValue(formData.get("whatsapp_number")),
    address: normalizeValue(formData.get("address")),
    instagram_url: normalizeValue(formData.get("instagram_url")),
    logo_url: normalizeValue(formData.get("logo_url")),
    primary_cta_text: normalizeValue(formData.get("primary_cta_text")),
    reservation_email_subject: normalizeValue(
      formData.get("reservation_email_subject")
    ),
    reservation_email_intro: normalizeValue(
      formData.get("reservation_email_intro")
    ),
    confirmation_email_subject: normalizeValue(
      formData.get("confirmation_email_subject")
    ),
    confirmation_email_intro: normalizeValue(
      formData.get("confirmation_email_intro")
    ),
    cancellation_email_subject: normalizeValue(
      formData.get("cancellation_email_subject")
    ),
    cancellation_email_intro: normalizeValue(
      formData.get("cancellation_email_intro")
    ),
  };

  try {
    await Promise.all(
      Object.entries(settings).map(([key, value]) => upsertSetting(key, value))
    );
  } catch (error) {
    console.error(error);
    redirect("/admin/configuracoes?message=error");
  }

  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?message=saved");
}