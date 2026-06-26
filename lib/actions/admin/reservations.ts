"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function getReservationId(formData: FormData) {
  return String(formData.get("id") || "").trim();
}

async function updateReservation({
  id,
  status,
  paymentStatus,
  message,
}: {
  id: string;
  status?: string;
  paymentStatus?: string;
  message: string;
}) {
  if (!id) {
    redirect("/admin/reservas");
  }

  const supabase = createAdminClient();

  const payload: {
    status?: string;
    payment_status?: string;
  } = {};

  if (status) {
    payload.status = status;
  }

  if (paymentStatus) {
    payload.payment_status = paymentStatus;
  }

  const { error } = await supabase
    .from("reservations")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Reservation update error:", error);
    redirect(`/admin/reservas/${id}?message=error`);
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/checkins-checkouts");

  redirect(`/admin/reservas/${id}?message=${message}`);
}

export async function updateReservationStatus(formData: FormData) {
  const id = getReservationId(formData);

  const status = String(formData.get("status") || "").trim();
  const paymentStatus = String(formData.get("payment_status") || "").trim();

  if (!id || !status || !paymentStatus) {
    redirect(id ? `/admin/reservas/${id}?message=error` : "/admin/reservas");
  }

  await updateReservation({
    id,
    status,
    paymentStatus,
    message: "updated",
  });
}

export async function confirmReservation(formData: FormData) {
  const id = getReservationId(formData);

  await updateReservation({
    id,
    status: "confirmed",
    message: "confirmed",
  });
}

export async function cancelReservation(formData: FormData) {
  const id = getReservationId(formData);

  await updateReservation({
    id,
    status: "cancelled",
    message: "cancelled",
  });
}

export async function markReservationAsAwaitingPayment(formData: FormData) {
  const id = getReservationId(formData);

  await updateReservation({
    id,
    status: "awaiting_payment",
    paymentStatus: "pending",
    message: "awaiting_payment",
  });
}

export async function markReservationAsPaid(formData: FormData) {
  const id = getReservationId(formData);

  await updateReservation({
    id,
    paymentStatus: "paid",
    message: "paid",
  });
}

export async function markReservationCheckIn(formData: FormData) {
  const id = getReservationId(formData);

  await updateReservation({
    id,
    status: "checked_in",
    message: "checked_in",
  });
}

export async function markReservationCheckOut(formData: FormData) {
  const id = getReservationId(formData);

  await updateReservation({
    id,
    status: "checked_out",
    message: "checked_out",
  });
}