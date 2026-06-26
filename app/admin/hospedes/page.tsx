export const dynamic = "force-dynamic";
export const revalidate = 0;

import { GuestsListClient } from "@/components/admin/guests-list-client";
import { createAdminClient } from "@/lib/supabase/admin";

export type GuestReservationItem = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  payment_status: string | null;
};

export type GuestItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  created_at: string | null;
  reservations: GuestReservationItem[] | GuestReservationItem | null;
};

export default async function AdminGuestsPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("guests")
    .select(
      `
        id,
        name,
        email,
        phone,
        country,
        created_at,
        reservations (
          id,
          check_in,
          check_out,
          status,
          payment_status
        )
      `
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const guests = (data || []) as GuestItem[];

  return <GuestsListClient initialGuests={guests} />;
}