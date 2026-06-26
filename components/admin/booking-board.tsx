"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Home,
  Search,
} from "lucide-react";
import { MapRefreshButton } from "@/components/admin/map-refresh-button";

type Unit = {
  id: string;
  name: string | null;
  slug: string | null;
  cover_image: string | null;
  max_guests: number | string | null;
  is_active: boolean | null;
};

type Guest = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

type Reservation = {
  id: string;
  unit_id: string | null;
  check_in: string | null;
  check_out: string | null;
  guests_count: number | string | null;
  nights: number | string | null;
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  guests: Guest | Guest[] | null;
};

type BlockedDate = {
  id: string;
  unit_id: string | null;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
};

type BoardView = "month" | "quarter" | "semester" | "year";

type BookingBoardProps = {
  units: Unit[];
  reservations: Reservation[];
  blockedDates: BlockedDate[];
  startDate: string;
  endDate: string;
  view: BoardView;
  selectedUnit: string;
  previousStartDate: string;
  todayStartDate: string;
  nextStartDate: string;
};

type TimelineItem = {
  id: string;
  unitId: string;
  startDate: string;
  endDate: string;
  label: string;
  details: string;
  title: string;
  href?: string;
  status?: string | null;
  type: "reservation" | "blocked";
};

type Bucket = {
  key: string;
  startDate: string;
  endDate: string;
  label: string;
  sublabel: string;
};

const MS_PER_DAY = 86_400_000;

const viewOptions: Array<{
  value: BoardView;
  label: string;
}> = [
  { value: "month", label: "1 mês" },
  { value: "quarter", label: "3 meses" },
  { value: "semester", label: "6 meses" },
  { value: "year", label: "12 meses" },
];

function parseDateAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateAsYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, amount: number) {
  const currentDate = parseDateAsUtc(date);
  currentDate.setUTCDate(currentDate.getUTCDate() + amount);

  return formatDateAsYmd(currentDate);
}

function addMonths(date: string, amount: number) {
  const currentDate = parseDateAsUtc(date);
  currentDate.setUTCMonth(currentDate.getUTCMonth() + amount);

  return formatDateAsYmd(currentDate);
}

function differenceInDays(startDate: string, endDate: string) {
  const start = parseDateAsUtc(startDate);
  const end = parseDateAsUtc(endDate);
  const diff = end.getTime() - start.getTime();

  return Math.max(1, Math.round(diff / MS_PER_DAY));
}

function formatShortDate(date: string) {
  const currentDate = parseDateAsUtc(date);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(currentDate);
}

function formatMonth(date: string) {
  const currentDate = parseDateAsUtc(date);

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  })
    .format(currentDate)
    .replace(".", "");
}

function getWeekday(date: string) {
  const currentDate = parseDateAsUtc(date);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  })
    .format(currentDate)
    .replace(".", "");
}

function getGuestName(reservation: Reservation) {
  const guest = Array.isArray(reservation.guests)
    ? reservation.guests[0]
    : reservation.guests;

  return guest?.name || "Hóspede";
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

  return labels[String(status || "")] || String(status || "Reserva");
}

function getStatusClasses(status: string | null | undefined) {
  if (status === "confirmed") {
    return "bg-emerald-600 text-white ring-emerald-300/50";
  }

  if (status === "checked_in") {
    return "bg-purple-600 text-white ring-purple-300/50";
  }

  if (status === "awaiting_payment") {
    return "bg-sky-600 text-white ring-sky-300/50";
  }

  if (status === "pending") {
    return "bg-amber-500 text-white ring-amber-300/50";
  }

  if (status === "checked_out") {
    return "bg-slate-600 text-white ring-slate-300/50";
  }

  return "bg-[var(--app-primary)] text-white ring-[var(--app-primary-soft)]";
}

function buildHref(view: BoardView, start: string, unit: string) {
  const params = new URLSearchParams();
  params.set("view", view);
  params.set("start", start);

  if (unit !== "all") {
    params.set("unit", unit);
  }

  return `/admin/mapa-reservas?${params.toString()}`;
}

function buildBuckets(view: BoardView, startDate: string, endDate: string) {
  const buckets: Bucket[] = [];

  if (view === "semester") {
    for (
      let current = startDate, index = 1;
      current < endDate;
      current = addDays(current, 7), index += 1
    ) {
      const next = addDays(current, 7);
      const bucketEnd = next < endDate ? next : endDate;

      buckets.push({
        key: current,
        startDate: current,
        endDate: bucketEnd,
        label: `S${index}`,
        sublabel: formatShortDate(current),
      });
    }

    return buckets;
  }

  if (view === "year") {
    for (let current = startDate; current < endDate; current = addMonths(current, 1)) {
      const next = addMonths(current, 1);
      const bucketEnd = next < endDate ? next : endDate;

      buckets.push({
        key: current,
        startDate: current,
        endDate: bucketEnd,
        label: formatMonth(current),
        sublabel: "",
      });
    }

    return buckets;
  }

  for (let current = startDate; current < endDate; current = addDays(current, 1)) {
    buckets.push({
      key: current,
      startDate: current,
      endDate: addDays(current, 1),
      label: formatShortDate(current),
      sublabel: getWeekday(current),
    });
  }

  return buckets;
}

function getItemGridStyle(
  item: TimelineItem,
  buckets: Bucket[],
  startDate: string,
  endDate: string
) {
  const itemStart = item.startDate > startDate ? item.startDate : startDate;
  const itemEnd = item.endDate < endDate ? item.endDate : endDate;

  const startIndex = buckets.findIndex(
    (bucket) => itemStart < bucket.endDate && itemEnd > bucket.startDate
  );

  if (startIndex < 0) return null;

  let endIndex = startIndex;

  for (let index = startIndex; index < buckets.length; index += 1) {
    const bucket = buckets[index];

    if (itemStart < bucket.endDate && itemEnd > bucket.startDate) {
      endIndex = index;
    }
  }

  return {
    gridColumn: `${startIndex + 1} / span ${endIndex - startIndex + 1}`,
  };
}

export function BookingBoard({
  units,
  reservations,
  blockedDates,
  startDate,
  endDate,
  view,
  selectedUnit,
  previousStartDate,
  todayStartDate,
  nextStartDate,
}: BookingBoardProps) {
  const [search, setSearch] = useState("");

  const buckets = useMemo(
    () => buildBuckets(view, startDate, endDate),
    [endDate, startDate, view]
  );

  const filteredUnits = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return units.filter((unit) => {
      const matchesSelectedUnit =
        selectedUnit === "all" || unit.id === selectedUnit;
      const matchesSearch =
        !normalizedSearch ||
        String(unit.name || "")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSelectedUnit && matchesSearch;
    });
  }, [search, selectedUnit, units]);

  const itemsByUnit = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();

    for (const reservation of reservations) {
      if (!reservation.unit_id || !reservation.check_in || !reservation.check_out) {
        continue;
      }

      const nights = differenceInDays(reservation.check_in, reservation.check_out);
      const period = `${formatShortDate(reservation.check_in)} → ${formatShortDate(
        reservation.check_out
      )} · ${nights}n`;
      const guestName = getGuestName(reservation);
      const item: TimelineItem = {
        id: reservation.id,
        unitId: reservation.unit_id,
        startDate: reservation.check_in,
        endDate: reservation.check_out,
        label: `${guestName} ${period}`,
        details: getStatusLabel(reservation.status),
        title: `${guestName} · ${period} · ${getStatusLabel(
          reservation.status
        )}`,
        href: `/admin/reservas/${reservation.id}`,
        status: reservation.status,
        type: "reservation",
      };

      map.set(reservation.unit_id, [...(map.get(reservation.unit_id) || []), item]);
    }

    for (const blockedDate of blockedDates) {
      if (!blockedDate.unit_id || !blockedDate.start_date || !blockedDate.end_date) {
        continue;
      }

      const period = `${formatShortDate(blockedDate.start_date)} → ${formatShortDate(
        blockedDate.end_date
      )}`;
      const item: TimelineItem = {
        id: blockedDate.id,
        unitId: blockedDate.unit_id,
        startDate: blockedDate.start_date,
        endDate: blockedDate.end_date,
        label: "Bloqueado",
        details: blockedDate.reason || period,
        title: `${period} · ${blockedDate.reason || "Bloqueado"}`,
        type: "blocked",
      };

      map.set(blockedDate.unit_id, [
        ...(map.get(blockedDate.unit_id) || []),
        item,
      ]);
    }

    for (const [unitId, items] of map) {
      map.set(
        unitId,
        items.sort((first, second) => first.startDate.localeCompare(second.startDate))
      );
    }

    return map;
  }, [blockedDates, reservations]);

  const columnWidth =
    view === "month"
      ? "104px"
      : view === "quarter"
        ? "56px"
        : view === "semester"
          ? "76px"
          : "112px";
  const periodLabel = `${formatShortDate(startDate)} → ${formatShortDate(
    addDays(endDate, -1)
  )}`;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
      <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-[var(--app-text)]">
              <CalendarDays className="h-4 w-4 text-[var(--app-primary)]" />
              Calendário visual
            </div>

            <p className="mt-1 text-xs font-medium text-[var(--app-text-muted)]">
              {periodLabel}
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {viewOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref(option.value, startDate, selectedUnit)}
                  className={
                    view === option.value
                      ? "admin-btn-primary min-h-10 px-4 text-xs"
                      : "inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-4 text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] dark:bg-white/5"
                  }
                >
                  {option.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={buildHref(view, previousStartDate, selectedUnit)}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-[var(--app-border)] bg-white px-3 text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] dark:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Link>

              <Link
                href={buildHref(view, todayStartDate, selectedUnit)}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-4 text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] dark:bg-white/5"
              >
                Hoje
              </Link>

              <Link
                href={buildHref(view, nextStartDate, selectedUnit)}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-2xl border border-[var(--app-border)] bg-white px-3 text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] dark:bg-white/5"
              >
                Próximo
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              <MapRefreshButton />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm text-[var(--app-text-muted)] dark:bg-white/5">
            <Search className="h-4 w-4" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar acomodação"
              className="h-full w-[230px] bg-transparent text-sm font-medium text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-muted)]"
            />
          </label>

          <select
            value={selectedUnit}
            onChange={(event) => {
              window.location.href = buildHref(view, startDate, event.target.value);
            }}
            className="h-11 rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-bold text-[var(--app-text-soft)] outline-none transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
          >
            <option value="all">Todas as acomodações</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name || "Acomodação"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-auto">
        <div
          className="min-w-max"
          style={
            {
              "--bucket-width": columnWidth,
              "--unit-width": "260px",
            } as CSSProperties
          }
        >
          <div className="sticky top-0 z-20 grid grid-cols-[var(--unit-width)_1fr] bg-white dark:bg-[var(--app-card)]">
            <div className="sticky left-0 z-30 flex h-16 items-center border-b border-r border-[var(--app-border)] bg-white px-5 text-sm font-black text-[var(--app-text)] dark:bg-[var(--app-card)]">
              Acomodação
            </div>

            <div
              className="grid border-b border-[var(--app-border)]"
              style={{
                gridTemplateColumns: `repeat(${buckets.length}, var(--bucket-width))`,
              }}
            >
              {buckets.map((bucket) => (
                <div
                  key={bucket.key}
                  className="flex h-16 flex-col items-center justify-center border-r border-[var(--app-border)] bg-[var(--app-card-soft)] px-2 text-center"
                  title={`${formatShortDate(bucket.startDate)} → ${formatShortDate(
                    addDays(bucket.endDate, -1)
                  )}`}
                >
                  <span className="text-xs font-black uppercase text-[var(--app-text-muted)]">
                    {bucket.sublabel}
                  </span>

                  <span className="mt-1 text-sm font-black text-[var(--app-text)]">
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {filteredUnits.map((unit) => {
            const items = itemsByUnit.get(unit.id) || [];

            return (
              <div
                key={unit.id}
                className="grid grid-cols-[var(--unit-width)_1fr] border-b border-[var(--app-border)] last:border-b-0"
              >
                <div className="sticky left-0 z-10 flex min-h-[92px] items-center gap-3 border-r border-[var(--app-border)] bg-white px-5 dark:bg-[var(--app-card)]">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] bg-cover bg-center text-[var(--app-primary)]"
                    style={{
                      backgroundImage: unit.cover_image
                        ? `url(${unit.cover_image})`
                        : undefined,
                    }}
                  >
                    {unit.cover_image ? null : <Home className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--app-text)]">
                      {unit.name || "Acomodação"}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[var(--app-text-muted)]">
                      Máx. {unit.max_guests || 0} hóspedes
                    </p>
                  </div>
                </div>

                <div className="relative min-h-[92px]">
                  <div
                    className="grid min-h-[92px]"
                    style={{
                      gridTemplateColumns: `repeat(${buckets.length}, var(--bucket-width))`,
                    }}
                  >
                    {buckets.map((bucket) => (
                      <div
                        key={`${unit.id}-${bucket.key}`}
                        className="border-r border-[var(--app-border)] bg-white dark:bg-[var(--app-card)]"
                      />
                    ))}
                  </div>

                  <div
                    className="pointer-events-none absolute inset-0 grid auto-rows-[38px] content-center gap-1 px-1 py-2"
                    style={{
                      gridTemplateColumns: `repeat(${buckets.length}, var(--bucket-width))`,
                    }}
                  >
                    {items.length === 0 ? (
                      <div className="pointer-events-none col-span-full flex items-center px-3 text-xs font-bold text-[var(--app-text-muted)]">
                        Sem ocupação no período
                      </div>
                    ) : null}

                    {items.map((item) => {
                      const gridStyle = getItemGridStyle(
                        item,
                        buckets,
                        startDate,
                        endDate
                      );

                      if (!gridStyle) return null;

                      const className =
                        item.type === "blocked"
                          ? "pointer-events-auto flex min-w-0 items-center gap-2 overflow-hidden rounded-2xl border border-slate-300/70 bg-[repeating-linear-gradient(135deg,rgba(100,116,139,0.16)_0,rgba(100,116,139,0.16)_6px,rgba(255,255,255,0.85)_6px,rgba(255,255,255,0.85)_12px)] px-3 text-xs font-black text-slate-600 shadow-sm dark:border-white/10 dark:text-slate-300"
                          : `pointer-events-auto flex min-w-0 items-center gap-2 overflow-hidden rounded-2xl px-3 text-xs font-black shadow-sm ring-1 ${getStatusClasses(
                              item.status
                            )}`;
                      const content = (
                        <>
                          <CircleDot className="h-3 w-3 shrink-0 opacity-80" />
                          <span className="truncate">{item.label}</span>
                          <span className="hidden truncate opacity-85 md:inline">
                            {item.details}
                          </span>
                        </>
                      );

                      return item.href ? (
                        <Link
                          key={`${item.type}-${item.id}`}
                          href={item.href}
                          className={className}
                          style={gridStyle}
                          title={item.title}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          key={`${item.type}-${item.id}`}
                          className={className}
                          style={gridStyle}
                          title={item.title}
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUnits.length === 0 ? (
            <div className="grid grid-cols-[var(--unit-width)_1fr]">
              <div className="sticky left-0 border-r border-[var(--app-border)] bg-white dark:bg-[var(--app-card)]" />
              <div className="px-6 py-10 text-sm font-bold text-[var(--app-text-muted)]">
                Nenhuma acomodação encontrada.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
