"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeDate(value: FormDataEntryValue | null) {
  const date = String(value || "").trim();

  if (!date) {
    return "";
  }

  return date;
}

export async function createBlockedDate(formData: FormData) {
  const supabase = createAdminClient();

  const unitId = String(formData.get("unit_id") || "").trim();
  const startDate = normalizeDate(formData.get("start_date"));
  const endDate = normalizeDate(formData.get("end_date"));
  const reason = String(formData.get("reason") || "").trim();

  if (!unitId || !startDate || !endDate) {
    redirect("/admin/calendario?message=missing_fields");
  }

  if (startDate > endDate) {
    redirect("/admin/calendario?message=invalid_dates");
  }

  const { error } = await supabase.from("blocked_dates").insert({
    unit_id: unitId,
    start_date: startDate,
    end_date: endDate,
    reason: reason || "Bloqueio manual",
  });

  if (error) {
    console.error(error);
    redirect("/admin/calendario?message=error");
  }

  revalidatePath("/admin/calendario");
  redirect("/admin/calendario?message=blocked");
}

export async function deleteBlockedDate(formData: FormData) {
  const supabase = createAdminClient();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect("/admin/calendario?message=error");
  }

  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

  if (error) {
    console.error(error);
    redirect("/admin/calendario?message=error");
  }

  revalidatePath("/admin/calendario");
  redirect("/admin/calendario?message=removed");
}