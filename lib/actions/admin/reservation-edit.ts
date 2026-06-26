"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function parseYmdAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function differenceInYmdDays(startDate: string, endDate: string) {
  const start = parseYmdAsUtc(startDate);
  const end = parseYmdAsUtc(endDate);

  const diff = end.getTime() - start.getTime();

  return Math.round(diff / 86_400_000);
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key) || 0);

  if (Number.isNaN(value)) {
    return 0;
  }

  return value;
}

function revalidateReservationPages(reservationId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${reservationId}`);
  revalidatePath(`/admin/reservas/${reservationId}/editar`);
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/checkins-checkouts");
  revalidatePath("/admin/mapa-reservas");
}

export async function updateReservationDetails(formData: FormData) {
  const reservationId = getString(formData, "reservation_id");
  const guestId = getString(formData, "guest_id");

  const unitId = getString(formData, "unit_id");
  const checkIn = getString(formData, "check_in");
  const checkOut = getString(formData, "check_out");
  const guestsCount = getNumber(formData, "guests_count");
  const status = getString(formData, "status");
  const paymentStatus = getString(formData, "payment_status");
  const source = getString(formData, "source") || "website";
  const internalNotes = getString(formData, "internal_notes");
  const discount = getNumber(formData, "discount");

  const guestName = getString(formData, "guest_name");
  const guestEmail = getString(formData, "guest_email");
  const guestPhone = getString(formData, "guest_phone");
  const guestCountry = getString(formData, "guest_country");

  if (!reservationId) {
    redirect("/admin/reservas");
  }

  if (!unitId || !checkIn || !checkOut || !status || !paymentStatus) {
    redirect(`/admin/reservas/${reservationId}/editar?message=missing_fields`);
  }

  const nights = differenceInYmdDays(checkIn, checkOut);

  if (nights <= 0) {
    redirect(`/admin/reservas/${reservationId}/editar?message=invalid_dates`);
  }

  if (guestsCount <= 0) {
    redirect(`/admin/reservas/${reservationId}/editar?message=invalid_guests`);
  }

  const supabase = createAdminClient();

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id, base_price, cleaning_fee, max_guests")
    .eq("id", unitId)
    .single();

  if (unitError || !unit) {
    console.error("Unit not found:", unitError);
    redirect(`/admin/reservas/${reservationId}/editar?message=unit_not_found`);
  }

  if (Number(unit.max_guests || 0) > 0 && guestsCount > Number(unit.max_guests)) {
    redirect(`/admin/reservas/${reservationId}/editar?message=too_many_guests`);
  }

  const basePrice = Number(unit.base_price || 0);
  const cleaningFee = Number(unit.cleaning_fee || 0);
  const subtotal = basePrice * nights;
  const total = Math.max(0, subtotal + cleaningFee - discount);

  if (guestId) {
    const { error: guestError } = await supabase
      .from("guests")
      .update({
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        country: guestCountry,
      })
      .eq("id", guestId);

    if (guestError) {
      console.error("Guest update error:", guestError);
      redirect(`/admin/reservas/${reservationId}/editar?message=guest_error`);
    }
  }

  const { error: reservationError } = await supabase
    .from("reservations")
    .update({
      unit_id: unitId,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guestsCount,
      nights,
      subtotal,
      cleaning_fee: cleaningFee,
      discount,
      total,
      status,
      payment_status: paymentStatus,
      source,
      internal_notes: internalNotes,
    })
    .eq("id", reservationId);

  if (reservationError) {
    console.error("Reservation update error:", reservationError);
    redirect(`/admin/reservas/${reservationId}/editar?message=error`);
  }

  revalidateReservationPages(reservationId);

  redirect(`/admin/reservas/${reservationId}?message=updated`);
}