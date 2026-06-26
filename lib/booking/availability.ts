import { createAdminClient } from "@/lib/supabase/admin";

type CheckUnitAvailabilityInput = {
  unitId: string;
  checkIn: string;
  checkOut: string;
};

type GetUnavailableUnitIdsInput = {
  checkIn: string;
  checkOut: string;
};

function hasValidDateRange(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return false;
  }

  return checkOut > checkIn;
}

export async function checkUnitAvailability({
  unitId,
  checkIn,
  checkOut,
}: CheckUnitAvailabilityInput) {
  if (!hasValidDateRange(checkIn, checkOut)) {
    return false;
  }

  const supabase = createAdminClient();

  const activeStatuses = ["pending", "awaiting_payment", "confirmed", "checked_in"];

  const { data: overlappingReservations, error: reservationsError } =
    await supabase
      .from("reservations")
      .select("id")
      .eq("unit_id", unitId)
      .in("status", activeStatuses)
      .lt("check_in", checkOut)
      .gt("check_out", checkIn)
      .limit(1);

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  if (overlappingReservations && overlappingReservations.length > 0) {
    return false;
  }

  const { data: overlappingBlockedDates, error: blockedDatesError } =
    await supabase
      .from("blocked_dates")
      .select("id")
      .eq("unit_id", unitId)
      .lt("start_date", checkOut)
      .gt("end_date", checkIn)
      .limit(1);

  if (blockedDatesError) {
    throw new Error(blockedDatesError.message);
  }

  if (overlappingBlockedDates && overlappingBlockedDates.length > 0) {
    return false;
  }

  return true;
}

export async function getUnavailableUnitIds({
  checkIn,
  checkOut,
}: GetUnavailableUnitIdsInput) {
  if (!hasValidDateRange(checkIn, checkOut)) {
    return [];
  }

  const supabase = createAdminClient();

  const activeStatuses = ["pending", "awaiting_payment", "confirmed", "checked_in"];

  const { data: reservations, error: reservationsError } = await supabase
    .from("reservations")
    .select("unit_id")
    .in("status", activeStatuses)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (reservationsError) {
    throw new Error(reservationsError.message);
  }

  const { data: blockedDates, error: blockedDatesError } = await supabase
    .from("blocked_dates")
    .select("unit_id")
    .lt("start_date", checkOut)
    .gt("end_date", checkIn);

  if (blockedDatesError) {
    throw new Error(blockedDatesError.message);
  }

  const unavailableIds = new Set<string>();

  reservations?.forEach((reservation) => {
    if (reservation.unit_id) {
      unavailableIds.add(reservation.unit_id);
    }
  });

  blockedDates?.forEach((blockedDate) => {
    if (blockedDate.unit_id) {
      unavailableIds.add(blockedDate.unit_id);
    }
  });

  return Array.from(unavailableIds);
}