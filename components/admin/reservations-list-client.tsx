"use client";

import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Filter,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ManualReservationModal } from "@/components/admin/manual-reservation-modal";

import type {
  ReservationItem,
  UnitOption,
} from "@/app/admin/reservas/page";

type ReservationsListClientProps = {
  initialReservations: ReservationItem[];
  units: UnitOption[];
};

type SortOption =
  | "newest"
  | "oldest"
  | "alphabetical_asc"
  | "alphabetical_desc";

const monthOptions = [
  {
    value: "1",
    label: "Janeiro",
  },
  {
    value: "2",
    label: "Fevereiro",
  },
  {
    value: "3",
    label: "Março",
  },
  {
    value: "4",
    label: "Abril",
  },
  {
    value: "5",
    label: "Maio",
  },
  {
    value: "6",
    label: "Junho",
  },
  {
    value: "7",
    label: "Julho",
  },
  {
    value: "8",
    label: "Agosto",
  },
  {
    value: "9",
    label: "Setembro",
  },
  {
    value: "10",
    label: "Outubro",
  },
  {
    value: "11",
    label: "Novembro",
  },
  {
    value: "12",
    label: "Dezembro",
  },
];

function getRelationItem<T>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value;
}

function normalizeSearchText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatMoney(
  value: number | string | null | undefined
) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const normalizedDate = value.slice(0, 10);
  const [year, month, day] = normalizedDate.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function getDateParts(value: string | null | undefined) {
  if (!value) {
    return {
      year: null,
      month: null,
    };
  }

  const normalizedDate = value.slice(0, 10);
  const [year, month] = normalizedDate.split("-");

  return {
    year: year || null,
    month: month ? String(Number(month)) : null,
  };
}

function getComparableDate(value: string | null | undefined) {
  if (!value) return 0;

  const date = new Date(value);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
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
    pending:
      "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    awaiting_payment:
      "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300",
    confirmed:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    checked_in:
      "border-teal-100 bg-teal-50 text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300",
    checked_out:
      "border-[var(--admin-border)] bg-[var(--admin-surface-soft)] text-[var(--admin-muted)]",
    cancelled:
      "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
  };

  return classes[String(status || "")] || classes.pending;
}

function getPaymentLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    refunded: "Reembolsado",
    failed: "Falhou",
  };

  return labels[String(status || "")] || "Pendente";
}

function getPaymentClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    pending:
      "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    paid:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    refunded:
      "border-[var(--admin-border)] bg-[var(--admin-surface-soft)] text-[var(--admin-muted)]",
    failed:
      "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
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

function getGuestName(reservation: ReservationItem) {
  return (
    getRelationItem(reservation.guests)?.name ||
    "Hóspede"
  );
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] py-2 pl-4 pr-10 text-sm font-medium text-[var(--admin-text)] outline-none transition hover:border-[var(--app-primary)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
    </div>
  );
}

function ReservationMetric({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.05)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-[var(--admin-muted)]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
        {value}
      </p>

      {description ? (
        <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-2)]">
          {description}
        </p>
      ) : null}
    </article>
  );
}

function ReservationCard({
  reservation,
}: {
  reservation: ReservationItem;
}) {
  const guest = getRelationItem(reservation.guests);
  const unit = getRelationItem(reservation.units);

  return (
    <article className="grid overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(7,52,59,0.10)] lg:grid-cols-[1fr_230px]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--app-primary)] text-sm font-black text-white">
              {getInitials(guest?.name)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                {guest?.name || "Hóspede"}
              </h2>

              <p className="mt-1 truncate text-sm text-[var(--admin-muted)]">
                {guest?.email || "Sem e-mail"} ·{" "}
                {guest?.phone || "Sem telefone"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
                reservation.status
              )}`}
            >
              {getStatusLabel(reservation.status)}
            </span>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getPaymentClasses(
                reservation.payment_status
              )}`}
            >
              {getPaymentLabel(reservation.payment_status)}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-[var(--app-primary-soft)] p-4">
            <CalendarDays className="h-5 w-5 text-[var(--app-primary)]" />

            <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
              Check-in
            </p>

            <p className="mt-1 font-black text-[var(--admin-text)]">
              {formatDate(reservation.check_in)}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--app-primary-soft)] p-4">
            <CalendarDays className="h-5 w-5 text-[var(--app-primary)]" />

            <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
              Check-out
            </p>

            <p className="mt-1 font-black text-[var(--admin-text)]">
              {formatDate(reservation.check_out)}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--app-primary-soft)] p-4">
            <Users className="h-5 w-5 text-[var(--app-primary)]" />

            <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
              Hóspedes
            </p>

            <p className="mt-1 font-black text-[var(--admin-text)]">
              {reservation.guests_count || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--app-primary-soft)] p-4">
            <BedDouble className="h-5 w-5 text-[var(--app-primary)]" />

            <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
              Acomodação
            </p>

            <p className="mt-1 truncate font-black text-[var(--admin-text)]">
              {unit?.name || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5 lg:border-l lg:border-t-0">
        <div>
          <p className="text-xs font-bold text-[var(--admin-muted)]">
            Total
          </p>

          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {formatMoney(reservation.total)}
          </p>

          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {reservation.nights || 0} noite
            {Number(reservation.nights || 0) !== 1
              ? "s"
              : ""}{" "}
            · {reservation.source || "manual"}
          </p>
        </div>

        <Link
          href={`/admin/reservas/${reservation.id}`}
          className="admin-reservation-view-button mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black shadow-[0_12px_28px_rgba(11,89,99,0.22)] transition hover:-translate-y-0.5"
          style={{
            backgroundColor: "#0b5963",
            borderColor: "#0b5963",
            color: "#ffffff",
          }}
        >
          Ver reserva
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function ReservationsListClient({
  initialReservations,
  units,
}: ReservationsListClientProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<SortOption>("newest");
  const [selectedMonth, setSelectedMonth] =
    useState("all");
  const [selectedYear, setSelectedYear] =
    useState("all");

  const availableYears = useMemo(() => {
    const years = new Set<string>();

    initialReservations.forEach((reservation) => {
      const { year } = getDateParts(
        reservation.check_in || reservation.created_at
      );

      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort(
      (first, second) => Number(second) - Number(first)
    );
  }, [initialReservations]);

  const filteredReservations = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);

    const result = initialReservations.filter(
      (reservation) => {
        const guest = getRelationItem(reservation.guests);
        const unit = getRelationItem(reservation.units);

        const searchableContent = normalizeSearchText(
          [
            guest?.name,
            guest?.email,
            guest?.phone,
            guest?.country,
            unit?.name,
            reservation.source,
            reservation.status,
            reservation.payment_status,
          ]
            .filter(Boolean)
            .join(" ")
        );

        const matchesSearch =
          !normalizedSearch ||
          searchableContent.includes(normalizedSearch);

        const referenceDate =
          reservation.check_in || reservation.created_at;

        const { year, month } =
          getDateParts(referenceDate);

        const matchesYear =
          selectedYear === "all" || year === selectedYear;

        const matchesMonth =
          selectedMonth === "all" || month === selectedMonth;

        return (
          matchesSearch &&
          matchesYear &&
          matchesMonth
        );
      }
    );

    return [...result].sort((first, second) => {
      if (sort === "alphabetical_asc") {
        return getGuestName(first).localeCompare(
          getGuestName(second),
          "pt-BR",
          {
            sensitivity: "base",
          }
        );
      }

      if (sort === "alphabetical_desc") {
        return getGuestName(second).localeCompare(
          getGuestName(first),
          "pt-BR",
          {
            sensitivity: "base",
          }
        );
      }

      const firstDate = getComparableDate(
        first.created_at || first.check_in
      );

      const secondDate = getComparableDate(
        second.created_at || second.check_in
      );

      if (sort === "oldest") {
        return firstDate - secondDate;
      }

      return secondDate - firstDate;
    });
  }, [
    initialReservations,
    search,
    selectedMonth,
    selectedYear,
    sort,
  ]);

  const metrics = useMemo(() => {
    const confirmed = filteredReservations.filter(
      (reservation) =>
        reservation.status === "confirmed" ||
        reservation.status === "checked_in"
    ).length;

    const pending = filteredReservations.filter(
      (reservation) =>
        reservation.status === "pending" ||
        reservation.status === "awaiting_payment"
    ).length;

    const revenue = filteredReservations.reduce(
      (total, reservation) => {
        if (reservation.status === "cancelled") {
          return total;
        }

        return total + Number(reservation.total || 0);
      },
      0
    );

    return {
      total: filteredReservations.length,
      confirmed,
      pending,
      revenue,
    };
  }, [filteredReservations]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    sort !== "newest" ||
    selectedMonth !== "all" ||
    selectedYear !== "all";

  function clearFilters() {
    setSearch("");
    setSort("newest");
    setSelectedMonth("all");
    setSelectedYear("all");
  }

  return (
    <main className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReservationMetric
          icon={<CalendarDays className="h-5 w-5" />}
          label="Total filtrado"
          value={metrics.total}
          description={`De ${initialReservations.length} reservas no sistema`}
        />

        <ReservationMetric
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Confirmadas"
          value={metrics.confirmed}
          description="Confirmadas ou em check-in"
        />

        <ReservationMetric
          icon={<CreditCard className="h-5 w-5" />}
          label="Pendentes"
          value={metrics.pending}
          description="Pendentes ou aguardando pagamento"
        />

        <ReservationMetric
          icon={<CreditCard className="h-5 w-5" />}
          label="Receita filtrada"
          value={formatMoney(metrics.revenue)}
          description="Canceladas não entram no cálculo"
        />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[var(--admin-border)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
              Reservas cadastradas
            </h2>

            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Consulte, filtre e acompanhe reservas, hóspedes e pagamentos.
            </p>
          </div>

          <ManualReservationModal units={units} />
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_minmax(190px,0.8fr)_minmax(160px,0.65fr)_minmax(140px,0.55fr)_auto]">
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
              <Search className="h-5 w-5 shrink-0 text-[var(--admin-muted-2)]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Nome, e-mail, telefone ou acomodação..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text)]"
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <FilterSelect
              value={sort}
              onChange={(value) =>
                setSort(value as SortOption)
              }
              ariaLabel="Ordenar reservas"
            >
              <option value="newest">
                Mais recentes
              </option>

              <option value="oldest">
                Mais antigas
              </option>

              <option value="alphabetical_asc">
                Nome: A–Z
              </option>

              <option value="alphabetical_desc">
                Nome: Z–A
              </option>
            </FilterSelect>

            <FilterSelect
              value={selectedMonth}
              onChange={setSelectedMonth}
              ariaLabel="Filtrar por mês de check-in"
            >
              <option value="all">Todos os meses</option>

              {monthOptions.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={selectedYear}
              onChange={setSelectedYear}
              ariaLabel="Filtrar por ano de check-in"
            >
              <option value="all">Todos os anos</option>

              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </FilterSelect>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold text-[var(--admin-muted)] transition hover:border-[var(--app-primary)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
            <p className="text-sm text-[var(--admin-muted)]">
              <strong className="font-semibold text-[var(--admin-text)]">
                {filteredReservations.length}
              </strong>{" "}
              {filteredReservations.length === 1
                ? "reserva encontrada"
                : "reservas encontradas"}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {sort.startsWith("alphabetical") ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-primary)]">
                  <ArrowDownAZ className="h-4 w-4" />
                  Ordem alfabética ativa
                </span>
              ) : null}

              {selectedMonth !== "all" ||
              selectedYear !== "all" ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-primary)]">
                  <Filter className="h-4 w-4" />
                  Filtro por check-in ativo
                </span>
              ) : null}
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <section className="mt-5 rounded-[1.75rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-10 text-center md:p-12">
              <Search className="mx-auto h-12 w-12 text-[var(--app-primary)]" />

              <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                Nenhuma reserva encontrada
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--admin-muted)]">
                Altere a busca, o mês, o ano ou limpe os filtros para visualizar outras reservas.
              </p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#0b5963] !bg-[#0b5963] px-5 text-sm font-semibold !text-white transition hover:!bg-[#084952] hover:!text-white"
                  style={{
                    backgroundColor: "#0b5963",
                    color: "#ffffff",
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar todos os filtros
                </button>
              ) : (
                <div className="mt-6 flex justify-center">
                  <ManualReservationModal units={units} />
                </div>
              )}
            </section>
          ) : (
            <section className="mt-5 grid gap-5">
              {filteredReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                />
              ))}
            </section>
          )}
        </div>
      </section>

      <style jsx global>{`
        .admin-reservation-view-button,
        .admin-reservation-view-button:visited {
          background: #0b5963 !important;
          color: #ffffff !important;
          border-color: #0b5963 !important;
          text-decoration: none !important;
        }

        .admin-reservation-view-button:hover,
        .admin-reservation-view-button:focus,
        .admin-reservation-view-button:active {
          background: #084952 !important;
          color: #ffffff !important;
          border-color: #084952 !important;
          text-decoration: none !important;
        }

        .admin-reservation-view-button svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
      `}</style>
    </main>
  );
}

export default ReservationsListClient;