"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResponse = {
  success: boolean;
  message: string;
  data?: {
    reservationId: string;
    unitId?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
  };
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

function parseDateAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function isValidDateString(date: string) {
  if (!DATE_PATTERN.test(date)) return false;

  return formatDateAsYmd(parseDateAsUtc(date)) === date;
}

function formatDateAsYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function differenceInDays(startDate: string, endDate: string) {
  const start = parseDateAsUtc(startDate);
  const end = parseDateAsUtc(endDate);
  const diff = end.getTime() - start.getTime();

  return Math.round(diff / MS_PER_DAY);
}

function addDays(date: string, amount: number) {
  const currentDate = parseDateAsUtc(date);
  currentDate.setUTCDate(currentDate.getUTCDate() + amount);

  return formatDateAsYmd(currentDate);
}

function revalidateReservationPages(reservationId: string) {
  revalidatePath("/admin/mapa-reservas");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${reservationId}`);
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/checkins-checkouts");
  revalidatePath("/admin/dashboard");
}

export async function moveReservationOnBookingBoard(
  formData: FormData
): Promise<ActionResponse> {
  const reservationId = String(formData.get("reservation_id") || "").trim();
  const unitId = String(formData.get("unit_id") || "").trim();
  const newCheckIn = String(formData.get("check_in") || "").trim();

  if (!reservationId || !unitId || !newCheckIn) {
    return {
      success: false,
      message: "Faltam dados para mover a reserva.",
    };
  }

  if (!isValidDateString(newCheckIn)) {
    return {
      success: false,
      message: "A data de check-in é inválida.",
    };
  }

  const supabase = createAdminClient();

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, check_in, check_out, status")
    .eq("id", reservationId)
    .single();

  if (reservationError || !reservation) {
    console.error("Reservation not found:", reservationError);

    return {
      success: false,
      message: "Reserva não encontrada.",
    };
  }

  if (reservation.status === "cancelled") {
    return {
      success: false,
      message: "Reserva cancelada não pode ser movida.",
    };
  }

  if (
    !reservation.check_in ||
    !reservation.check_out ||
    !isValidDateString(reservation.check_in) ||
    !isValidDateString(reservation.check_out)
  ) {
    return {
      success: false,
      message: "A reserva possui datas inválidas.",
    };
  }

  const nights = differenceInDays(reservation.check_in, reservation.check_out);

  if (nights <= 0) {
    return {
      success: false,
      message: "O check-out precisa ser posterior ao check-in.",
    };
  }

  const newCheckOut = addDays(newCheckIn, nights);

  const { error } = await supabase
    .from("reservations")
    .update({
      unit_id: unitId,
      check_in: newCheckIn,
      check_out: newCheckOut,
      nights,
    })
    .eq("id", reservationId);

  if (error) {
    console.error("Move reservation error:", error);

    return {
      success: false,
      message: "Não foi possível mover a reserva.",
    };
  }

  revalidateReservationPages(reservationId);

  return {
    success: true,
    message: "Reserva movida com sucesso.",
    data: {
      reservationId,
      unitId,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      nights,
    },
  };
}

export async function resizeReservationOnBookingBoard(
  formData: FormData
): Promise<ActionResponse> {
  const reservationId = String(formData.get("reservation_id") || "").trim();
  const resizeType = String(formData.get("resize_type") || "").trim();
  const date = String(formData.get("date") || "").trim();

  if (!reservationId || !resizeType || !date) {
    return {
      success: false,
      message: "Faltam dados para ajustar a reserva.",
    };
  }

  if (!["start", "end"].includes(resizeType)) {
    return {
      success: false,
      message: "Tipo de ajuste inválido.",
    };
  }

  if (!isValidDateString(date)) {
    return {
      success: false,
      message: "A data informada é inválida.",
    };
  }

  const supabase = createAdminClient();

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, check_in, check_out, status")
    .eq("id", reservationId)
    .single();

  if (reservationError || !reservation) {
    console.error("Reservation not found:", reservationError);

    return {
      success: false,
      message: "Reserva não encontrada.",
    };
  }

  if (reservation.status === "cancelled") {
    return {
      success: false,
      message: "Reserva cancelada não pode ser alterada.",
    };
  }

  if (
    !reservation.check_in ||
    !reservation.check_out ||
    !isValidDateString(reservation.check_in) ||
    !isValidDateString(reservation.check_out)
  ) {
    return {
      success: false,
      message: "A reserva possui datas inválidas.",
    };
  }

  let nextCheckIn = reservation.check_in;
  let nextCheckOut = reservation.check_out;

  if (resizeType === "start") {
    nextCheckIn = date;
  }

  /*
    IMPORTANTE:
    No mapa, a borda direita representa o DIA DE CHECK-OUT.
    Então, se você soltar em 30/06, o check_out precisa ser 30/06.
    Não pode somar +1 dia aqui.
  */
  if (resizeType === "end") {
    nextCheckOut = date;
  }

  const nights = differenceInDays(nextCheckIn, nextCheckOut);

  if (nights <= 0) {
    return {
      success: false,
      message: "O check-out precisa ser posterior ao check-in.",
    };
  }

  const { error } = await supabase
    .from("reservations")
    .update({
      check_in: nextCheckIn,
      check_out: nextCheckOut,
      nights,
    })
    .eq("id", reservationId);

  if (error) {
    console.error("Resize reservation error:", error);

    return {
      success: false,
      message: "Não foi possível alterar o período da reserva.",
    };
  }

  revalidateReservationPages(reservationId);

  return {
    success: true,
    message: "Período da reserva atualizado.",
    data: {
      reservationId,
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      nights,
    },
  };
}
