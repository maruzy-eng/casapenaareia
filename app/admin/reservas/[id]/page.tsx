export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  User,
  Users,
  WalletCards,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateReservationStatus } from "@/lib/actions/admin/reservations";
import { ReservationQuickActions } from "@/components/admin/reservation-quick-actions";

type AdminReservationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

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

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
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

function getMessageContent(message: string | undefined) {
  const messages: Record<
    string,
    {
      title: string;
      description: string;
      type: "success" | "error";
    }
  > = {
    updated: {
      title: "Reserva atualizada com sucesso.",
      description: "Os dados da reserva foram salvos.",
      type: "success",
    },
    confirmed: {
      title: "Reserva confirmada.",
      description: "A reserva agora aparece como confirmada no sistema.",
      type: "success",
    },
    cancelled: {
      title: "Reserva cancelada.",
      description: "A reserva foi marcada como cancelada.",
      type: "success",
    },
    paid: {
      title: "Pagamento marcado como pago.",
      description: "O status financeiro da reserva foi atualizado.",
      type: "success",
    },
    awaiting_payment: {
      title: "Reserva aguardando pagamento.",
      description: "O hóspede ainda precisa concluir o pagamento.",
      type: "success",
    },
    checked_in: {
      title: "Check-in registrado.",
      description: "A reserva foi marcada como check-in feito.",
      type: "success",
    },
    checked_out: {
      title: "Check-out registrado.",
      description: "A reserva foi marcada como check-out feito.",
      type: "success",
    },
    error: {
      title: "Não foi possível atualizar a reserva.",
      description:
        "A ação não foi concluída. Verifique os campos da tabela e tente novamente.",
      type: "error",
    },
  };

  if (!message) return null;

  return messages[message] || null;
}

export default async function AdminReservationDetailPage({
  params,
  searchParams,
}: AdminReservationDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const messageContent = getMessageContent(query.message);

  const supabase = createAdminClient();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      guest_id,
      unit_id,
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
      internal_notes,
      created_at,
      units (
        id,
        name,
        slug,
        cover_image,
        max_guests,
        bedrooms,
        bathrooms,
        base_price,
        cleaning_fee
      ),
      guests (
        id,
        name,
        email,
        phone,
        country,
        created_at
      ),
      reservation_upgrades (
        id,
        upgrade_id,
        name,
        pricing_type,
        unit_price,
        quantity,
        total,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !reservation) {
    notFound();
  }

  const unit = Array.isArray(reservation.units)
    ? reservation.units[0]
    : reservation.units;

  const guest = Array.isArray(reservation.guests)
    ? reservation.guests[0]
    : reservation.guests;

  const status = String(reservation.status || "pending");
  const paymentStatus = String(reservation.payment_status || "unpaid");
  const reservationUpgrades = Array.isArray(
    reservation.reservation_upgrades
  )
    ? reservation.reservation_upgrades
    : [];
  const upgradesSubtotal = reservationUpgrades.reduce(
    (sum, upgrade) => sum + Number(upgrade.total || 0),
    0
  );

  return (
    <div className="space-y-6 font-sans">
      {messageContent ? (
        <div
          className={`flex items-start gap-3 rounded-[1.5rem] border p-5 ${
            messageContent.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
          }`}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">{messageContent.title}</p>

            <p className="mt-1 text-sm">{messageContent.description}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,89,99,0.10),rgba(39,180,196,0.08)_42%,transparent_72%)]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--app-teal-light)]/20 blur-3xl" />

          <div className="relative p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/reservas"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white/70 px-3 py-1.5 text-xs font-bold text-[var(--app-primary)] shadow-sm backdrop-blur transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para reservas
              </Link>

              <Link
                href={`/admin/reservas/${reservation.id}/editar`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white/70 px-3 py-1.5 text-xs font-bold text-[var(--app-primary)] shadow-sm backdrop-blur transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar reserva
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                  status
                )}`}
              >
                {getStatusLabel(status)}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClasses(
                  paymentStatus
                )}`}
              >
                {getPaymentStatusLabel(paymentStatus)}
              </span>
            </div>

            <h2 className="mt-5 max-w-3xl text-[30px] font-black leading-[1.05] tracking-[-0.045em] text-[var(--app-text)] md:text-[44px]">
              Reserva de {guest?.name || "hóspede"}
            </h2>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--app-text-soft)]">
              {formatDate(reservation.check_in)} até{" "}
              {formatDate(reservation.check_out)} ·{" "}
              {formatNumber(reservation.guests_count)} pessoa
              {Number(reservation.guests_count || 0) !== 1 ? "s" : ""} ·{" "}
              {unit?.name || "Acomodação"}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--app-border)] bg-white/80 p-4 dark:bg-white/5">
                <p className="text-xs font-medium text-[var(--app-text-muted)]">
                  Total
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
                  {formatMoney(reservation.total)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-white/80 p-4 dark:bg-white/5">
                <p className="text-xs font-medium text-[var(--app-text-muted)]">
                  Noites
                </p>

                <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
                  {formatNumber(reservation.nights)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-white/80 p-4 dark:bg-white/5">
                <p className="text-xs font-medium text-[var(--app-text-muted)]">
                  Origem
                </p>

                <p className="mt-2 truncate text-2xl font-black tracking-[-0.05em] text-[var(--app-text)]">
                  {reservation.source || "website"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ReservationQuickActions reservationId={reservation.id} />
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <WalletCards className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Subtotal
          </p>

          <p className="mt-1 text-[30px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatMoney(reservation.subtotal)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <BedDouble className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Limpeza
          </p>

          <p className="mt-1 text-[30px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatMoney(reservation.cleaning_fee)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <Users className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Hóspedes
          </p>

          <p className="mt-1 text-[30px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatNumber(reservation.guests_count)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <CalendarCheck className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Criada em
          </p>

          <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
            {formatDateTime(reservation.created_at)}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-6 md:px-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                Status manual
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
                Atualização avançada
              </h2>
            </div>

            <form action={updateReservationStatus} className="p-6 md:p-8">
              <input type="hidden" name="id" value={reservation.id} />

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Status da reserva
                  </span>

                  <select
                    name="status"
                    defaultValue={status}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                  >
                    <option value="pending">Pendente</option>
                    <option value="awaiting_payment">
                      Aguardando pagamento
                    </option>
                    <option value="confirmed">Confirmada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="checked_in">Check-in feito</option>
                    <option value="checked_out">Check-out feito</option>
                    <option value="no_show">No-show</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Status do pagamento
                  </span>

                  <select
                    name="payment_status"
                    defaultValue={paymentStatus}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                  >
                    <option value="unpaid">Não pago</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="failed">Falhou</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="admin-btn-primary mt-6 min-h-12 px-6 text-sm"
              >
                <Save className="h-4 w-4" />
                Salvar status
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-6 md:px-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                Financeiro
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
                Composição do valor
              </h2>
            </div>

            <div className="p-6 md:p-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="text-sm font-medium text-[var(--app-text-soft)]">
                    Diárias
                  </span>

                  <span className="font-black text-[var(--app-text)]">
                    {formatMoney(reservation.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="text-sm font-medium text-[var(--app-text-soft)]">
                    Upgrades
                  </span>

                  <span className="font-black text-[var(--app-text)]">
                    {formatMoney(upgradesSubtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="text-sm font-medium text-[var(--app-text-soft)]">
                    Taxa de limpeza
                  </span>

                  <span className="font-black text-[var(--app-text)]">
                    {formatMoney(reservation.cleaning_fee)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="text-sm font-medium text-[var(--app-text-soft)]">
                    Desconto
                  </span>

                  <span className="font-black text-[var(--app-text)]">
                    {formatMoney(reservation.discount)}
                  </span>
                </div>

                {reservationUpgrades.length > 0 ? (
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                    <p className="text-sm font-black text-[var(--app-text)]">
                      Upgrades selecionados
                    </p>

                    <div className="mt-3 space-y-2">
                      {reservationUpgrades.map((upgrade) => (
                        <div
                          key={upgrade.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-[var(--app-text-soft)]">
                            {upgrade.name} · {formatMoney(upgrade.unit_price)} x{" "}
                            {formatNumber(upgrade.quantity)}
                          </span>

                          <strong className="text-[var(--app-text)]">
                            {formatMoney(upgrade.total)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-2xl bg-[var(--app-primary)] p-5 text-white">
                  <span className="text-sm font-bold text-white/80">Total</span>

                  <span className="text-2xl font-black tracking-[-0.04em] text-white">
                    {formatMoney(reservation.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {reservation.internal_notes ? (
            <div className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)] md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                Observações
              </p>

              <p className="mt-4 text-sm leading-7 text-[var(--app-text-soft)]">
                {reservation.internal_notes}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
            <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                Hóspede
              </p>
            </div>

            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                <User className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
                {guest?.name || "Sem nome"}
              </h3>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <Mail className="mt-0.5 h-4 w-4 text-[var(--app-primary)]" />

                  <div>
                    <p className="text-xs font-bold text-[var(--app-text-muted)]">
                      E-mail
                    </p>

                    <p className="mt-1 break-all text-sm font-bold text-[var(--app-text)]">
                      {guest?.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <Phone className="mt-0.5 h-4 w-4 text-[var(--app-primary)]" />

                  <div>
                    <p className="text-xs font-bold text-[var(--app-text-muted)]">
                      Telefone
                    </p>

                    <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                      {guest?.phone || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <MapPin className="mt-0.5 h-4 w-4 text-[var(--app-primary)]" />

                  <div>
                    <p className="text-xs font-bold text-[var(--app-text-muted)]">
                      País
                    </p>

                    <p className="mt-1 text-sm font-bold text-[var(--app-text)]">
                      {guest?.country || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {guest?.id ? (
                <Link
                  href={`/admin/hospedes/${guest.id}`}
                  className="admin-btn-primary mt-5 min-h-11 w-full px-4 text-sm"
                >
                  Ver hóspede
                </Link>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
            <div
              className="h-48 bg-[var(--app-primary-soft)] bg-cover bg-center"
              style={{
                backgroundImage: unit?.cover_image
                  ? `url(${unit.cover_image})`
                  : undefined,
              }}
            />

            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                Acomodação
              </p>

              <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
                {unit?.name || "—"}
              </h3>

              <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                /acomodacoes/{unit?.slug || "—"}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <p className="text-xs text-[var(--app-text-muted)]">
                    Diária
                  </p>

                  <p className="mt-1 font-black text-[var(--app-text)]">
                    {formatMoney(unit?.base_price)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <p className="text-xs text-[var(--app-text-muted)]">
                    Máx. hóspedes
                  </p>

                  <p className="mt-1 font-black text-[var(--app-text)]">
                    {formatNumber(unit?.max_guests)}
                  </p>
                </div>
              </div>

              {unit?.id ? (
                <Link
                  href={`/admin/acomodacoes/${unit.id}`}
                  className="admin-btn-secondary mt-5 min-h-11 w-full px-4 text-sm"
                >
                  Editar acomodação
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
