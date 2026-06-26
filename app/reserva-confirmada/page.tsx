import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type ConfirmedReservationPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

type ConfirmedReservation = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  guests_count: number | string | null;
  nights: number | string | null;
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  units:
    | {
        name: string | null;
        cover_image: string | null;
      }
    | Array<{
        name: string | null;
        cover_image: string | null;
      }>
    | null;
  guests:
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }
    | Array<{
        name: string | null;
        email: string | null;
        phone: string | null;
      }>
    | null;
};

export default async function ConfirmedReservationPage({
  searchParams,
}: ConfirmedReservationPageProps) {
  const params = await searchParams;
  const reservationId = params.id;

  const supabase = await createClient();

  const { data } = reservationId
    ? await supabase
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
          units (
            name,
            cover_image
          ),
          guests (
            name,
            email,
            phone
          )
        `
        )
        .eq("id", reservationId)
        .single()
    : { data: null };
  const reservation = data as ConfirmedReservation | null;

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-sm md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-700" />
          </div>

          <p className="mt-6 text-sm font-medium uppercase tracking-[0.28em] text-stone-500">
            Reserva recebida
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            Sua reserva foi criada como pendente.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
            Recebemos os dados da sua reserva. Em breve, a equipe poderá
            confirmar disponibilidade e pagamento.
          </p>

          {reservation ? (
            <div className="mt-8 rounded-3xl bg-stone-50 p-5 text-left text-sm text-stone-700">
              <div className="grid gap-3">
                <div className="flex justify-between gap-4">
                  <span>Acomodação</span>
                  <strong className="text-right text-stone-950">
                    {Array.isArray(reservation.units)
                      ? reservation.units[0]?.name
                      : reservation.units?.name}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Check-in</span>
                  <strong className="text-stone-950">
                    {reservation.check_in}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Check-out</span>
                  <strong className="text-stone-950">
                    {reservation.check_out}
                  </strong>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Hóspedes</span>
                  <strong className="text-stone-950">
                    {reservation.guests_count}
                  </strong>
                </div>

                <div className="flex justify-between gap-4 border-t border-stone-200 pt-3">
                  <span>Total estimado</span>
                  <strong className="text-stone-950">
                    ${reservation.total}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-stone-950 px-6 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Fazer nova busca
            </Link>

            <Link
              href={process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL || "/"}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-stone-200 bg-white px-6 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
