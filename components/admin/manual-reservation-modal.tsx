"use client";

import { useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Loader2,
  Plus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createManualReservationAction,
  type ManualReservationPayload,
} from "@/lib/actions/admin/manual-reservations";
import type { PricingResult } from "@/lib/booking/pricing";

type UnitOption = {
  id: string;
  name: string | null;
  max_guests: number | string | null;
  base_price: number | string | null;
};

type ManualReservationModalProps = {
  units: UnitOption[];
};

type FormState = {
  unit_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_country: string;
  guests_count: string;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  notes: string;
};

const emptyForm: FormState = {
  unit_id: "",
  guest_name: "",
  guest_email: "",
  guest_phone: "",
  guest_country: "",
  guests_count: "1",
  check_in: "",
  check_out: "",
  status: "confirmed",
  payment_status: "pending",
  notes: "",
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function getAdjustmentLabel(adjustmentType: string) {
  const labels: Record<string, string> = {
    percentage_increase: "Aumento %",
    percentage_decrease: "Desconto %",
    fixed_increase: "Acréscimo",
    fixed_decrease: "Desconto fixo",
    fixed_price: "Preço fixo",
  };

  return labels[adjustmentType] || "Regra";
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted-2)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label}
      </span>

      <div className="relative">
        <select
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
      </div>
    </label>
  );
}

function PricingPreview({
  pricing,
  loading,
  error,
}: {
  pricing: PricingResult | null;
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
        <div className="flex items-center gap-3 text-sm font-bold text-[var(--admin-muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--app-primary)]" />
          Calculando tarifa com regras de preço...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
        {error}
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
        <p className="text-sm font-bold text-[var(--admin-text)]">
          Simulação de tarifa
        </p>

        <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
          Selecione acomodação, check-in e check-out para calcular o valor com alta temporada, baixa temporada e datas especiais.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--app-primary)]">
            Tarifa calculada
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {formatMoney(pricing.total)}
          </p>

          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {pricing.nights} noite
            {pricing.nights !== 1 ? "s" : ""} · preço base{" "}
            {formatMoney(pricing.basePrice)}
          </p>
        </div>

        {pricing.appliedRulesSummary.length > 0 ? (
          <div className="flex max-w-md flex-wrap gap-2">
            {pricing.appliedRulesSummary.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex rounded-full border border-[var(--app-primary)] bg-[var(--app-primary-soft)] px-3 py-1 text-xs font-black text-[var(--app-primary)]"
              >
                {rule.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="inline-flex rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1 text-xs font-bold text-[var(--admin-muted)]">
            Sem regras aplicadas
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        {pricing.nightsBreakdown.map((night) => (
          <div
            key={night.date}
            className="flex flex-col gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-black text-[var(--admin-text)]">
                {formatDate(night.date)}
              </p>

              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Base: {formatMoney(night.basePrice)}
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <p className="text-sm font-black text-[var(--admin-text)]">
                {formatMoney(night.finalPrice)}
              </p>

              {night.appliedRules.length > 0 ? (
                <div className="flex flex-wrap gap-1 md:justify-end">
                  {night.appliedRules.map((rule) => (
                    <span
                      key={rule.id}
                      className="rounded-full bg-[var(--app-primary-soft)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--app-primary)]"
                    >
                      {getAdjustmentLabel(rule.adjustment_type)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManualReservationModal({
  units,
}: ManualReservationModalProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingError, setPricingError] = useState("");
  const [pricingLoading, setPricingLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === form.unit_id) || null,
    [units, form.unit_id]
  );

  const canQuote =
    Boolean(form.unit_id) &&
    Boolean(form.check_in) &&
    Boolean(form.check_out);

  useEffect(() => {
    if (!open) return;

    if (!canQuote) {
      setPricing(null);
      setPricingError("");
      setPricingLoading(false);
      return;
    }

    let cancelled = false;

    async function quotePricing() {
      setPricingLoading(true);
      setPricingError("");

      try {
        const response = await fetch("/api/admin/pricing/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            unitId: form.unit_id,
            checkIn: form.check_in,
            checkOut: form.check_out,
          }),
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || !data?.ok) {
          setPricing(null);
          setPricingError(
            data?.message || "Não foi possível calcular a tarifa."
          );
          return;
        }

        setPricing(data.pricing as PricingResult);
      } catch (error) {
        if (cancelled) return;

        console.error("Erro ao calcular tarifa:", error);

        setPricing(null);
        setPricingError("Não foi possível calcular a tarifa.");
      } finally {
        if (!cancelled) {
          setPricingLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void quotePricing();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, canQuote, form.unit_id, form.check_in, form.check_out]);

  function updateForm<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setSubmitError("");
  }

  function resetAndClose() {
    if (isPending) return;

    setOpen(false);
    setForm(emptyForm);
    setPricing(null);
    setPricingError("");
    setPricingLoading(false);
    setSubmitError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError("");

    if (!pricing) {
      setSubmitError("Calcule a tarifa antes de criar a reserva.");
      return;
    }

    const payload: ManualReservationPayload = {
      unit_id: form.unit_id,
      guest_name: form.guest_name,
      guest_email: form.guest_email,
      guest_phone: form.guest_phone,
      guest_country: form.guest_country,
      guests_count: Number(form.guests_count || 1),
      check_in: form.check_in,
      check_out: form.check_out,
      status: form.status,
      payment_status: form.payment_status,
      notes: form.notes,
    };

    startTransition(() => {
      void (async () => {
        try {
          const result = await createManualReservationAction(payload);

          if (!result?.ok) {
            setSubmitError("Não foi possível criar a reserva.");
            return;
          }

          resetAndClose();
          router.refresh();
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Não foi possível criar a reserva.";

          setSubmitError(message);
        }
      })();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)]"
      >
        <Plus className="h-4 w-4" />
        Nova reserva
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--app-primary)]">
                  Reservas
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
                  Nova reserva manual
                </h2>

                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  O valor será calculado automaticamente com as regras de tarifa.
                </p>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 p-5">
              <section className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Acomodação"
                  value={form.unit_id}
                  onChange={(value) => updateForm("unit_id", value)}
                  required
                >
                  <option value="">Selecione</option>

                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name || "Acomodação"} ·{" "}
                      {formatMoney(unit.base_price)}
                    </option>
                  ))}
                </SelectField>

                <TextField
                  label="Check-in"
                  type="date"
                  required
                  value={form.check_in}
                  onChange={(value) => updateForm("check_in", value)}
                />

                <TextField
                  label="Check-out"
                  type="date"
                  required
                  value={form.check_out}
                  onChange={(value) => updateForm("check_out", value)}
                />
              </section>

              {selectedUnit ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
                    <BedDouble className="h-5 w-5 text-[var(--app-primary)]" />

                    <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
                      Acomodação
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--admin-text)]">
                      {selectedUnit.name || "Acomodação"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
                    <CircleDollarSign className="h-5 w-5 text-[var(--app-primary)]" />

                    <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
                      Preço base
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--admin-text)]">
                      {formatMoney(selectedUnit.base_price)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
                    <Users className="h-5 w-5 text-[var(--app-primary)]" />

                    <p className="mt-2 text-xs font-bold text-[var(--admin-muted)]">
                      Capacidade
                    </p>

                    <p className="mt-1 text-sm font-black text-[var(--admin-text)]">
                      {selectedUnit.max_guests || "—"} hóspede(s)
                    </p>
                  </div>
                </div>
              ) : null}

              <section className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nome do hóspede"
                  required
                  value={form.guest_name}
                  onChange={(value) => updateForm("guest_name", value)}
                  placeholder="Nome completo"
                />

                <TextField
                  label="E-mail"
                  type="email"
                  required
                  value={form.guest_email}
                  onChange={(value) => updateForm("guest_email", value)}
                  placeholder="email@exemplo.com"
                />

                <TextField
                  label="Telefone"
                  value={form.guest_phone}
                  onChange={(value) => updateForm("guest_phone", value)}
                  placeholder="+55..."
                />

                <TextField
                  label="País"
                  value={form.guest_country}
                  onChange={(value) => updateForm("guest_country", value)}
                  placeholder="Brasil"
                />
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Quantidade de hóspedes"
                  type="number"
                  required
                  value={form.guests_count}
                  onChange={(value) =>
                    updateForm("guests_count", value)
                  }
                />

                <SelectField
                  label="Status da reserva"
                  value={form.status}
                  onChange={(value) => updateForm("status", value)}
                >
                  <option value="pending">Pendente</option>
                  <option value="awaiting_payment">
                    Aguardando pagamento
                  </option>
                  <option value="confirmed">Confirmada</option>
                  <option value="checked_in">Check-in realizado</option>
                </SelectField>

                <SelectField
                  label="Pagamento"
                  value={form.payment_status}
                  onChange={(value) =>
                    updateForm("payment_status", value)
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="refunded">Reembolsado</option>
                  <option value="failed">Falhou</option>
                </SelectField>
              </section>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                  Observações
                </span>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    updateForm("notes", event.target.value)
                  }
                  rows={3}
                  placeholder="Observações internas da reserva..."
                  className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm font-medium text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted-2)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
                />
              </label>

              <PricingPreview
                pricing={pricing}
                loading={pricingLoading}
                error={pricingError}
              />

              {submitError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--admin-border)] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetAndClose}
                  disabled={isPending}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-bold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending || pricingLoading || !pricing}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando reserva...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Criar reserva por {pricing ? formatMoney(pricing.total) : "—"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ManualReservationModal;