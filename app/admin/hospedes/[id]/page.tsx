import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Eye,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  WalletCards,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminGuestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const [year, month, day] = value.split("-");

    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function getStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    awaiting_payment: "Pagamento",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    checked_in: "Check-in",
    checked_out: "Check-out",
    no_show: "No-show",
  };

  return labels[String(status || "")] || String(status || "—");
}

function getPaymentStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    unpaid: "Não pago",
    pending: "Pendente",
    paid: "Pago",
    failed: "Falhou",
    refunded: "Reembolso",
  };

  return labels[String(status || "")] || String(status || "—");
}

function getStatusClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    pending:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    awaiting_payment:
      "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
    confirmed:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    cancelled:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
    checked_in:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-400/10 dark:text-purple-300 dark:ring-purple-400/20",
    checked_out:
      "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
    no_show:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
  };

  return (
    classes[String(status || "")] ||
    "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
  );
}

function getPaymentStatusClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    unpaid:
      "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
    pending:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    failed:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
    refunded:
      "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
  };

  return (
    classes[String(status || "")] ||
    "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
  );
}

export default async function AdminGuestDetailPage({
  params,
}: AdminGuestDetailPageProps) {
  const { id } = await params;

  const supabase = createAdminClient();

  const { data: guest, error } = await supabase
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
        guests_count,
        nights,
        subtotal,
        cleaning_fee,
        discount,
        total,
        status,
        payment_status,
        source,
        created_at,
        units (
          id,
          name,
          slug,
          cover_image
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !guest) {
    notFound();
  }

  const reservations = Array.isArray(guest.reservations)
    ? guest.reservations
    : [];

  const totalSpent = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.total || 0),
    0
  );

  const confirmedReservations = reservations.filter(
    (reservation) => reservation.status === "confirmed"
  ).length;

  const pendingReservations = reservations.filter(
    (reservation) =>
      reservation.status === "pending" ||
      reservation.status === "awaiting_payment"
  ).length;

  const paidReservations = reservations.filter(
    (reservation) => reservation.payment_status === "paid"
  ).length;

  const lastReservation = reservations[0];

  return (
    <div className="space-y-5 font-sans">
      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)] md:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--app-teal-light)]/18 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-[var(--app-primary)]/10 blur-3xl" />

          <div className="relative">
            <Link
              href="/admin/hospedes"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--app-primary-soft)] px-3 py-1.5 text-xs font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-teal-muted)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para hóspedes
            </Link>

            <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] bg-[var(--app-primary)] text-white shadow-sm">
                <User className="h-8 w-8" />
              </div>

              <div>
                <h2 className="max-w-3xl text-[30px] font-black leading-[1.05] tracking-[-0.045em] text-[var(--app-text)] md:text-[42px]">
                  {guest.name || "Hóspede sem nome"}
                </h2>

                <p className="mt-2 text-sm font-medium text-[var(--app-text-soft)]">
                  Cliente desde {formatDate(guest.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-white/80 p-4 dark:bg-white/5">
                <p className="text-xs font-medium text-[var(--app-text-muted)]">
                  Reservas
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
                  {formatNumber(reservations.length)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-white/80 p-4 dark:bg-white/5">
                <p className="text-xs font-medium text-[var(--app-text-muted)]">
                  Valor total
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
                  {formatMoney(totalSpent)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-white/80 p-4 dark:bg-white/5">
                <p className="text-xs font-medium text-[var(--app-text-muted)]">
                  Pagas
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
                  {formatNumber(paidReservations)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-primary)] p-6 text-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60 dark:text-[var(--app-text-muted)]">
            Contato
          </p>

          <h3 className="mt-2 text-xl font-black text-white dark:text-[var(--app-text)]">
            Dados do hóspede
          </h3>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-white/12 p-4 dark:bg-[var(--app-card-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold text-white/65 dark:text-[var(--app-text-soft)]">
                <Mail className="h-4 w-4" />
                E-mail
              </div>

              <p className="mt-2 break-all text-sm font-bold text-white dark:text-[var(--app-text)]">
                {guest.email || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/12 p-4 dark:bg-[var(--app-card-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold text-white/65 dark:text-[var(--app-text-soft)]">
                <Phone className="h-4 w-4" />
                Telefone
              </div>

              <p className="mt-2 text-sm font-bold text-white dark:text-[var(--app-text)]">
                {guest.phone || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/12 p-4 dark:bg-[var(--app-card-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold text-white/65 dark:text-[var(--app-text-soft)]">
                <MapPin className="h-4 w-4" />
                País
              </div>

              <p className="mt-2 text-sm font-bold text-white dark:text-[var(--app-text)]">
                {guest.country || "—"}
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <CalendarCheck className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-bold text-[var(--app-text-soft)]">
            Confirmadas
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatNumber(confirmedReservations)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <WalletCards className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-bold text-[var(--app-text-soft)]">
            Pendentes
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatNumber(pendingReservations)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <Users className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-bold text-[var(--app-text-soft)]">
            Pessoas hospedadas
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatNumber(
              reservations.reduce(
                (sum, reservation) =>
                  sum + Number(reservation.guests_count || 0),
                0
              )
            )}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <Eye className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-bold text-[var(--app-text-soft)]">
            Última reserva
          </p>

          <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
            {lastReservation
              ? formatDateOnly(lastReservation.check_in)
              : "—"}
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
              Histórico de reservas
            </h2>

            <p className="mt-1 text-sm text-[var(--app-text-soft)]">
              Todas as reservas feitas por este hóspede.
            </p>
          </div>

          <Link
            href="/admin/reservas"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-5 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
          >
            Ver todas as reservas
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-card-soft)] p-10 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-[var(--app-primary)]" />

            <h3 className="mt-4 text-xl font-black text-[var(--app-text)]">
              Nenhuma reserva encontrada
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--app-text-soft)]">
              Quando este hóspede fizer uma reserva, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {reservations.map((reservation) => {
              const unit = Array.isArray(reservation.units)
                ? reservation.units[0]
                : reservation.units;

              return (
                <Link
                  key={reservation.id}
                  href={`/admin/reservas/${reservation.id}`}
                  className="grid gap-4 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4 transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-primary-soft)] md:grid-cols-[80px_1fr_auto]"
                >
                  <div
                    className="h-20 rounded-2xl bg-[var(--app-primary-soft)] bg-cover bg-center"
                    style={{
                      backgroundImage: unit?.cover_image
                        ? `url(${unit.cover_image})`
                        : undefined,
                    }}
                  />

                  <div>
                    <p className="text-base font-black tracking-[-0.02em] text-[var(--app-text)]">
                      {unit?.name || "Acomodação"}
                    </p>

                    <p className="mt-1 text-sm text-[var(--app-text-soft)]">
                      {formatDateOnly(reservation.check_in)} até{" "}
                      {formatDateOnly(reservation.check_out)} ·{" "}
                      {formatNumber(reservation.guests_count)} pessoa
                      {Number(reservation.guests_count || 0) !== 1 ? "s" : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                          reservation.status
                        )}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClasses(
                          reservation.payment_status
                        )}`}
                      >
                        {getPaymentStatusLabel(reservation.payment_status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                    <p className="text-xl font-black tracking-[-0.04em] text-[var(--app-text)]">
                      {formatMoney(reservation.total)}
                    </p>

                    <span className="text-sm font-bold text-[var(--app-primary)]">
                      Abrir
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}