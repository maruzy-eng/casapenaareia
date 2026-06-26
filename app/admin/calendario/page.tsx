export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createAdminClient } from "@/lib/supabase/admin";
import { ReservationFullCalendar } from "@/components/admin/reservation-full-calendar";

type ReservationItem = {
  id: string;
  unit_id: string | null;
  check_in: string | null;
  check_out: string | null;
  guests_count: number | string | null;
  nights: number | string | null;
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  source: string | null;
  units:
    | {
        id: string | null;
        name: string | null;
      }
    | {
        id: string | null;
        name: string | null;
      }[]
    | null;
  guests:
    | {
        id: string | null;
        name: string | null;
        email: string | null;
      }
    | {
        id: string | null;
        name: string | null;
        email: string | null;
      }[]
    | null;
};

type BlockedDateItem = {
  id: string;
  unit_id: string | null;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
  units:
    | {
        id: string | null;
        name: string | null;
      }
    | {
        id: string | null;
        name: string | null;
      }[]
    | null;
};

type UnitItem = {
  id: string;
  name: string | null;
};

function getRelationItem<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

function getTodayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseYmdAsUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysYmd(value: string, days: number) {
  const date = parseYmdAsUtc(value);
  date.setUTCDate(date.getUTCDate() + days);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getReservationTitle(reservation: ReservationItem) {
  const guest = getRelationItem(reservation.guests);
  const unit = getRelationItem(reservation.units);

  const guestName = guest?.name || "Hóspede";
  const unitName = unit?.name || "Acomodação";

  return `${guestName} · ${unitName}`;
}

function getBlockedTitle(blocked: BlockedDateItem) {
  const unit = getRelationItem(blocked.units);
  const unitName = unit?.name || "Acomodação";
  const reason = blocked.reason || "Bloqueio";

  return `${reason} · ${unitName}`;
}

export default async function AdminCalendarPage() {
  const supabase = createAdminClient();

  const today = getTodayYmd();
  const start = addDaysYmd(today, -180);
  const end = addDaysYmd(today, 365);

  const [unitsResult, reservationsResult, blockedDatesResult] =
    await Promise.all([
      supabase
        .from("units")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),

      supabase
        .from("reservations")
        .select(
          `
          id,
          unit_id,
          check_in,
          check_out,
          guests_count,
          nights,
          total,
          status,
          payment_status,
          source,
          units (
            id,
            name
          ),
          guests (
            id,
            name,
            email
          )
        `
        )
        .lt("check_in", end)
        .gt("check_out", start)
        .order("check_in", { ascending: true }),

      supabase
        .from("blocked_dates")
        .select(
          `
          id,
          unit_id,
          start_date,
          end_date,
          reason,
          units (
            id,
            name
          )
        `
        )
        .lt("start_date", end)
        .gt("end_date", start)
        .order("start_date", { ascending: true }),
    ]);

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message);
  }

  if (reservationsResult.error) {
    throw new Error(reservationsResult.error.message);
  }

  if (blockedDatesResult.error) {
    throw new Error(blockedDatesResult.error.message);
  }

  const units = (unitsResult.data || []) as UnitItem[];
  const reservations = (reservationsResult.data || []) as ReservationItem[];
  const blockedDates = (blockedDatesResult.data || []) as BlockedDateItem[];

  const reservationEvents = reservations
    .filter((reservation) => reservation.check_in && reservation.check_out)
    .map((reservation) => {
      const unit = getRelationItem(reservation.units);
      const guest = getRelationItem(reservation.guests);

      return {
        id: `reservation-${reservation.id}`,
        title: getReservationTitle(reservation),
        start: reservation.check_in as string,
        end: reservation.check_out as string,
        type: "reservation" as const,
        status: reservation.status || "pending",
        payment_status: reservation.payment_status,
        unit_id: reservation.unit_id,
        unit_name: unit?.name || "Acomodação",
        guest_name: guest?.name || "Hóspede",
        guests_count: reservation.guests_count,
        nights: reservation.nights,
        total: reservation.total,
        source: reservation.source,
        url: `/admin/reservas/${reservation.id}`,
      };
    });

  const blockedEvents = blockedDates
    .filter((blocked) => blocked.start_date && blocked.end_date)
    .map((blocked) => {
      const unit = getRelationItem(blocked.units);

      return {
        id: `blocked-${blocked.id}`,
        title: getBlockedTitle(blocked),
        start: blocked.start_date as string,
        end: blocked.end_date as string,
        type: "blocked" as const,
        status: "blocked",
        unit_id: blocked.unit_id,
        unit_name: unit?.name || "Acomodação",
      };
    });

  const events = [...reservationEvents, ...blockedEvents];

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <ReservationFullCalendar units={units} events={events} />
      </div>
    </main>
  );
}