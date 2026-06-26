export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateReservationDetails } from "@/lib/actions/admin/reservation-edit";

type AdminEditReservationPageProps = {
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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
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
    missing_fields: {
      title: "Preencha os campos obrigatórios.",
      description: "Acomodação, datas e status são obrigatórios.",
      type: "error",
    },
    invalid_dates: {
      title: "Período inválido.",
      description: "O check-out precisa ser posterior ao check-in.",
      type: "error",
    },
    invalid_guests: {
      title: "Quantidade de hóspedes inválida.",
      description: "Informe pelo menos 1 hóspede.",
      type: "error",
    },
    too_many_guests: {
      title: "Quantidade acima da capacidade.",
      description: "A acomodação selecionada não comporta esse número de hóspedes.",
      type: "error",
    },
    unit_not_found: {
      title: "Acomodação não encontrada.",
      description: "Selecione uma acomodação válida.",
      type: "error",
    },
    guest_error: {
      title: "Erro ao atualizar hóspede.",
      description: "A reserva não foi salva porque houve erro nos dados do hóspede.",
      type: "error",
    },
    error: {
      title: "Erro ao salvar reserva.",
      description: "Não foi possível atualizar a reserva. Tente novamente.",
      type: "error",
    },
  };

  if (!message) return null;

  return messages[message] || null;
}

export default async function AdminEditReservationPage({
  params,
  searchParams,
}: AdminEditReservationPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const messageContent = getMessageContent(query.message);

  const supabase = createAdminClient();

  const [reservationResult, unitsResult] = await Promise.all([
    supabase
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
          base_price,
          cleaning_fee,
          max_guests
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
      .eq("id", id)
      .single(),

    supabase
      .from("units")
      .select("id, name, base_price, cleaning_fee, max_guests, is_active")
      .order("name", { ascending: true }),
  ]);

  if (reservationResult.error || !reservationResult.data) {
    notFound();
  }

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message);
  }

  const reservation = reservationResult.data;
  const units = unitsResult.data || [];

  const unit = Array.isArray(reservation.units)
    ? reservation.units[0]
    : reservation.units;

  const guest = Array.isArray(reservation.guests)
    ? reservation.guests[0]
    : reservation.guests;

  return (
    <div className="space-y-6 font-sans">
      {messageContent ? (
        <div
          className={`rounded-[1.5rem] border p-5 ${
            messageContent.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="font-bold">{messageContent.title}</p>
          <p className="mt-1 text-sm">{messageContent.description}</p>
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)] md:p-8">
        <Link
          href={`/admin/reservas/${reservation.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-card-soft)] px-3 py-1.5 text-xs font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para reserva
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
              Editar reserva
            </p>

            <h1 className="mt-2 text-[34px] font-black leading-[1.05] tracking-[-0.05em] text-[var(--app-text)] md:text-[46px]">
              Reserva de {guest?.name || "hóspede"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[var(--app-text-soft)]">
              Atualize datas, acomodação, status, pagamento e dados do hóspede.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5">
            <p className="text-xs font-bold text-[var(--app-text-muted)]">
              Reserva atual
            </p>

            <p className="mt-2 text-sm font-black text-[var(--app-text)]">
              {formatDate(reservation.check_in)} até{" "}
              {formatDate(reservation.check_out)}
            </p>

            <p className="mt-1 text-sm text-[var(--app-text-soft)]">
              {reservation.nights || 0} noites · {unit?.name || "Acomodação"}
            </p>

            <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
              {formatMoney(reservation.total)}
            </p>
          </div>
        </div>
      </section>

      <form action={updateReservationDetails} className="space-y-6">
        <input type="hidden" name="reservation_id" value={reservation.id} />
        <input type="hidden" name="guest_id" value={guest?.id || ""} />

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
              <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
                      Dados da reserva
                    </h2>

                    <p className="text-sm text-[var(--app-text-soft)]">
                      Período, acomodação e status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Acomodação
                  </span>

                  <select
                    name="unit_id"
                    defaultValue={reservation.unit_id || ""}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    required
                  >
                    <option value="">Selecione</option>

                    {units.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {formatMoney(item.base_price)}/noite · máx.{" "}
                        {item.max_guests || 0} hóspedes
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Check-in
                  </span>

                  <input
                    type="date"
                    name="check_in"
                    defaultValue={reservation.check_in || ""}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Check-out
                  </span>

                  <input
                    type="date"
                    name="check_out"
                    defaultValue={reservation.check_out || ""}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Hóspedes
                  </span>

                  <input
                    type="number"
                    name="guests_count"
                    min="1"
                    defaultValue={reservation.guests_count || 1}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Origem
                  </span>

                  <input
                    name="source"
                    defaultValue={reservation.source || "website"}
                    placeholder="website, whatsapp, airbnb..."
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Status da reserva
                  </span>

                  <select
                    name="status"
                    defaultValue={reservation.status || "pending"}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    required
                  >
                    <option value="pending">Pendente</option>
                    <option value="awaiting_payment">Aguardando pagamento</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="checked_in">Check-in feito</option>
                    <option value="checked_out">Check-out feito</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="no_show">No-show</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Status do pagamento
                  </span>

                  <select
                    name="payment_status"
                    defaultValue={reservation.payment_status || "unpaid"}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    required
                  >
                    <option value="unpaid">Não pago</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="failed">Falhou</option>
                    <option value="refunded">Reembolsado</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Desconto
                  </span>

                  <input
                    type="number"
                    name="discount"
                    min="0"
                    step="0.01"
                    defaultValue={reservation.discount || 0}
                    className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Observações internas
                  </span>

                  <textarea
                    name="internal_notes"
                    defaultValue={reservation.internal_notes || ""}
                    rows={5}
                    placeholder="Observações visíveis apenas para a equipe..."
                    className="w-full resize-none rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
              <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                    <User className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
                      Dados do hóspede
                    </h2>

                    <p className="text-sm text-[var(--app-text-soft)]">
                      Nome, contato e país.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Nome
                  </span>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />

                    <input
                      name="guest_name"
                      defaultValue={guest?.name || ""}
                      className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white pl-11 pr-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    E-mail
                  </span>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />

                    <input
                      type="email"
                      name="guest_email"
                      defaultValue={guest?.email || ""}
                      className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white pl-11 pr-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    Telefone
                  </span>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />

                    <input
                      name="guest_phone"
                      defaultValue={guest?.phone || ""}
                      className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white pl-11 pr-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    />
                  </div>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                    País
                  </span>

                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />

                    <input
                      name="guest_country"
                      defaultValue={guest?.country || ""}
                      className="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white pl-11 pr-4 text-sm font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="sticky top-28 rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                Resumo financeiro
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--app-text-soft)]">
                    <BedDouble className="h-4 w-4 text-[var(--app-primary)]" />
                    Subtotal atual
                  </span>

                  <strong className="text-[var(--app-text)]">
                    {formatMoney(reservation.subtotal)}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--app-text-soft)]">
                    <DollarSign className="h-4 w-4 text-[var(--app-primary)]" />
                    Limpeza
                  </span>

                  <strong className="text-[var(--app-text)]">
                    {formatMoney(reservation.cleaning_fee)}
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--app-text-soft)]">
                    <Users className="h-4 w-4 text-[var(--app-primary)]" />
                    Hóspedes
                  </span>

                  <strong className="text-[var(--app-text)]">
                    {reservation.guests_count || 0}
                  </strong>
                </div>

                <div className="rounded-2xl bg-[var(--app-primary)] p-5 text-white">
                  <p className="text-sm font-bold text-white/75">Total atual</p>

                  <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">
                    {formatMoney(reservation.total)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-[var(--app-text-muted)]">
                Ao salvar, o sistema recalcula noites, subtotal, taxa de limpeza
                e total usando o preço da acomodação selecionada.
              </p>

              <button
                type="submit"
                className="admin-btn-primary mt-6 min-h-12 w-full px-5 text-sm"
              >
                <Save className="h-4 w-4" />
                Salvar alterações
              </button>

              <Link
                href={`/admin/reservas/${reservation.id}`}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-5 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
              >
                Cancelar
              </Link>
            </div>
          </aside>
        </section>
      </form>
    </div>
  );
}