export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Filter,
  LockKeyhole,
  MapIcon,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type MapaReservasPageProps = {
  searchParams: Promise<{
    start?: string;
    days?: string;
    unit?: string;
    q?: string;
  }>;
};

type UnitItem = {
  id: string;
  name: string | null;
  max_guests: number | string | null;
  is_active: boolean | null;
};

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

type TimelineItem = {
  id: string;
  unit_id: string | null;
  type: "reservation" | "blocked";
  start: string;
  end: string;
  title: string;
  subtitle: string;
  status: string;
  payment_status?: string | null;
  total?: number | string | null;
  guests_count?: number | string | null;
  nights?: number | string | null;
  href?: string;
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

function differenceInDays(start: string, end: string) {
  const startDate = parseYmdAsUtc(start);
  const endDate = parseYmdAsUtc(end);

  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function getDayLabel(value: string) {
  const date = parseYmdAsUtc(value);

  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][date.getUTCDay()];
}

function getDayNumber(value: string) {
  const date = parseYmdAsUtc(value);

  return String(date.getUTCDate()).padStart(2, "0");
}

function getMonthLabel(value: string) {
  const date = parseYmdAsUtc(value);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function getStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    awaiting_payment: "Aguardando",
    confirmed: "Confirmada",
    checked_in: "Check-in",
    checked_out: "Check-out",
    cancelled: "Cancelada",
    blocked: "Bloqueio",
  };

  return labels[String(status || "")] || "Pendente";
}

function getItemClassName(item: TimelineItem) {
  if (item.type === "blocked") {
    return "bg-slate-600 text-white border-slate-600";
  }

  const classes: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900 border-amber-200",
    awaiting_payment: "bg-sky-100 text-sky-900 border-sky-200",
    confirmed: "bg-[#0b5963] text-white border-[#0b5963]",
    checked_in: "bg-emerald-600 text-white border-emerald-600",
    checked_out: "bg-slate-200 text-slate-700 border-slate-300",
    cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return classes[item.status] || classes.pending;
}

function getItemPosition({
  item,
  startDate,
  totalDays,
}: {
  item: TimelineItem;
  startDate: string;
  totalDays: number;
}) {
  const itemStartOffset = differenceInDays(startDate, item.start);
  const itemEndOffset = differenceInDays(startDate, item.end);

  const left = clamp(itemStartOffset, 0, totalDays);
  const right = clamp(itemEndOffset, 0, totalDays);

  const width = Math.max(1, right - left);

  return {
    leftPercent: (left / totalDays) * 100,
    widthPercent: (width / totalDays) * 100,
  };
}

function buildMapUrl(params: {
  start?: string;
  days?: string;
  unit?: string;
  q?: string;
}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  const query = search.toString();

  return query ? `/admin/mapa-reservas?${query}` : "/admin/mapa-reservas";
}

function SummaryCard({
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
    <article className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--admin-muted)]">{title}</p>

          <p className="mt-1 truncate text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {value}
          </p>

          <p className="mt-1 text-xs font-bold text-[var(--admin-muted-2)]">{helper}</p>
        </div>
      </div>
    </article>
  );
}

function LegendItem({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-black text-[var(--admin-text)]">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function TimelineBar({
  item,
  startDate,
  totalDays,
}: {
  item: TimelineItem;
  startDate: string;
  totalDays: number;
}) {
  const position = getItemPosition({
    item,
    startDate,
    totalDays,
  });

  const content = (
    <div
      className={`absolute top-3 flex h-12 min-w-[80px] items-center overflow-hidden rounded-2xl border px-3 shadow-[0_10px_25px_rgba(7,52,59,0.12)] transition hover:-translate-y-0.5 ${getItemClassName(
        item
      )}`}
      style={{
        left: `${position.leftPercent}%`,
        width: `${position.widthPercent}%`,
      }}
      title={`${item.title} · ${formatDate(item.start)} até ${formatDate(
        item.end
      )}`}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-black leading-tight">
          {item.title}
        </p>

        <p className="mt-0.5 truncate text-[10px] font-bold opacity-80">
          {item.subtitle}
        </p>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="contents">
        {content}
      </Link>
    );
  }

  return content;
}

export default async function AdminReservationMapPage({
  searchParams,
}: MapaReservasPageProps) {
  const params = await searchParams;

  const start = String(params.start || getTodayYmd()).trim();
  const days = String(params.days || "30").trim();
  const selectedUnit = String(params.unit || "all").trim();
  const q = String(params.q || "").trim().toLowerCase();

  const totalDays = Math.max(7, Math.min(90, Number(days || 30)));
  const end = addDaysYmd(start, totalDays);
  const previousStart = addDaysYmd(start, -totalDays);
  const nextStart = addDaysYmd(start, totalDays);

  const supabase = createAdminClient();

  const [unitsResult, reservationsResult, blockedDatesResult] =
    await Promise.all([
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
          unit_id,
          check_in,
          check_out,
          guests_count,
          nights,
          total,
          status,
          payment_status,
          source,
          guests (
            id,
            name,
            email,
            phone,
            country
          )
        `
        )
        .lt("check_in", end)
        .gt("check_out", start)
        .neq("status", "cancelled")
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

  const timelineReservations: TimelineItem[] = reservations
    .filter((reservation) => reservation.check_in && reservation.check_out)
    .map((reservation) => {
      const guest = getRelationItem(reservation.guests);
      const guestName = guest?.name || "Hóspede";

      return {
        id: `reservation-${reservation.id}`,
        unit_id: reservation.unit_id,
        type: "reservation",
        start: reservation.check_in as string,
        end: reservation.check_out as string,
        title: guestName,
        subtitle: `${getStatusLabel(reservation.status)} · ${formatMoney(
          reservation.total
        )}`,
        status: reservation.status || "pending",
        payment_status: reservation.payment_status,
        total: reservation.total,
        guests_count: reservation.guests_count,
        nights: reservation.nights,
        href: `/admin/reservas/${reservation.id}`,
      };
    });

  const timelineBlocked: TimelineItem[] = blockedDates
    .filter((blocked) => blocked.start_date && blocked.end_date)
    .map((blocked) => {
      const unit = getRelationItem(blocked.units);
      const reason = blocked.reason || "Bloqueio";

      return {
        id: `blocked-${blocked.id}`,
        unit_id: blocked.unit_id,
        type: "blocked",
        start: blocked.start_date as string,
        end: blocked.end_date as string,
        title: `${reason} · ${unit?.name || "Acomodação"}`,
        subtitle: `${formatDate(blocked.start_date)} até ${formatDate(
          blocked.end_date
        )}`,
        status: "blocked",
      };
    });

  const timelineItems = [...timelineReservations, ...timelineBlocked];

  const filteredUnits = units.filter((unit) => {
    if (selectedUnit !== "all" && unit.id !== selectedUnit) return false;
    if (!q) return true;

    return String(unit.name || "")
      .toLowerCase()
      .includes(q);
  });

  const daysList = Array.from({ length: totalDays }).map((_, index) => {
    const date = addDaysYmd(start, index);

    return {
      date,
      label: getDayLabel(date),
      day: getDayNumber(date),
      month: getMonthLabel(date),
      isToday: date === getTodayYmd(),
      isWeekend:
        getDayLabel(date) === "Sáb" || getDayLabel(date) === "Dom",
    };
  });

  const confirmedCount = timelineReservations.filter((item) => {
    return item.status === "confirmed" || item.status === "checked_in";
  }).length;

  const pendingCount = timelineReservations.filter((item) => {
    return item.status === "pending" || item.status === "awaiting_payment";
  }).length;

  const totalRevenue = timelineReservations.reduce((sum, item) => {
    return sum + Number(item.total || 0);
  }, 0);

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Reservas no período"
            value={String(timelineReservations.length)}
            helper={`${formatDate(start)} até ${formatDate(end)}`}
            icon={<MapIcon className="h-6 w-6" />}
          />

          <SummaryCard
            title="Confirmadas"
            value={String(confirmedCount)}
            helper="Reservas confirmadas ou em check-in"
            icon={<CheckCircle2 className="h-6 w-6" />}
          />

          <SummaryCard
            title="Pendentes"
            value={String(pendingCount)}
            helper="Reservas pendentes ou aguardando pagamento"
            icon={<Users className="h-6 w-6" />}
          />

          <SummaryCard
            title="Bloqueios"
            value={String(timelineBlocked.length)}
            helper={`Receita prevista: ${formatMoney(totalRevenue)}`}
            icon={<LockKeyhole className="h-6 w-6" />}
          />
        </section>

        <form
          action="/admin/mapa-reservas"
          className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)]"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
              <Filter className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--admin-text)]">
                Filtros do mapa
              </h2>

              <p className="text-xs text-[var(--admin-muted)]">
                Escolha o período, quantidade de dias e acomodação.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Data inicial
              </span>

              <input
                type="date"
                name="start"
                defaultValue={start}
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Visualização
              </span>

              <select
                name="days"
                defaultValue={String(totalDays)}
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
              >
                <option value="14">14 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Acomodação
              </span>

              <select
                name="unit"
                defaultValue={selectedUnit}
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
              >
                <option value="all">Todas</option>

                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name || "Acomodação"}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Buscar
              </span>

              <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4">
                <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted-2)]" />

                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Nome da acomodação..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:opacity-90"
                style={{
                  backgroundColor: "var(--app-primary)",
                  color: "#ffffff",
                }}
              >
                Filtrar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={buildMapUrl({
                start: previousStart,
                days: String(totalDays),
                unit: selectedUnit,
                q,
              })}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Período anterior
            </Link>

            <Link
              href={buildMapUrl({
                start: getTodayYmd(),
                days: String(totalDays),
                unit: selectedUnit,
                q,
              })}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)]"
            >
              Hoje
            </Link>

            <Link
              href={buildMapUrl({
                start: nextStart,
                days: String(totalDays),
                unit: selectedUnit,
                q,
              })}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
            >
              Próximo período
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/admin/mapa-reservas"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)]"
            >
              Limpar filtros
            </Link>
          </div>
        </form>

        <section className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
          <div className="flex flex-wrap gap-2">
            <LegendItem label="Confirmada" className="bg-[#0b5963]" />
            <LegendItem label="Check-in" className="bg-emerald-600" />
            <LegendItem label="Aguardando" className="bg-sky-400" />
            <LegendItem label="Pendente" className="bg-amber-400" />
            <LegendItem label="Finalizada" className="bg-slate-400" />
            <LegendItem label="Bloqueio" className="bg-slate-700" />
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--admin-text)]">
              Linha do tempo por acomodação
            </h2>

            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              Arraste horizontalmente para visualizar todos os dias do período.
            </p>
          </div>

          {filteredUnits.length === 0 ? (
            <div className="p-10 text-center">
              <BedDouble className="mx-auto h-12 w-12 text-[var(--app-primary)]" />

              <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                Nenhuma acomodação encontrada
              </h3>

              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                Ajuste os filtros para visualizar o mapa.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="min-w-[980px]"
                style={{
                  width: totalDays > 30 ? `${totalDays * 54 + 260}px` : "100%",
                }}
              >
                <div
                  className="sticky top-0 z-20 grid border-b border-[var(--admin-border)] bg-[var(--admin-surface)]"
                  style={{
                    gridTemplateColumns: `240px repeat(${totalDays}, minmax(48px, 1fr))`,
                  }}
                >
                  <div className="border-r border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                      Acomodação
                    </p>
                  </div>

                  {daysList.map((day) => (
                    <div
                      key={day.date}
                      className={`border-r border-[var(--admin-border)] px-2 py-3 text-center ${
                        day.isToday
                          ? "bg-[var(--app-primary-soft)]"
                          : day.isWeekend
                            ? "bg-[var(--admin-surface-soft)]"
                            : "bg-[var(--admin-surface)]"
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase text-[var(--admin-muted-2)]">
                        {day.label}
                      </p>

                      <p
                        className={`mt-1 text-sm font-black ${
                          day.isToday
                            ? "text-[var(--app-primary)]"
                            : "text-[var(--admin-text)]"
                        }`}
                      >
                        {day.day}
                      </p>

                      <p className="mt-0.5 text-[10px] font-bold capitalize text-[var(--admin-muted-2)]">
                        {day.month}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  {filteredUnits.map((unit) => {
                    const items = timelineItems.filter(
                      (item) => item.unit_id === unit.id
                    );

                    return (
                      <div
                        key={unit.id}
                        className="grid min-h-[86px] border-b border-[var(--admin-border)]"
                        style={{
                          gridTemplateColumns: `240px 1fr`,
                        }}
                      >
                        <div className="sticky left-0 z-10 flex border-r border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[var(--admin-text)]">
                              {unit.name || "Acomodação"}
                            </p>

                            <p className="mt-1 text-xs font-medium text-[var(--admin-muted)]">
                              Até {unit.max_guests || 0} hóspedes
                            </p>

                            <p className="mt-2 text-[11px] font-bold text-[var(--app-primary)]">
                              {items.length} movimentação
                              {items.length !== 1 ? "ões" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <div
                            className="grid h-full min-h-[86px]"
                            style={{
                              gridTemplateColumns: `repeat(${totalDays}, minmax(48px, 1fr))`,
                            }}
                          >
                            {daysList.map((day) => (
                              <div
                                key={`${unit.id}-${day.date}`}
                                className={`border-r border-[var(--admin-border)] ${
                                  day.isToday
                                    ? "bg-[var(--app-primary-soft)]"
                                    : day.isWeekend
                                      ? "bg-[var(--admin-surface-soft)]"
                                      : "bg-[var(--admin-surface)]"
                                }`}
                              />
                            ))}
                          </div>

                          {items.map((item) => (
                            <TimelineBar
                              key={item.id}
                              item={item}
                              startDate={start}
                              totalDays={totalDays}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
