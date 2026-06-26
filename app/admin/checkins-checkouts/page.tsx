export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  LogIn,
  LogOut,
  Mail,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

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
    awaiting_payment: "Aguardando pagamento",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    checked_in: "Check-in feito",
    checked_out: "Check-out feito",
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
    refunded: "Reembolsado",
  };

  return labels[String(status || "")] || String(status || "—");
}

function getStatusClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    pending:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    awaiting_payment:
      "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
    confirmed:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    cancelled:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
    checked_in:
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-400/10 dark:text-purple-300 dark:ring-purple-400/20",
    checked_out:
      "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
    no_show:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
  };

  return (
    classes[String(status || "")] ||
    "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
  );
}

function getPaymentStatusClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    unpaid:
      "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
    pending:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    failed:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
    refunded:
      "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
  };

  return (
    classes[String(status || "")] ||
    "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
  );
}

type ReservationItem = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  guests_count: number | string | null;
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  units:
    | {
        name: string | null;
        slug: string | null;
        cover_image: string | null;
      }
    | {
        name: string | null;
        slug: string | null;
        cover_image: string | null;
      }[]
    | null;
  guests:
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
        country: string | null;
      }
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
        country: string | null;
      }[]
    | null;
};

function ReservationCard({
  reservation,
  dateType,
}: {
  reservation: ReservationItem;
  dateType: "checkin" | "checkout";
}) {
  const unit = Array.isArray(reservation.units)
    ? reservation.units[0]
    : reservation.units;

  const guest = Array.isArray(reservation.guests)
    ? reservation.guests[0]
    : reservation.guests;

  const dateLabel =
    dateType === "checkin"
      ? formatDate(reservation.check_in)
      : formatDate(reservation.check_out);

  const dateText = dateType === "checkin" ? "Entrada" : "Saída";

  return (
    <article className="grid gap-5 rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5 transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-primary-soft)] lg:grid-cols-[112px_1fr_220px] lg:items-center">
      <div
        className="h-36 rounded-[1.35rem] bg-[var(--app-primary-soft)] bg-cover bg-center lg:h-24"
        style={{
          backgroundImage: unit?.cover_image
            ? `url(${unit.cover_image})`
            : undefined,
        }}
      >
        {!unit?.cover_image ? (
          <div className="flex h-full w-full items-center justify-center text-[var(--app-primary)]">
            <BedDouble className="h-6 w-6" />
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getStatusClasses(
              reservation.status
            )}`}
          >
            {getStatusLabel(reservation.status)}
          </span>

          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getPaymentStatusClasses(
              reservation.payment_status
            )}`}
          >
            {getPaymentStatusLabel(reservation.payment_status)}
          </span>
        </div>

        <h3 className="mt-4 truncate text-2xl font-black tracking-[-0.045em] text-[var(--app-text)]">
          {guest?.name || "Hóspede sem nome"}
        </h3>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--app-text-soft)]">
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-[var(--app-primary)]" />
            <span className="font-medium">{guest?.email || "E-mail não informado"}</span>
          </span>

          <span className="inline-flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-[var(--app-primary)]" />
            <span className="font-medium">{unit?.name || "Acomodação"}</span>
          </span>

          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--app-primary)]" />
            <span className="font-medium">
              {formatNumber(reservation.guests_count)} pessoa
              {Number(reservation.guests_count || 0) !== 1 ? "s" : ""}
            </span>
          </span>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-black text-[var(--app-text)] dark:bg-white/5">
          <CalendarDays className="h-4 w-4 text-[var(--app-primary)]" />
          {dateText}: {dateLabel}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-[var(--app-border)] bg-white p-4 dark:bg-white/5 lg:flex-col lg:items-stretch">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
            Total
          </p>

          <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
            {formatMoney(reservation.total)}
          </p>
        </div>

        <Link
          href={`/admin/reservas/${reservation.id}`}
          className="admin-btn-primary min-h-11 px-5 text-sm lg:w-full"
        >
          Abrir
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-card-soft)] p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-text-soft)]">
        {description}
      </p>
    </div>
  );
}

function MovementSection({
  title,
  description,
  icon,
  reservations,
  dateType,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  reservations: ReservationItem[];
  dateType: "checkin" | "checkout";
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-[var(--app-text-soft)]">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
          {icon}
        </div>
      </div>

      <div className="grid gap-4">
        {reservations.length === 0 ? (
          <EmptyState
            icon={icon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              dateType={dateType}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default async function AdminCheckinsCheckoutsPage() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    todayCheckinsResult,
    todayCheckoutsResult,
    nextCheckinsResult,
    nextCheckoutsResult,
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        `
        id,
        check_in,
        check_out,
        guests_count,
        total,
        status,
        payment_status,
        units (
          name,
          slug,
          cover_image
        ),
        guests (
          name,
          email,
          phone,
          country
        )
      `
      )
      .eq("check_in", today)
      .in("status", ["confirmed", "awaiting_payment", "checked_in", "pending"])
      .order("created_at", { ascending: false }),

    supabase
      .from("reservations")
      .select(
        `
        id,
        check_in,
        check_out,
        guests_count,
        total,
        status,
        payment_status,
        units (
          name,
          slug,
          cover_image
        ),
        guests (
          name,
          email,
          phone,
          country
        )
      `
      )
      .eq("check_out", today)
      .in("status", ["confirmed", "checked_in", "checked_out"])
      .order("created_at", { ascending: false }),

    supabase
      .from("reservations")
      .select(
        `
        id,
        check_in,
        check_out,
        guests_count,
        total,
        status,
        payment_status,
        units (
          name,
          slug,
          cover_image
        ),
        guests (
          name,
          email,
          phone,
          country
        )
      `
      )
      .gt("check_in", today)
      .in("status", ["confirmed", "awaiting_payment", "pending"])
      .order("check_in", { ascending: true })
      .limit(8),

    supabase
      .from("reservations")
      .select(
        `
        id,
        check_in,
        check_out,
        guests_count,
        total,
        status,
        payment_status,
        units (
          name,
          slug,
          cover_image
        ),
        guests (
          name,
          email,
          phone,
          country
        )
      `
      )
      .gt("check_out", today)
      .in("status", ["confirmed", "checked_in"])
      .order("check_out", { ascending: true })
      .limit(8),
  ]);

  if (todayCheckinsResult.error) {
    throw new Error(todayCheckinsResult.error.message);
  }

  if (todayCheckoutsResult.error) {
    throw new Error(todayCheckoutsResult.error.message);
  }

  if (nextCheckinsResult.error) {
    throw new Error(nextCheckinsResult.error.message);
  }

  if (nextCheckoutsResult.error) {
    throw new Error(nextCheckoutsResult.error.message);
  }

  const todayCheckins = todayCheckinsResult.data || [];
  const todayCheckouts = todayCheckoutsResult.data || [];
  const nextCheckins = nextCheckinsResult.data || [];
  const nextCheckouts = nextCheckoutsResult.data || [];

  const stats = [
    {
      label: "Check-ins hoje",
      value: todayCheckins.length,
      helper: "Entradas previstas",
      icon: LogIn,
    },
    {
      label: "Check-outs hoje",
      value: todayCheckouts.length,
      helper: "Saídas previstas",
      icon: LogOut,
    },
    {
      label: "Próximos check-ins",
      value: nextCheckins.length,
      helper: "Entradas futuras",
      icon: LogIn,
    },
    {
      label: "Próximos check-outs",
      value: nextCheckouts.length,
      helper: "Saídas futuras",
      icon: LogOut,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
                {item.label}
              </p>

              <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
                {formatNumber(item.value)}
              </p>

              <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
                {item.helper}
              </p>
            </div>
          );
        })}
      </section>

      <MovementSection
        title="Check-ins de hoje"
        description="Entradas previstas para hoje com informações do hóspede, acomodação e valor."
        icon={<LogIn className="h-5 w-5" />}
        reservations={todayCheckins}
        dateType="checkin"
        emptyTitle="Nenhum check-in hoje"
        emptyDescription="As entradas previstas para hoje aparecerão aqui."
      />

      <MovementSection
        title="Check-outs de hoje"
        description="Saídas previstas para hoje com acesso rápido à reserva."
        icon={<LogOut className="h-5 w-5" />}
        reservations={todayCheckouts}
        dateType="checkout"
        emptyTitle="Nenhum check-out hoje"
        emptyDescription="As saídas previstas para hoje aparecerão aqui."
      />

      <MovementSection
        title="Próximos check-ins"
        description="Entradas futuras confirmadas, pendentes ou aguardando pagamento."
        icon={<LogIn className="h-5 w-5" />}
        reservations={nextCheckins}
        dateType="checkin"
        emptyTitle="Nenhum próximo check-in"
        emptyDescription="As próximas entradas aparecerão aqui."
      />

      <MovementSection
        title="Próximos check-outs"
        description="Saídas futuras já confirmadas."
        icon={<LogOut className="h-5 w-5" />}
        reservations={nextCheckouts}
        dateType="checkout"
        emptyTitle="Nenhum próximo check-out"
        emptyDescription="As próximas saídas aparecerão aqui."
      />
    </div>
  );
}