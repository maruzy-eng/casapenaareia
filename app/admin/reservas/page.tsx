export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createAdminClient } from "@/lib/supabase/admin";
import { ReservationsListClient } from "@/components/admin/reservations-list-client";

export type ReservationItem = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  guests_count: number | string | null;
  nights: number | string | null;
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  source: string | null;
  created_at: string | null;
  units:
    | {
        id: string | null;
        name: string | null;
        cover_image?: string | null;
      }
    | {
        id: string | null;
        name: string | null;
        cover_image?: string | null;
      }[]
    | null;
  guests:
    | {
        id: string | null;
        name: string | null;
        email: string | null;
        phone?: string | null;
        country?: string | null;
      }
    | {
        id: string | null;
        name: string | null;
        email: string | null;
        phone?: string | null;
        country?: string | null;
      }[]
    | null;
};

export type UnitOption = {
  id: string;
  name: string | null;
  max_guests: number | string | null;
  base_price: number | string | null;
};

export default async function AdminReservationsPage() {
  const supabase = createAdminClient();

  const [reservationsResult, unitsResult] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        `
          id,
          check_in,
          check_out,
          guests_count,
          nights,
          total,
          status,
          payment_status,
          source,
          created_at,
          units (
            id,
            name,
            cover_image
          ),
          guests (
            id,
            name,
            email,
            phone,
            country
          )
        `
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(500),

    supabase
      .from("units")
      .select("id, name, max_guests, base_price")
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      }),
  ]);

  if (reservationsResult.error) {
    throw new Error(reservationsResult.error.message);
  }

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message);
  }

  const reservations =
    (reservationsResult.data || []) as ReservationItem[];

  const units = (unitsResult.data || []) as UnitOption[];

  return (
    <ReservationsListClient
      initialReservations={reservations}
      units={units}
    />
  );
}