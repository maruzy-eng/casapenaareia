export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Edit3,
  Filter,
  LockKeyhole,
  Plus,
  Search,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlockedDateForm } from "@/components/admin/blocked-date-form";
import { DeleteBlockedDateButton } from "@/components/admin/delete-blocked-date-button";

type AdminBlockedDatesPageProps = {
  searchParams: Promise<{
    unit?: string;
    from?: string;
    to?: string;
    q?: string;
    message?: string;
  }>;
};

type UnitItem = {
  id: string;
  name: string | null;
  slug: string | null;
  is_active: boolean | null;
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
        slug: string | null;
      }
    | {
        id: string | null;
        name: string | null;
        slug: string | null;
      }[]
    | null;
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

function getMonthRangeYmd() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    start: format(start),
    end: format(end),
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function overlapsPeriod({
  startDate,
  endDate,
  periodStart,
  periodEnd,
}: {
  startDate: string | null;
  endDate: string | null;
  periodStart?: string;
  periodEnd?: string;
}) {
  if (!startDate || !endDate) return false;
  if (periodStart && endDate <= periodStart) return false;
  if (periodEnd && startDate >= periodEnd) return false;

  return true;
}

function getMessage(message: string) {
  const messages: Record<string, string> = {
    created: "Bloqueio criado com sucesso.",
    updated: "Bloqueio atualizado com sucesso.",
    deleted: "Bloqueio removido com sucesso.",
    missing_fields: "Preencha acomodação, datas e motivo.",
    invalid_dates: "Informe datas válidas.",
    invalid_period: "A data final precisa ser maior que a data inicial.",
    reservation_conflict:
      "Não foi possível salvar: já existe reserva ativa nesse período.",
    block_conflict:
      "Não foi possível salvar: já existe outro bloqueio nesse período.",
    error: "Não foi possível salvar o bloqueio. Tente novamente.",
    not_found: "Bloqueio não encontrado.",
  };

  return messages[message] || "";
}

function buildBlockedDatesUrl(params: {
  unit?: string;
  from?: string;
  to?: string;
  q?: string;
}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  const query = search.toString();

  return query ? `/admin/bloqueios?${query}` : "/admin/bloqueios";
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
    <article className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--app-shadow-soft)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--admin-muted)]">{title}</p>
          <p className="mt-1 truncate text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {value}
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--admin-muted-2)]">
            {helper}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function AdminBlockedDatesPage({
  searchParams,
}: AdminBlockedDatesPageProps) {
  const params = await searchParams;
  const selectedUnit = String(params.unit || "all").trim();
  const from = String(params.from || "").trim();
  const to = String(params.to || "").trim();
  const q = String(params.q || "").trim().toLowerCase();
  const message = String(params.message || "").trim();

  const supabase = createAdminClient();

  const [unitsResult, blockedDatesResult] = await Promise.all([
    supabase
      .from("units")
      .select("id, name, slug, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true }),
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
          name,
          slug
        )
      `
      )
      .order("start_date", { ascending: false }),
  ]);

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message);
  }

  if (blockedDatesResult.error) {
    throw new Error(blockedDatesResult.error.message);
  }

  const units = (unitsResult.data || []) as UnitItem[];
  const blockedDates = (blockedDatesResult.data || []) as BlockedDateItem[];
  const today = getTodayYmd();
  const monthRange = getMonthRangeYmd();

  const futureCount = blockedDates.filter((blocked) => {
    return Boolean(blocked.end_date && blocked.end_date >= today);
  }).length;

  const affectedUnitsCount = new Set(
    blockedDates.map((blocked) => blocked.unit_id).filter(Boolean)
  ).size;

  const monthCount = blockedDates.filter((blocked) =>
    overlapsPeriod({
      startDate: blocked.start_date,
      endDate: blocked.end_date,
      periodStart: monthRange.start,
      periodEnd: monthRange.end,
    })
  ).length;

  const filteredBlockedDates = blockedDates.filter((blocked) => {
    const unit = getRelationItem(blocked.units);
    const unitName = String(unit?.name || "").toLowerCase();
    const reason = String(blocked.reason || "").toLowerCase();

    if (selectedUnit !== "all" && blocked.unit_id !== selectedUnit) {
      return false;
    }

    if (
      (from || to) &&
      !overlapsPeriod({
        startDate: blocked.start_date,
        endDate: blocked.end_date,
        periodStart: from || undefined,
        periodEnd: to || undefined,
      })
    ) {
      return false;
    }

    if (q && !unitName.includes(q) && !reason.includes(q)) {
      return false;
    }

    return true;
  });

  const notice = getMessage(message);
  const isErrorMessage = Boolean(
    message &&
      !["created", "updated", "deleted"].includes(message)
  );

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total de bloqueios"
            value={String(blockedDates.length)}
            helper="Períodos cadastrados"
            icon={<LockKeyhole className="h-6 w-6" />}
          />

          <SummaryCard
            title="Bloqueios futuros"
            value={String(futureCount)}
            helper={`A partir de ${formatDate(today)}`}
            icon={<CalendarDays className="h-6 w-6" />}
          />

          <SummaryCard
            title="Acomodações afetadas"
            value={String(affectedUnitsCount)}
            helper="Com pelo menos um bloqueio"
            icon={<BedDouble className="h-6 w-6" />}
          />

          <SummaryCard
            title="Bloqueios do mês"
            value={String(monthCount)}
            helper="Com interseção no mês atual"
            icon={<Filter className="h-6 w-6" />}
          />
        </section>

        {notice ? (
          <div
            className={`rounded-[1.5rem] border px-5 py-4 text-sm font-bold ${
              isErrorMessage
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice}
          </div>
        ) : null}

        <BlockedDateForm units={units} />

        <section className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--app-shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--admin-text)]">
                Bloqueios cadastrados
              </h2>
              <p className="text-sm text-[var(--admin-muted)]">
                Filtre por acomodação, período, motivo ou nome.
              </p>
            </div>

            <a
              href="#novo-bloqueio"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:opacity-90"
              style={{ color: "#ffffff" }}
            >
              <Plus className="h-4 w-4" />
              Novo bloqueio
            </a>
          </div>

          <form
            action="/admin/bloqueios"
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.3fr_auto]"
          >
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
                De
              </span>

              <input
                type="date"
                name="from"
                defaultValue={from}
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Até
              </span>

              <input
                type="date"
                name="to"
                defaultValue={to}
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
              />
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
                  placeholder="Motivo ou acomodação..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:opacity-90"
                style={{ color: "#ffffff" }}
              >
                Filtrar
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={buildBlockedDatesUrl({})}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)]"
            >
              Limpar filtros
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--app-shadow-soft)]">
          {filteredBlockedDates.length === 0 ? (
            <div className="p-10 text-center">
              <LockKeyhole className="mx-auto h-12 w-12 text-[var(--app-primary)]" />
              <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                Nenhum bloqueio encontrado
              </h3>
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                Crie um novo bloqueio ou ajuste os filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-soft)] text-left text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                    <th className="px-5 py-4">Acomodação</th>
                    <th className="px-5 py-4">Período</th>
                    <th className="px-5 py-4">Motivo</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBlockedDates.map((blocked) => {
                    const unit = getRelationItem(blocked.units);

                    return (
                      <tr
                        key={blocked.id}
                        className="border-b border-[var(--admin-border)] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-black text-[var(--admin-text)]">
                            {unit?.name || "Acomodação"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[var(--admin-muted)]">
                            {unit?.slug || "sem-slug"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-3 py-1 text-xs font-black text-[var(--admin-text)]">
                            {formatDate(blocked.start_date)} até{" "}
                            {formatDate(blocked.end_date)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[360px] text-sm font-bold text-[var(--admin-text)]">
                            {blocked.reason || "Bloqueio"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/bloqueios/${blocked.id}/editar`}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
                            >
                              <Edit3 className="h-4 w-4" />
                              Editar
                            </Link>

                            <DeleteBlockedDateButton id={blocked.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/calendario"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
          >
            Ver calendário
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/admin/mapa-reservas"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
          >
            Ver mapa
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
