export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Filter,
  Hotel,
  Search,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type FinancialPageProps = {
  searchParams: Promise<{
    start?: string;
    end?: string;
    status?: string;
    payment_status?: string;
    source?: string;
    q?: string;
  }>;
};

type FinancialReservation = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  nights: number | string | null;
  guests_count: number | string | null;
  subtotal: number | string | null;
  cleaning_fee: number | string | null;
  discount: number | string | null;
  total: number | string | null;
  status: string | null;
  payment_status: string | null;
  source: string | null;
  created_at: string | null;
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

function getMonthStartYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCompactMoney(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  if (amount >= 1000000) {
    return `US$ ${(amount / 1000000).toFixed(1)}M`;
  }

  if (amount >= 1000) {
    return `US$ ${(amount / 1000).toFixed(1)}k`;
  }

  return formatMoney(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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

function getPaymentLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    refunded: "Reembolsado",
    failed: "Falhou",
  };

  return labels[String(status || "")] || "Pendente";
}

function getStatusClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    pending: "border-amber-100 bg-amber-50 text-amber-700",
    awaiting_payment: "border-sky-100 bg-sky-50 text-sky-700",
    confirmed: "border-emerald-100 bg-emerald-50 text-emerald-700",
    checked_in: "border-teal-100 bg-teal-50 text-teal-700",
    checked_out: "border-[var(--admin-border)] bg-slate-100 text-slate-700",
    cancelled: "border-rose-100 bg-rose-50 text-rose-700",
  };

  return classes[String(status || "")] || classes.pending;
}

function getPaymentClasses(status: string | null | undefined) {
  const classes: Record<string, string> = {
    pending: "border-amber-100 bg-amber-50 text-amber-700",
    paid: "border-emerald-100 bg-emerald-50 text-emerald-700",
    refunded: "border-[var(--admin-border)] bg-slate-100 text-slate-700",
    failed: "border-rose-100 bg-rose-50 text-rose-700",
  };

  return classes[String(status || "")] || classes.pending;
}

function getSourceLabel(source: string | null | undefined) {
  const labels: Record<string, string> = {
    manual: "Manual",
    site: "Site",
    website: "Website",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    booking: "Booking",
    airbnb: "Airbnb",
    international_site: "Site internacional",
  };

  return labels[String(source || "")] || source || "Não informado";
}

function buildFilterUrl(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const queryString = query.toString();

  return queryString ? `/admin/financeiro?${queryString}` : "/admin/financeiro";
}

function SummaryCard({
  title,
  value,
  helper,
  icon,
  variant = "default",
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const styles = {
    default: {
      card: "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]",
      icon: "bg-[var(--app-primary-soft)] text-[var(--app-primary)]",
      text: "text-[var(--admin-muted)]",
    },
    primary: {
      card: "border-[#0b5963] bg-[#0b5963] text-white",
      icon: "bg-[rgba(255,255,255,0.15)] text-white",
      text: "text-white/70",
    },
    success: {
      card: "border-emerald-600 bg-emerald-600 text-white",
      icon: "bg-[rgba(255,255,255,0.15)] text-white",
      text: "text-white/70",
    },
    warning: {
      card: "border-amber-500 bg-amber-500 text-white",
      icon: "bg-[rgba(255,255,255,0.15)] text-white",
      text: "text-white/75",
    },
    danger: {
      card: "border-rose-500 bg-rose-500 text-white",
      icon: "bg-[rgba(255,255,255,0.15)] text-white",
      text: "text-white/75",
    },
  };

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-[1.45rem] border p-4 shadow-[0_14px_36px_rgba(7,52,59,0.06)] ${styles[variant].card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.12em] ${styles[variant].text}`}
          >
            {title}
          </p>

          <p className="mt-2 truncate text-[24px] font-black leading-none tracking-[-0.065em] md:text-[28px]">
            {value}
          </p>

          <p className={`mt-2 text-[11px] font-bold leading-5 ${styles[variant].text}`}>
            {helper}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles[variant].icon}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function BreakdownCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: {
    label: string;
    value: number;
    amount: number;
  }[];
}) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="rounded-[1.65rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-[-0.05em] text-[var(--admin-text)]">
            {title}
          </h2>

          <p className="mt-1 text-xs font-medium text-[var(--admin-muted)]">{subtitle}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-6 text-center">
            <p className="text-sm font-bold text-[var(--admin-muted)]">
              Nenhum dado para exibir.
            </p>
          </div>
        ) : (
          items.slice(0, 6).map((item) => {
            const percent =
              totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[var(--admin-text)]">
                      {item.label}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[var(--admin-muted)]">
                      {item.value} entrada{item.value !== 1 ? "s" : ""} · {percent}%
                    </p>
                  </div>

                  <strong className="shrink-0 text-sm text-[var(--admin-text)]">
                    {formatMoney(item.amount)}
                  </strong>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--app-primary)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function FinancialTable({
  reservations,
}: {
  reservations: FinancialReservation[];
}) {
  if (reservations.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-12 text-center shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
        <WalletCards className="mx-auto h-12 w-12 text-[var(--app-primary)]" />

        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
          Nenhuma entrada encontrada
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--admin-muted)]">
          Tente alterar os filtros de período, origem, status ou pagamento.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-4">
        <div>
          <h2 className="text-lg font-black tracking-[-0.05em] text-[var(--admin-text)]">
            Todas as entradas
          </h2>

          <p className="mt-1 text-xs font-medium text-[var(--admin-muted)]">
            Lançamentos financeiros baseados nas reservas filtradas.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)]"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-[var(--admin-surface-soft)] text-left text-[10px] font-black uppercase tracking-[0.13em] text-[var(--admin-muted-2)]">
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Reserva
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Acomodação
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Check-in
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Check-out
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Origem
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Status
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                Pagamento
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right">
                Subtotal
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right">
                Limpeza
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right">
                Desconto
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right">
                Total
              </th>
              <th className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right">
                Ação
              </th>
            </tr>
          </thead>

          <tbody>
            {reservations.map((reservation) => {
              const guest = getRelationItem(reservation.guests);
              const unit = getRelationItem(reservation.units);

              return (
                <tr key={reservation.id} className="group transition hover:bg-[var(--admin-surface-soft)]">
                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-xs font-black text-white">
                        {String(guest?.name || "H")
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate text-sm font-black text-[var(--admin-text)]">
                          {guest?.name || "Hóspede"}
                        </p>

                        <p className="mt-1 max-w-[180px] truncate text-xs text-[var(--admin-muted-2)]">
                          Criada em {formatDateTime(reservation.created_at)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-sm font-bold text-[var(--admin-text)]">
                    <span className="block max-w-[180px] truncate">
                      {unit?.name || "Acomodação"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-sm font-black text-[var(--admin-text)]">
                    {formatDate(reservation.check_in)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-sm font-black text-[var(--admin-text)]">
                    {formatDate(reservation.check_out)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-sm font-bold text-[var(--admin-text)]">
                    {getSourceLabel(reservation.source)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
                        reservation.status
                      )}`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getPaymentClasses(
                        reservation.payment_status
                      )}`}
                    >
                      {getPaymentLabel(reservation.payment_status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right text-sm font-bold text-[var(--admin-text)]">
                    {formatMoney(reservation.subtotal)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right text-sm font-bold text-[var(--admin-text)]">
                    {formatMoney(reservation.cleaning_fee)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right text-sm font-bold text-[var(--admin-text)]">
                    {formatMoney(reservation.discount)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right text-sm font-black text-[var(--admin-text)]">
                    {formatMoney(reservation.total)}
                  </td>

                  <td className="whitespace-nowrap border-b border-[var(--admin-border)] px-4 py-4 text-right">
                    <Link
                      href={`/admin/reservas/${reservation.id}`}
                      className="inline-flex min-h-9 items-center justify-center rounded-2xl px-4 text-xs font-black text-white transition hover:opacity-90"
                      style={{
                        backgroundColor: "var(--app-primary)",
                        color: "#ffffff",
                      }}
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminFinancialPage({
  searchParams,
}: FinancialPageProps) {
  const params = await searchParams;

  const start = String(params.start || getMonthStartYmd()).trim();
  const end = String(params.end || getTodayYmd()).trim();
  const status = String(params.status || "all").trim();
  const paymentStatus = String(params.payment_status || "all").trim();
  const source = String(params.source || "all").trim();
  const q = String(params.q || "").trim().toLowerCase();

  const supabase = createAdminClient();

  let query = supabase
    .from("reservations")
    .select(
      `
      id,
      check_in,
      check_out,
      nights,
      guests_count,
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
        name
      ),
      guests (
        id,
        name,
        email,
        phone,
        country
      )
    `
    )
    .gte("check_in", start)
    .lte("check_in", end)
    .order("check_in", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (paymentStatus !== "all") {
    query = query.eq("payment_status", paymentStatus);
  }

  if (source !== "all") {
    query = query.eq("source", source);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const allReservations = (data || []) as FinancialReservation[];

  const reservations = allReservations.filter((reservation) => {
    if (!q) return true;

    const guest = getRelationItem(reservation.guests);
    const unit = getRelationItem(reservation.units);

    const haystack = [
      guest?.name,
      guest?.email,
      guest?.phone,
      unit?.name,
      reservation.source,
      reservation.status,
      reservation.payment_status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  const validReservations = reservations.filter(
    (reservation) => reservation.status !== "cancelled"
  );

  const paidReservations = validReservations.filter(
    (reservation) => reservation.payment_status === "paid"
  );

  const pendingReservations = validReservations.filter(
    (reservation) => reservation.payment_status === "pending"
  );

  const failedReservations = validReservations.filter(
    (reservation) => reservation.payment_status === "failed"
  );

  const refundedReservations = validReservations.filter(
    (reservation) => reservation.payment_status === "refunded"
  );

  const totalForecast = validReservations.reduce((sum, reservation) => {
    return sum + Number(reservation.total || 0);
  }, 0);

  const totalPaid = paidReservations.reduce((sum, reservation) => {
    return sum + Number(reservation.total || 0);
  }, 0);

  const totalPending = pendingReservations.reduce((sum, reservation) => {
    return sum + Number(reservation.total || 0);
  }, 0);

  const totalFailed = failedReservations.reduce((sum, reservation) => {
    return sum + Number(reservation.total || 0);
  }, 0);

  const totalRefunded = refundedReservations.reduce((sum, reservation) => {
    return sum + Number(reservation.total || 0);
  }, 0);

  const totalDiscounts = validReservations.reduce((sum, reservation) => {
    return sum + Number(reservation.discount || 0);
  }, 0);

  const averageTicket =
    validReservations.length > 0 ? totalForecast / validReservations.length : 0;

  const conversionRate =
    validReservations.length > 0
      ? Math.round((paidReservations.length / validReservations.length) * 100)
      : 0;

  const bySourceMap = new Map<string, { value: number; amount: number }>();
  const byUnitMap = new Map<string, { value: number; amount: number }>();

  validReservations.forEach((reservation) => {
    const sourceLabel = getSourceLabel(reservation.source);
    const currentSource = bySourceMap.get(sourceLabel) || {
      value: 0,
      amount: 0,
    };

    bySourceMap.set(sourceLabel, {
      value: currentSource.value + 1,
      amount: currentSource.amount + Number(reservation.total || 0),
    });

    const unit = getRelationItem(reservation.units);
    const unitLabel = unit?.name || "Sem acomodação";
    const currentUnit = byUnitMap.get(unitLabel) || {
      value: 0,
      amount: 0,
    };

    byUnitMap.set(unitLabel, {
      value: currentUnit.value + 1,
      amount: currentUnit.amount + Number(reservation.total || 0),
    });
  });

  const bySource = Array.from(bySourceMap.entries())
    .map(([label, item]) => ({
      label,
      value: item.value,
      amount: item.amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const byUnit = Array.from(byUnitMap.entries())
    .map(([label, item]) => ({
      label,
      value: item.value,
      amount: item.amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <form
          action="/admin/financeiro"
          className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)] md:p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
              <Filter className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black tracking-[-0.05em] text-[var(--admin-text)]">
                Filtros financeiros
              </h2>

              <p className="text-xs font-medium text-[var(--admin-muted)]">
                Filtre entradas por período, status, pagamento, origem ou busca.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1.15fr_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Início
              </span>

              <input
                type="date"
                name="start"
                defaultValue={start}
                className="min-h-12 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-black text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Fim
              </span>

              <input
                type="date"
                name="end"
                defaultValue={end}
                className="min-h-12 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-black text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Reserva
              </span>

              <select
                name="status"
                defaultValue={status}
                className="min-h-12 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-black text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="awaiting_payment">Aguardando</option>
                <option value="confirmed">Confirmada</option>
                <option value="checked_in">Check-in</option>
                <option value="checked_out">Check-out</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Pagamento
              </span>

              <select
                name="payment_status"
                defaultValue={paymentStatus}
                className="min-h-12 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-black text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="failed">Falhou</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Origem
              </span>

              <select
                name="source"
                defaultValue={source}
                className="min-h-12 w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-black text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              >
                <option value="all">Todas</option>
                <option value="manual">Manual</option>
                <option value="site">Site</option>
                <option value="website">Website</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="booking">Booking</option>
                <option value="airbnb">Airbnb</option>
                <option value="international_site">Site internacional</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                Busca
              </span>

              <div className="flex min-h-12 w-full items-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
                <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted-2)]" />

                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Hóspede, origem, acomodação..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-black text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black text-white transition hover:opacity-90"
                style={{
                  backgroundColor: "var(--app-primary)",
                  color: "#ffffff",
                }}
              >
                Filtrar
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/admin/financeiro"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-xs font-black text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
            >
              Limpar filtros
            </Link>

            <Link
              href={buildFilterUrl({
                start: getMonthStartYmd(),
                end: getTodayYmd(),
                payment_status: "paid",
              })}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
            >
              Pagos do mês
            </Link>

            <Link
              href={buildFilterUrl({
                start,
                end,
                payment_status: "pending",
              })}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 px-4 text-xs font-black text-amber-700 transition hover:bg-amber-100"
            >
              Pendentes
            </Link>
          </div>
        </form>

        <section className="grid gap-4 lg:grid-cols-3">
          <SummaryCard
            title="Recebido"
            value={formatCompactMoney(totalPaid)}
            helper={`${paidReservations.length} reserva${
              paidReservations.length !== 1 ? "s" : ""
            } paga${paidReservations.length !== 1 ? "s" : ""}`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />

          <SummaryCard
            title="Pendente"
            value={formatCompactMoney(totalPending)}
            helper={`${pendingReservations.length} entrada${
              pendingReservations.length !== 1 ? "s" : ""
            } em aberto`}
            icon={<CreditCard className="h-5 w-5" />}
            variant="warning"
          />

          <SummaryCard
            title="Previsão total"
            value={formatCompactMoney(totalForecast)}
            helper={`${validReservations.length} reserva${
              validReservations.length !== 1 ? "s" : ""
            } no período`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="primary"
          />

          <SummaryCard
            title="Ticket médio"
            value={formatCompactMoney(averageTicket)}
            helper={`Conversão de pagamento: ${conversionRate}%`}
            icon={<Banknote className="h-5 w-5" />}
          />

          <SummaryCard
            title="Descontos"
            value={formatCompactMoney(totalDiscounts)}
            helper={`Falhas: ${formatMoney(totalFailed)} · Reembolsos: ${formatMoney(
              totalRefunded
            )}`}
            icon={<TrendingDown className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <BreakdownCard
            title="Receita por origem"
            subtitle="Entenda de onde vêm as principais entradas."
            items={bySource}
          />

          <BreakdownCard
            title="Receita por acomodação"
            subtitle="Veja quais unidades geram mais faturamento."
            items={byUnit}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <FinancialTable reservations={reservations} />

          <aside className="space-y-6">
            <section className="rounded-[1.65rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
              <h2 className="text-lg font-black tracking-[-0.05em] text-[var(--admin-text)]">
                Funcionalidades financeiras
              </h2>

              <p className="mt-1 text-xs font-medium text-[var(--admin-muted)]">
                Atalhos para ações relacionadas ao financeiro.
              </p>

              <div className="mt-5 space-y-3">
                <Link
                  href="/admin/reservas"
                  className="flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
                >
                  Gerenciar reservas
                  <ArrowRight className="h-4 w-4 text-[var(--app-primary)]" />
                </Link>

                <Link
                  href="/admin/checkins-checkouts"
                  className="flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
                >
                  Ver check-ins/check-outs
                  <ArrowRight className="h-4 w-4 text-[var(--app-primary)]" />
                </Link>

                <Link
                  href="/admin/mapa-reservas"
                  className="flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--app-primary-soft)]"
                >
                  Mapa de reservas
                  <ArrowRight className="h-4 w-4 text-[var(--app-primary)]" />
                </Link>
              </div>
            </section>

            <section className="rounded-[1.65rem] border border-[#0b5963] bg-[#0b5963] p-5 text-white shadow-[0_14px_36px_rgba(7,52,59,0.12)]">
              <CalendarDays className="h-7 w-7" />

              <h2 className="mt-4 text-lg font-black tracking-[-0.05em]">
                Período analisado
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/75">
                Reservas com check-in entre:
              </p>

              <p className="mt-4 rounded-2xl bg-[rgba(255,255,255,0.12)] p-4 text-sm font-black">
                {formatDate(start)} até {formatDate(end)}
              </p>
            </section>

            <section className="rounded-[1.65rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_14px_36px_rgba(7,52,59,0.05)]">
              <Hotel className="h-7 w-7 text-[var(--app-primary)]" />

              <h2 className="mt-4 text-lg font-black tracking-[-0.05em] text-[var(--admin-text)]">
                Resumo operacional
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-[var(--admin-muted)]">Reservas válidas</span>
                  <strong className="text-[var(--admin-text)]">
                    {validReservations.length}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-[var(--admin-muted)]">Pagas</span>
                  <strong className="text-emerald-600">
                    {paidReservations.length}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-[var(--admin-muted)]">Pendentes</span>
                  <strong className="text-amber-600">
                    {pendingReservations.length}
                  </strong>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}