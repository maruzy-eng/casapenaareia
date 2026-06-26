"use client";

import Link from "next/link";
import {
  ArrowDownAZ,
  CalendarCheck,
  ChevronDown,
  Eye,
  Filter,
  Mail,
  Phone,
  RotateCcw,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  GuestItem,
  GuestReservationItem,
} from "@/app/admin/hospedes/page";

type GuestsListClientProps = {
  initialGuests: GuestItem[];
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

function normalizeSearchText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

function formatNumber(
  value: number | string | null | undefined
) {
  return new Intl.NumberFormat("pt-BR").format(
    Number(value || 0)
  );
}

function getDateParts(value: string | null | undefined) {
  if (!value) {
    return {
      year: null,
      month: null,
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      year: null,
      month: null,
    };
  }

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
  };
}

function getComparableDate(
  value: string | null | undefined
) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getReservations(
  reservations:
    | GuestReservationItem[]
    | GuestReservationItem
    | null
    | undefined
) {
  if (!reservations) {
    return [];
  }

  if (Array.isArray(reservations)) {
    return reservations;
  }

  return [reservations];
}

function getGuestName(guest: GuestItem) {
  return guest.name?.trim() || "Sem nome";
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        aria-label={ariaLabel}
        className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] py-2 pl-4 pr-10 text-sm font-medium text-[var(--admin-text)] outline-none transition hover:border-[var(--app-primary)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
    </div>
  );
}

export function GuestsListClient({
  initialGuests,
}: GuestsListClientProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] =
    useState<SortOption>("newest");

  const [selectedMonth, setSelectedMonth] =
    useState("all");

  const [selectedYear, setSelectedYear] =
    useState("all");

  const availableYears = useMemo(() => {
    const years = new Set<string>();

    initialGuests.forEach((guest) => {
      const { year } = getDateParts(
        guest.created_at
      );

      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort(
      (first, second) =>
        Number(second) - Number(first)
    );
  }, [initialGuests]);

  const filteredGuests = useMemo(() => {
    const normalizedSearch =
      normalizeSearchText(search);

    const filtered = initialGuests.filter(
      (guest) => {
        const searchableContent =
          normalizeSearchText(
            [
              guest.name,
              guest.email,
              guest.phone,
              guest.country,
            ]
              .filter(Boolean)
              .join(" ")
          );

        const matchesSearch =
          !normalizedSearch ||
          searchableContent.includes(
            normalizedSearch
          );

        const { year, month } = getDateParts(
          guest.created_at
        );

        const matchesYear =
          selectedYear === "all" ||
          year === selectedYear;

        const matchesMonth =
          selectedMonth === "all" ||
          month === selectedMonth;

        return (
          matchesSearch &&
          matchesYear &&
          matchesMonth
        );
      }
    );

    return [...filtered].sort(
      (firstGuest, secondGuest) => {
        if (sort === "alphabetical_asc") {
          return getGuestName(
            firstGuest
          ).localeCompare(
            getGuestName(secondGuest),
            "pt-BR",
            {
              sensitivity: "base",
            }
          );
        }

        if (sort === "alphabetical_desc") {
          return getGuestName(
            secondGuest
          ).localeCompare(
            getGuestName(firstGuest),
            "pt-BR",
            {
              sensitivity: "base",
            }
          );
        }

        const firstDate = getComparableDate(
          firstGuest.created_at
        );

        const secondDate = getComparableDate(
          secondGuest.created_at
        );

        if (sort === "oldest") {
          return firstDate - secondDate;
        }

        return secondDate - firstDate;
      }
    );
  }, [
    initialGuests,
    search,
    sort,
    selectedMonth,
    selectedYear,
  ]);

  const totalReservations = useMemo(() => {
    return filteredGuests.reduce(
      (total, guest) =>
        total +
        getReservations(guest.reservations)
          .length,
      0
    );
  }, [filteredGuests]);

  const guestsWithReservations = useMemo(() => {
    return filteredGuests.filter(
      (guest) =>
        getReservations(guest.reservations)
          .length > 0
    ).length;
  }, [filteredGuests]);

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
    <div className="space-y-6 font-sans">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-[1.6rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <Users className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--admin-muted)]">
            Hóspedes filtrados
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--admin-text)]">
            {formatNumber(
              filteredGuests.length
            )}
          </p>

          <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-2)]">
            De {formatNumber(initialGuests.length)}{" "}
            cadastrados no sistema
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <CalendarCheck className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--admin-muted)]">
            Total de reservas
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--admin-text)]">
            {formatNumber(totalReservations)}
          </p>

          <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-2)]">
            Dentro do filtro selecionado
          </p>
        </article>

        <article className="rounded-[1.6rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)] sm:col-span-2 xl:col-span-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <User className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--admin-muted)]">
            Com reservas
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--admin-text)]">
            {formatNumber(
              guestsWithReservations
            )}
          </p>

          <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-2)]">
            Hóspedes que já possuem reserva
          </p>
        </article>
      </section>

      <section className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)] md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <Filter className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--admin-text)]">
              Hóspedes cadastrados
            </h2>

            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Pesquise e organize os hóspedes por
              nome, mês ou ano de entrada.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_minmax(190px,0.8fr)_minmax(165px,0.65fr)_minmax(145px,0.55fr)_auto]">
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
            <Search className="h-5 w-5 shrink-0 text-[var(--admin-muted-2)]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Nome, e-mail, telefone ou país..."
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
            ariaLabel="Ordenar hóspedes"
          >
            <option value="newest">
              Entradas recentes
            </option>

            <option value="oldest">
              Entradas antigas
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
            ariaLabel="Filtrar hóspedes por mês de entrada"
          >
            <option value="all">
              Todos os meses
            </option>

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
            ariaLabel="Filtrar hóspedes por ano de entrada"
          >
            <option value="all">
              Todos os anos
            </option>

            {availableYears.map((year) => (
              <option
                key={year}
                value={year}
              >
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

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
          <p className="text-sm text-[var(--admin-muted)]">
            <strong className="font-semibold text-[var(--admin-text)]">
              {formatNumber(
                filteredGuests.length
              )}
            </strong>{" "}
            {filteredGuests.length === 1
              ? "hóspede encontrado"
              : "hóspedes encontrados"}
          </p>

          {sort === "alphabetical_asc" ||
          sort === "alphabetical_desc" ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-primary)]">
              <ArrowDownAZ className="h-4 w-4" />
              Ordem alfabética ativa
            </span>
          ) : null}
        </div>

        {filteredGuests.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-[var(--app-primary)]" />

            <h3 className="mt-4 text-xl font-black text-[var(--admin-text)]">
              Nenhum hóspede encontrado
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--admin-muted)]">
              Altere a busca, o mês ou o ano de
              entrada para encontrar outros
              hóspedes.
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#0b5963] !bg-[#0b5963] px-5 text-sm font-semibold !text-white transition hover:!border-[#084952] hover:!bg-[#084952] hover:!text-white"
                style={{
                  backgroundColor: "#0b5963",
                  color: "#ffffff",
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Limpar todos os filtros
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[280px]" />
                  <col className="w-[260px]" />
                  <col className="w-[180px]" />
                  <col className="w-[130px]" />
                  <col className="w-[130px]" />
                </colgroup>

                <thead className="bg-[var(--admin-surface-soft)] text-xs text-[var(--admin-muted)]">
                  <tr>
                    <th className="px-6 py-5 text-left align-middle font-black">
                      Hóspede
                    </th>

                    <th className="px-6 py-5 text-left align-middle font-black">
                      Contato
                    </th>

                    <th className="px-6 py-5 text-left align-middle font-black">
                      Entrada
                    </th>

                    <th className="px-6 py-5 text-center align-middle font-black">
                      Reservas
                    </th>

                    <th className="px-6 py-5 text-right align-middle font-black">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--admin-border)]">
                  {filteredGuests.map((guest) => {
                    const reservations =
                      getReservations(
                        guest.reservations
                      );

                    return (
                      <tr
                        key={guest.id}
                        className="transition hover:bg-[var(--admin-surface-soft)]"
                      >
                        <td className="px-6 py-5 align-middle">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                              <User className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[var(--admin-text)]">
                                {guest.name ||
                                  "Sem nome"}
                              </p>

                              <p className="mt-1 truncate text-xs font-medium text-[var(--admin-muted-2)]">
                                {guest.country ||
                                  "País não informado"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <div className="space-y-1">
                            <p className="flex min-w-0 items-center gap-2 text-xs font-bold text-[var(--admin-text)]">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--app-primary)]" />

                              <span className="truncate">
                                {guest.email || "—"}
                              </span>
                            </p>

                            <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-[var(--admin-muted-2)]">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--app-primary)]" />

                              <span className="truncate">
                                {guest.phone || "—"}
                              </span>
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-5 align-middle">
                          <p className="whitespace-nowrap text-sm font-bold text-[var(--admin-muted)]">
                            {formatDate(
                              guest.created_at
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-center align-middle">
                          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-[var(--admin-surface-soft)] px-3 text-sm font-black text-[var(--admin-text)]">
                            <CalendarCheck className="mr-1.5 h-4 w-4 text-[var(--app-primary)]" />

                            {formatNumber(
                              reservations.length
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right align-middle">
                          <Link
                            href={`/admin/hospedes/${guest.id}`}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#0b5963] !bg-[#0b5963] px-5 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(11,89,99,0.18)] transition hover:!border-[#084952] hover:!bg-[#084952] hover:!text-white"
                            style={{
                              backgroundColor:
                                "#0b5963",
                              color: "#ffffff",
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default GuestsListClient;