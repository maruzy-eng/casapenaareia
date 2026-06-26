"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const SUCCESS_PATHS = [
  "/admin/bloqueios",
  "/admin/calendario",
  "/admin/mapa-reservas",
  "/admin/dashboard",
  "/acomodacoes",
];

function normalizeString(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function isValidYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getBlockedDatePayload(formData: FormData) {
  const unitId = normalizeString(formData.get("unit_id"));
  const startDate = normalizeString(formData.get("start_date"));
  const endDate = normalizeString(formData.get("end_date"));
  const reason = normalizeString(formData.get("reason"));

  if (!unitId || !startDate || !endDate || !reason) {
    return {
      error: "missing_fields",
      payload: null,
    };
  }

  if (!isValidYmd(startDate) || !isValidYmd(endDate)) {
    return {
      error: "invalid_dates",
      payload: null,
    };
  }

  if (endDate <= startDate) {
    return {
      error: "invalid_period",
      payload: null,
    };
  }

  return {
    error: null,
    payload: {
      unitId,
      startDate,
      endDate,
      reason,
    },
  };
}

function revalidateBlockedDatePaths(blockedDateId?: string) {
  SUCCESS_PATHS.forEach((path) => revalidatePath(path));

  if (blockedDateId) {
    revalidatePath(`/admin/bloqueios/${blockedDateId}/editar`);
  }
}

async function hasReservationConflict({
  unitId,
  startDate,
  endDate,
}: {
  unitId: string;
  startDate: string;
  endDate: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .eq("unit_id", unitId)
    .lt("check_in", endDate)
    .gt("check_out", startDate)
    .neq("status", "cancelled")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data && data.length > 0);
}

async function hasBlockedDateConflict({
  unitId,
  startDate,
  endDate,
  ignoreId,
}: {
  unitId: string;
  startDate: string;
  endDate: string;
  ignoreId?: string;
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("blocked_dates")
    .select("id")
    .eq("unit_id", unitId)
    .lt("start_date", endDate)
    .gt("end_date", startDate)
    .limit(1);

  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data && data.length > 0);
}

function redirectWithError(error: string, blockedDateId?: string): never {
  if (blockedDateId) {
    redirect(`/admin/bloqueios/${blockedDateId}/editar?message=${error}`);
  }

  redirect(`/admin/bloqueios?message=${error}`);
}

export async function createBlockedDate(formData: FormData) {
  const result = getBlockedDatePayload(formData);

  if (!result.payload) {
    redirectWithError(result.error || "error");
  }

  const { unitId, startDate, endDate, reason } = result.payload;

  if (await hasReservationConflict({ unitId, startDate, endDate })) {
    redirectWithError("reservation_conflict");
  }

  if (await hasBlockedDateConflict({ unitId, startDate, endDate })) {
    redirectWithError("block_conflict");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("blocked_dates").insert({
    unit_id: unitId,
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (error) {
    console.error("Blocked date create error:", error);
    redirectWithError("error");
  }

  revalidateBlockedDatePaths();
  redirect("/admin/bloqueios?message=created");
}

export async function updateBlockedDate(formData: FormData) {
  const id = normalizeString(formData.get("id"));

  if (!id) {
    redirect("/admin/bloqueios?message=not_found");
  }

  const result = getBlockedDatePayload(formData);

  if (!result.payload) {
    redirectWithError(result.error || "error", id);
  }

  const { unitId, startDate, endDate, reason } = result.payload;

  if (await hasReservationConflict({ unitId, startDate, endDate })) {
    redirectWithError("reservation_conflict", id);
  }

  if (await hasBlockedDateConflict({ unitId, startDate, endDate, ignoreId: id })) {
    redirectWithError("block_conflict", id);
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("blocked_dates")
    .update({
      unit_id: unitId,
      start_date: startDate,
      end_date: endDate,
      reason,
    })
    .eq("id", id);

  if (error) {
    console.error("Blocked date update error:", error);
    redirectWithError("error", id);
  }

  revalidateBlockedDatePaths(id);
  redirect("/admin/bloqueios?message=updated");
}

export async function deleteBlockedDate(formData: FormData) {
  const id = normalizeString(formData.get("id"));

  if (!id) {
    redirect("/admin/bloqueios?message=not_found");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);

  if (error) {
    console.error("Blocked date delete error:", error);
    redirect("/admin/bloqueios?message=error");
  }

  revalidateBlockedDatePaths(id);
  redirect("/admin/bloqueios?message=deleted");
}
