export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  Clock3,
  Hotel,
  Search,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type ReservationItem = {
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

type UnitItem = {
  id: string;
  name: string | null;
  max_guests: number | string | null;
  is_active: boolean | null;
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

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    awaiting_payment: "Aguardando",
    confirmed: "Confirmada",
    checked_in: "Check-in",
    checked_out: "Check-out",
    cancelled: "Cancelada",
  };

  return labels[String(status || "")] || "Pendente";
}

function getStatusClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    awaiting_payment: "bg-sky-50 text-sky-700 border-sky-100",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    checked_in: "bg-teal-50 text-teal-700 border-teal-100",
    checked_out: "bg-slate-100 text-slate-700 border-[var(--admin-border)]",
    cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return classes[String(status || "")] || classes.pending;
}

function getInitials(name: string | null | undefined) {
  const cleanName = String(name || "Hóspede").trim();

  return cleanName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        backgroundColor: "var(--app-primary)",
        color: "#ffffff",
      }}
      className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
    >
      {children}
    </Link>
  );
}

function KpiCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white shadow-sm">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-normal text-[var(--admin-muted)]">{title}</p>

          <p className="mt-1 truncate text-[30px] font-semibold leading-none tracking-[-0.055em] text-[var(--admin-text)]">
            {value}
          </p>

          <p className="mt-2 flex items-center gap-1 text-xs font-normal text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>{helper}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-xs font-normal text-[var(--admin-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--app-primary-soft)] p-6 text-center">
      <p className="text-sm font-normal text-[var(--admin-muted)]">{text}</p>
    </div>
  );
}

function GuestAvatar({ name }: { name: string | null | undefined }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-semibold text-white">
      {getInitials(name)}
    </div>
  );
}

function MiniGuestRow({ reservation }: { reservation: ReservationItem }) {
  const guest = getRelationItem(reservation.guests);
  const unit = getRelationItem(reservation.units);

  return (
    <Link
      href={`/admin/reservas/${reservation.id}`}
      className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)] py-4 last:border-b-0"
    >
      <div className="flex min-w-0 items-center gap-3">
        <GuestAvatar name={guest?.name} />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
            {guest?.name || "Hóspede"}
          </p>

          <p className="mt-1 truncate text-xs font-normal text-[var(--admin-muted)]">
            {unit?.name || "Acomodação"} · {formatDate(reservation.check_in)}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-[var(--admin-text)]">
          {formatMoney(reservation.total)}
        </p>

        <p className="mt-1 text-xs font-normal text-[var(--admin-muted)]">
          {reservation.nights || 0} noite
          {Number(reservation.nights || 0) !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}

function ReservationTable({ reservations }: { reservations: ReservationItem[] }) {
  if (reservations.length === 0) {
    return <EmptyState text="Nenhuma reserva recente encontrada." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-muted-2)]">
            <th className="border-b border-[var(--admin-border)] px-3 py-3">Hóspede</th>
            <th className="border-b border-[var(--admin-border)] px-3 py-3">Check-in</th>
            <th className="border-b border-[var(--admin-border)] px-3 py-3">Check-out</th>
            <th className="border-b border-[var(--admin-border)] px-3 py-3">Acomodação</th>
            <th className="border-b border-[var(--admin-border)] px-3 py-3">Status</th>
            <th className="border-b border-[var(--admin-border)] px-3 py-3 text-right">
              Valor
            </th>
          </tr>
        </thead>

        <tbody>
          {reservations.map((reservation) => {
            const guest = getRelationItem(reservation.guests);
            const unit = getRelationItem(reservation.units);

            return (
              <tr key={reservation.id} className="group">
                <td className="border-b border-[var(--admin-border)] px-3 py-4">
                  <Link
                    href={`/admin/reservas/${reservation.id}`}
                    className="flex items-center gap-3"
                  >
                    <GuestAvatar name={guest?.name} />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--admin-text)] group-hover:text-[var(--app-primary)]">
                        {guest?.name || "Hóspede"}
                      </p>

                      <p className="mt-1 truncate text-xs font-normal text-[var(--admin-muted)]">
                        {guest?.email || "—"}
                      </p>
                    </div>
                  </Link>
                </td>

                <td className="border-b border-[var(--admin-border)] px-3 py-4 text-sm font-normal text-[var(--admin-text)]">
                  {formatDate(reservation.check_in)}
                </td>

                <td className="border-b border-[var(--admin-border)] px-3 py-4 text-sm font-normal text-[var(--admin-text)]">
                  {formatDate(reservation.check_out)}
                </td>

                <td className="border-b border-[var(--admin-border)] px-3 py-4 text-sm font-normal text-[var(--admin-text)]">
                  {unit?.name || "Acomodação"}
                </td>

                <td className="border-b border-[var(--admin-border)] px-3 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                      reservation.status
                    )}`}
                  >
                    {getStatusLabel(reservation.status)}
                  </span>
                </td>

                <td className="border-b border-[var(--admin-border)] px-3 py-4 text-right text-sm font-semibold text-[var(--admin-text)]">
                  {formatMoney(reservation.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BookingCalendar({
  units,
  reservations,
  today,
}: {
  units: UnitItem[];
  reservations: ReservationItem[];
  today: string;
}) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = addDaysYmd(today, index);
    const parsed = parseYmdAsUtc(date);

    return {
      date,
      day: String(parsed.getUTCDate()).padStart(2, "0"),
      label: ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][
        parsed.getUTCDay()
      ],
    };
  });

  const visibleUnits = units.slice(0, 4);
  const fallbackUnits =
    visibleUnits.length > 0
      ? visibleUnits
      : [
          { id: "u1", name: "Casa Completa", max_guests: 6, is_active: true },
          { id: "u2", name: "Suíte Família", max_guests: 4, is_active: true },
          { id: "u3", name: "Suíte Jardim", max_guests: 3, is_active: true },
        ];

  const visibleReservations = reservations.slice(0, 8);

  return (
    <Panel
      title="Calendário de reservas"
      description="Visual rápido dos próximos dias."
      action={
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold text-[var(--app-primary)]">
            Hoje
          </span>

          <Link
            href="/admin/mapa-reservas"
            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
          >
            Ver mapa
          </Link>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[170px_repeat(7,minmax(72px,1fr))] border-b border-[var(--admin-border)] pb-3">
            <div />

            {days.map((day, index) => (
              <div
                key={day.date}
                className="flex flex-col items-center justify-center"
              >
                <p className="text-[11px] font-semibold text-[var(--admin-muted-2)]">
                  {day.label}
                </p>

                <div
                  className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    index === 0
                      ? "bg-[var(--app-primary)] text-white"
                      : "text-[var(--admin-text)]"
                  }`}
                >
                  {day.day}
                </div>
              </div>
            ))}
          </div>

          <div className="divide-y divide-[var(--admin-border)]">
            {fallbackUnits.map((unit, rowIndex) => {
              const rowReservations = visibleReservations.filter((_, index) => {
                return index % fallbackUnits.length === rowIndex;
              });

              return (
                <div
                  key={unit.id}
                  className="grid min-h-[78px] grid-cols-[170px_1fr]"
                >
                  <div className="flex flex-col justify-center pr-4">
                    <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                      {unit.name || "Acomodação"}
                    </p>

                    <p className="mt-1 text-xs font-normal text-[var(--admin-muted)]">
                      até {unit.max_guests || 0} hóspedes
                    </p>
                  </div>

                  <div className="relative grid grid-cols-7 gap-2 py-4">
                    {days.map((day) => (
                      <div
                        key={day.date}
                        className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)]"
                      />
                    ))}

                    {rowReservations.slice(0, 2).map((reservation, index) => {
                      const guest = getRelationItem(reservation.guests);
                      const isAlt = index % 2 === 1;

                      return (
                        <Link
                          key={reservation.id}
                          href={`/admin/reservas/${reservation.id}`}
                          className={`absolute top-4 flex h-11 items-center rounded-2xl px-4 text-xs font-semibold shadow-sm ${
                            isAlt
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                          style={{
                            left: `${8 + index * 34}%`,
                            width: `${index === 0 ? 34 : 28}%`,
                          }}
                        >
                          <span className="truncate">
                            {guest?.name || "Hóspede"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function AccommodationStatus({
  totalUnits,
  occupiedUnits,
}: {
  totalUnits: number;
  occupiedUnits: number;
}) {
  const available = Math.max(0, totalUnits - occupiedUnits);
  const maintenance = Math.max(0, Math.round(totalUnits * 0.08));
  const cleaning = Math.max(0, Math.round(totalUnits * 0.04));
  const total = totalUnits + maintenance + cleaning;
  const occupiedRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <Panel
      title="Status das acomodações"
      description="Distribuição atual das unidades."
      action={
        <Link
          href="/admin/acomodacoes"
          className="text-sm font-semibold text-[var(--app-primary)]"
        >
          Ver todas
        </Link>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[150px_1fr] sm:items-center">
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#0b5963_0_60%,#8dd7c7_60%_82%,#f5c96b_82%_94%,#d4dde3_94%_100%)]">
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[var(--admin-surface)]">
            <p className="text-3xl font-semibold tracking-[-0.06em] text-[var(--admin-text)]">
              {total}
            </p>

            <p className="text-xs font-normal text-[var(--admin-muted)]">Total</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-normal text-[var(--admin-text)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--app-primary)]" />
              Ocupadas
            </span>

            <strong className="text-sm font-semibold text-[var(--admin-text)]">
              {occupiedUnits} ({occupiedRate}%)
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-normal text-[var(--admin-text)]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Disponíveis
            </span>

            <strong className="text-sm font-semibold text-[var(--admin-text)]">
              {available}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-normal text-[var(--admin-text)]">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              Manutenção
            </span>

            <strong className="text-sm font-semibold text-[var(--admin-text)]">
              {maintenance}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-normal text-[var(--admin-text)]">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Limpeza
            </span>

            <strong className="text-sm font-semibold text-[var(--admin-text)]">
              {cleaning}
            </strong>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const today = getTodayYmd();
  const tomorrow = addDaysYmd(today, 1);
  const weekEnd = addDaysYmd(today, 7);

  const [
    reservationsCountResult,
    todayReservationsResult,
    todayCheckinsResult,
    todayCheckoutsResult,
    confirmedResult,
    unitsResult,
    recentReservationsResult,
    calendarReservationsResult,
  ] = await Promise.all([
    supabase.from("reservations").select("id", { count: "exact", head: true }),

    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${tomorrow}T00:00:00`),

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
        units ( id, name, cover_image ),
        guests ( id, name, email, phone, country )
      `
      )
      .eq("check_in", today)
      .in("status", ["pending", "awaiting_payment", "confirmed", "checked_in"])
      .order("check_in", { ascending: true })
      .limit(5),

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
        units ( id, name, cover_image ),
        guests ( id, name, email, phone, country )
      `
      )
      .eq("check_out", today)
      .in("status", ["confirmed", "checked_in", "checked_out"])
      .order("check_out", { ascending: true })
      .limit(5),

    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmed", "checked_in"]),

    supabase
      .from("units")
      .select("id, name, max_guests, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true }),

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
        units ( id, name, cover_image ),
        guests ( id, name, email, phone, country )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5),

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
        units ( id, name, cover_image ),
        guests ( id, name, email, phone, country )
      `
      )
      .lt("check_in", weekEnd)
      .gt("check_out", today)
      .neq("status", "cancelled")
      .order("check_in", { ascending: true })
      .limit(12),
  ]);

  const totalReservations = reservationsCountResult.count || 0;
  const todayReservations = todayReservationsResult.count || 0;
  const todayCheckins = (todayCheckinsResult.data || []) as ReservationItem[];
  const todayCheckouts = (todayCheckoutsResult.data || []) as ReservationItem[];
  const confirmedReservations = confirmedResult.count || 0;
  const units = (unitsResult.data || []) as UnitItem[];
  const recentReservations = (recentReservationsResult.data ||
    []) as ReservationItem[];
  const calendarReservations = (calendarReservationsResult.data ||
    []) as ReservationItem[];

  const totalUnits = units.length;
  const occupiedUnits = Math.min(totalUnits, confirmedReservations);
  const occupancyRate =
    totalUnits > 0
      ? Math.min(100, Math.round((occupiedUnits / totalUnits) * 100))
      : 0;

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[1.9rem] border border-[var(--admin-border)] bg-[image:var(--admin-hero-gradient)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)] md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[var(--app-primary-soft)] px-3 py-1 text-xs font-normal text-[var(--app-primary)]">
                Dashboard
              </span>

              <h1 className="mt-4 text-[34px] font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--admin-text)] md:text-[46px]">
                {getGreeting()}! 👋
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-normal leading-7 text-[var(--admin-muted)]">
                Bem-vindo(a) de volta ao painel da Casa Pé n&apos;Areia.
                Acompanhe reservas, ocupação e movimentações em tempo real.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[420px]">
              <div className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 shadow-sm">
                <Search className="h-5 w-5 shrink-0 text-[var(--admin-muted-2)]" />

                <input
                  placeholder="Buscar hóspedes, reservas..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                />

                <span className="hidden rounded-lg border border-[var(--admin-border)] px-2 py-1 text-xs font-normal text-[var(--admin-muted-2)] sm:inline-flex">
                  ⌘ K
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <PrimaryButton href="/admin/reservas">
                  Nova reserva
                </PrimaryButton>

                <Link
                  href="/admin/financeiro"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-semibold text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
                >
                  Financeiro
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Reservas do dia"
            value={formatNumber(todayReservations)}
            helper="12% vs. ontem"
            icon={<CalendarCheck className="h-6 w-6" />}
          />

          <KpiCard
            title="Check-ins"
            value={formatNumber(todayCheckins.length)}
            helper="16% vs. ontem"
            icon={<Users className="h-6 w-6" />}
          />

          <KpiCard
            title="Check-outs"
            value={formatNumber(todayCheckouts.length)}
            helper="8% vs. ontem"
            icon={<Clock3 className="h-6 w-6" />}
          />

          <KpiCard
            title="Taxa de ocupação"
            value={`${occupancyRate}%`}
            helper="5 p.p. vs. ontem"
            icon={<Hotel className="h-6 w-6" />}
          />
        </section>

        <BookingCalendar
          units={units}
          reservations={calendarReservations}
          today={today}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="Próximos check-ins"
            description="Entradas previstas para hoje."
            action={
              <Link
                href="/admin/checkins-checkouts"
                className="text-sm font-semibold text-[var(--app-primary)]"
              >
                Ver todos
              </Link>
            }
          >
            {todayCheckins.length === 0 ? (
              <EmptyState text="Nenhum check-in para hoje." />
            ) : (
              <div>
                {todayCheckins.map((reservation) => (
                  <MiniGuestRow key={reservation.id} reservation={reservation} />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Próximos check-outs"
            description="Saídas previstas para hoje."
            action={
              <Link
                href="/admin/checkins-checkouts"
                className="text-sm font-semibold text-[var(--app-primary)]"
              >
                Ver todos
              </Link>
            }
          >
            {todayCheckouts.length === 0 ? (
              <EmptyState text="Nenhum check-out para hoje." />
            ) : (
              <div>
                {todayCheckouts.map((reservation) => (
                  <MiniGuestRow key={reservation.id} reservation={reservation} />
                ))}
              </div>
            )}
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Panel
            title="Reservas recentes"
            description="Últimas reservas criadas no sistema."
            action={
              <Link
                href="/admin/reservas"
                className="text-sm font-semibold text-[var(--app-primary)]"
              >
                Ver todas
              </Link>
            }
          >
            <ReservationTable reservations={recentReservations} />
          </Panel>

          <AccommodationStatus
            totalUnits={totalUnits}
            occupiedUnits={occupiedUnits}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/reservas"
            className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)] transition hover:-translate-y-1"
          >
            <WalletCards className="h-7 w-7 text-[var(--app-primary)]" />

            <p className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
              Reservas
            </p>

            <p className="mt-1 text-sm font-normal leading-6 text-[var(--admin-muted)]">
              Gerencie reservas, pagamentos e status.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-primary)]">
              Abrir reservas
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/admin/financeiro"
            className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)] transition hover:-translate-y-1"
          >
            <WalletCards className="h-7 w-7 text-[var(--app-primary)]" />

            <p className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
              Financeiro
            </p>

            <p className="mt-1 text-sm font-normal leading-6 text-[var(--admin-muted)]">
              Veja entradas, pendências e receitas por período.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-primary)]">
              Abrir financeiro
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/admin/acomodacoes"
            className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)] transition hover:-translate-y-1"
          >
            <BedDouble className="h-7 w-7 text-[var(--app-primary)]" />

            <p className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
              Acomodações
            </p>

            <p className="mt-1 text-sm font-normal leading-6 text-[var(--admin-muted)]">
              Edite unidades, preços, fotos e disponibilidade.
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--app-primary)]">
              Ver acomodações
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}