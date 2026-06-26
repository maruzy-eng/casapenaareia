"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Power,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  createPricingRuleAction,
  deletePricingRuleAction,
  togglePricingRuleStatusAction,
  updatePricingRuleAction,
} from "@/lib/actions/admin/pricing-rules";

import type {
  PricingRuleItem,
  PricingUnitOption,
} from "@/app/admin/tarifas/page";
import type { PricingResult } from "@/lib/booking/pricing";

type PricingRulesClientProps = {
  initialRules: PricingRuleItem[];
  units: PricingUnitOption[];
};

type RuleFormState = {
  id?: string;
  name: string;
  description: string;
  type: string;
  adjustment_type: string;
  adjustment_value: string;
  starts_at: string;
  ends_at: string;
  weekdays: number[];
  minimum_nights: string;
  priority: string;
  applies_to_all_units: boolean;
  unit_ids: string[];
  is_active: boolean;
};

const emptyForm: RuleFormState = {
  name: "",
  description: "",
  type: "season",
  adjustment_type: "percentage_increase",
  adjustment_value: "",
  starts_at: "",
  ends_at: "",
  weekdays: [],
  minimum_nights: "",
  priority: "1",
  applies_to_all_units: true,
  unit_ids: [],
  is_active: true,
};

const ruleTypeLabels: Record<string, string> = {
  season: "Temporada",
  event: "Evento",
  holiday: "Feriado",
  weekday: "Dia da semana",
  manual: "Manual",
};

const adjustmentTypeLabels: Record<string, string> = {
  percentage_increase: "Aumentar %",
  percentage_decrease: "Diminuir %",
  fixed_increase: "Aumentar valor",
  fixed_decrease: "Diminuir valor",
  fixed_price: "Preço fixo",
};

const weekdays = [
  {
    value: 0,
    label: "Dom",
  },
  {
    value: 1,
    label: "Seg",
  },
  {
    value: 2,
    label: "Ter",
  },
  {
    value: 3,
    label: "Qua",
  },
  {
    value: 4,
    label: "Qui",
  },
  {
    value: 5,
    label: "Sex",
  },
  {
    value: 6,
    label: "Sáb",
  },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.slice(0, 10).split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatAdjustment(rule: PricingRuleItem) {
  const value = Number(rule.adjustment_value || 0);

  if (
    rule.adjustment_type === "percentage_increase" ||
    rule.adjustment_type === "percentage_decrease"
  ) {
    const signal =
      rule.adjustment_type === "percentage_increase"
        ? "+"
        : "-";

    return `${signal}${value}%`;
  }

  const formattedMoney = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

  if (rule.adjustment_type === "fixed_increase") {
    return `+ ${formattedMoney}`;
  }

  if (rule.adjustment_type === "fixed_decrease") {
    return `- ${formattedMoney}`;
  }

  return formattedMoney;
}

function getRuleUnitNames(rule: PricingRuleItem) {
  if (rule.applies_to_all_units) {
    return "Todas as acomodações";
  }

  const names =
    rule.pricing_rule_units
      ?.map((item) => {
        const unit = Array.isArray(item.units)
          ? item.units[0]
          : item.units;

        return unit?.name;
      })
      .filter(Boolean) || [];

  if (names.length === 0) {
    return "Nenhuma acomodação";
  }

  return names.join(", ");
}

function getRuleUnitIds(rule: PricingRuleItem) {
  return (
    rule.pricing_rule_units
      ?.map((item) => item.unit_id)
      .filter(Boolean) || []
  );
}

function getRuleTypeClass(type: string) {
  if (type === "event" || type === "holiday") {
    return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300";
  }

  if (type === "weekday") {
    return "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300";
  }

  return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300";
}

function buildFormFromRule(rule: PricingRuleItem): RuleFormState {
  return {
    id: rule.id,
    name: rule.name || "",
    description: rule.description || "",
    type: rule.type || "season",
    adjustment_type:
      rule.adjustment_type || "percentage_increase",
    adjustment_value: String(rule.adjustment_value || ""),
    starts_at: rule.starts_at || "",
    ends_at: rule.ends_at || "",
    weekdays: rule.weekdays || [],
    minimum_nights: rule.minimum_nights
      ? String(rule.minimum_nights)
      : "",
    priority: String(rule.priority || 1),
    applies_to_all_units: Boolean(rule.applies_to_all_units),
    unit_ids: getRuleUnitIds(rule),
    is_active: Boolean(rule.is_active),
  };
}

function SelectField({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label}
      </span>

      <div className="relative">
        <select
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

function PricingMetric({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
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

      <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-2)]">
        {description}
      </p>
    </article>
  );
}

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function PricingSimulator({ units }: { units: PricingUnitOption[] }) {
  const [unitId, setUnitId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState("2");
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function simulate() {
    setMessage("");
    setPricing(null);

    if (!unitId || !checkIn || !checkOut) {
      setMessage("Selecione acomodação, check-in e check-out.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/pricing/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          unitId,
          checkIn,
          checkOut,
          guestsCount: Number(guestsCount || 1),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        setMessage(data?.message || "Não foi possível simular a tarifa.");
        return;
      }

      setPricing(data.pricing as PricingResult);
    } catch (error) {
      console.error("Erro ao simular tarifa:", error);
      setMessage("Não foi possível simular a tarifa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--app-primary)]">
            Simulador de tarifa
          </p>

          <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
            Teste regras sem criar reserva
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
            Preço fixo vence outros ajustes na mesma noite. Sem preço fixo, as regras são aplicadas da maior prioridade para a menor.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]">
        <SelectField label="Acomodação" value={unitId} onChange={setUnitId}>
          <option value="">Selecione</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Check-in"
          type="date"
          value={checkIn}
          onChange={setCheckIn}
        />

        <TextField
          label="Check-out"
          type="date"
          value={checkOut}
          onChange={setCheckOut}
        />

        <TextField
          label="Hóspedes"
          type="number"
          value={guestsCount}
          onChange={setGuestsCount}
        />

        <div className="flex items-end">
          <button
            type="button"
            onClick={simulate}
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simular
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          {message}
        </div>
      ) : null}

      {pricing ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--admin-muted)]">
              Total simulado
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
              {formatMoney(pricing.total)}
            </p>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {pricing.nights} noite{pricing.nights !== 1 ? "s" : ""} · base{" "}
              {formatMoney(pricing.basePrice)}
            </p>
          </div>

          <div className="grid gap-2">
            {pricing.nightsBreakdown.map((night) => (
              <div
                key={night.date}
                className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-sm text-[var(--admin-text)]">
                    {formatDate(night.date)}
                  </strong>
                  <span className="text-sm font-black text-[var(--admin-text)]">
                    {formatMoney(night.finalPrice)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  Base {formatMoney(night.basePrice)}
                </p>

                {night.appliedRules.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {night.appliedRules.map((rule) => (
                      <span
                        key={rule.id}
                        className="rounded-full bg-[var(--app-primary-soft)] px-3 py-1 text-[11px] font-black text-[var(--app-primary)]"
                      >
                        {rule.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PricingRuleModal({
  open,
  onClose,
  form,
  setForm,
  units,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  form: RuleFormState;
  setForm: React.Dispatch<React.SetStateAction<RuleFormState>>;
  units: PricingUnitOption[];
  onSubmit: () => void;
  isPending: boolean;
}) {
  if (!open) return null;

  function toggleWeekday(day: number) {
    setForm((current) => {
      const exists = current.weekdays.includes(day);

      return {
        ...current,
        weekdays: exists
          ? current.weekdays.filter((item) => item !== day)
          : [...current.weekdays, day].sort(),
      };
    });
  }

  function toggleUnit(unitId: string) {
    setForm((current) => {
      const exists = current.unit_ids.includes(unitId);

      return {
        ...current,
        unit_ids: exists
          ? current.unit_ids.filter((item) => item !== unitId)
          : [...current.unit_ids, unitId],
      };
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--app-primary)]">
              Tarifas
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
              {form.id
                ? "Editar regra de preço"
                : "Nova regra de preço"}
            </h2>

            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Configure preços para temporada, datas especiais e eventos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome da regra"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="Ex: Alta temporada"
              required
            />

            <SelectField
              label="Tipo de regra"
              value={form.type}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  type: value,
                }))
              }
            >
              <option value="season">Temporada</option>
              <option value="event">Evento</option>
              <option value="holiday">Feriado</option>
              <option value="weekday">Dia da semana</option>
              <option value="manual">Manual</option>
            </SelectField>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Descrição
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="Ex: Regra aplicada durante verão, férias ou datas comemorativas."
              className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm font-medium text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted-2)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Ajuste"
              value={form.adjustment_type}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  adjustment_type: value,
                }))
              }
            >
              <option value="percentage_increase">
                Aumentar porcentagem
              </option>
              <option value="percentage_decrease">
                Diminuir porcentagem
              </option>
              <option value="fixed_increase">
                Aumentar valor fixo
              </option>
              <option value="fixed_decrease">
                Diminuir valor fixo
              </option>
              <option value="fixed_price">
                Definir preço fixo
              </option>
            </SelectField>

            <TextField
              label={
                form.adjustment_type.includes("percentage")
                  ? "Valor em %"
                  : "Valor em R$"
              }
              value={form.adjustment_value}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  adjustment_value: value,
                }))
              }
              placeholder={
                form.adjustment_type.includes("percentage")
                  ? "40"
                  : "950"
              }
              type="number"
              required
            />

            <TextField
              label="Prioridade"
              value={form.priority}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  priority: value,
                }))
              }
              placeholder="1"
              type="number"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <TextField
              label="Início"
              value={form.starts_at}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  starts_at: value,
                }))
              }
              type="date"
              required
            />

            <TextField
              label="Fim"
              value={form.ends_at}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ends_at: value,
                }))
              }
              type="date"
              required
            />

            <TextField
              label="Estadia mínima"
              value={form.minimum_nights}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  minimum_nights: value,
                }))
              }
              placeholder="Ex: 3"
              type="number"
            />
          </div>

          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
            <p className="text-sm font-black text-[var(--admin-text)]">
              Dias da semana
            </p>

            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              Deixe vazio para aplicar em todos os dias.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {weekdays.map((day) => {
                const active = form.weekdays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-black transition ${
                      active
                        ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                        : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-[var(--admin-text)]">
                  Acomodações
                </p>

                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  Escolha se a regra será aplicada em todas ou apenas em algumas.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    applies_to_all_units:
                      !current.applies_to_all_units,
                    unit_ids: current.applies_to_all_units
                      ? current.unit_ids
                      : [],
                  }))
                }
                className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-black transition ${
                  form.applies_to_all_units
                    ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-white"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)]"
                }`}
              >
                {form.applies_to_all_units
                  ? "Aplicar em todas"
                  : "Selecionar acomodações"}
              </button>
            </div>

            {!form.applies_to_all_units ? (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {units.length === 0 ? (
                  <p className="text-sm text-[var(--admin-muted)]">
                    Nenhuma acomodação cadastrada.
                  </p>
                ) : (
                  units.map((unit) => {
                    const active = form.unit_ids.includes(unit.id);

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => toggleUnit(unit.id)}
                        className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 text-left text-sm font-bold transition ${
                          active
                            ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                            : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
                        }`}
                      >
                        <span>{unit.name}</span>

                        {active ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--admin-border)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-bold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar regra
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PricingRulesClient({
  initialRules,
  units,
}: PricingRulesClientProps) {
  const [rules, setRules] = useState(initialRules);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] =
    useState<RuleFormState>(emptyForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredRules = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          rule.name,
          rule.description,
          rule.type,
          rule.adjustment_type,
          getRuleUnitNames(rule),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        typeFilter === "all" || rule.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && rule.is_active) ||
        (statusFilter === "inactive" && !rule.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rules, search, typeFilter, statusFilter]);

  const metrics = useMemo(() => {
    const active = rules.filter((rule) => rule.is_active).length;

    const specialDates = rules.filter(
      (rule) => rule.type === "event" || rule.type === "holiday"
    ).length;

    const fixedPrice = rules.filter(
      (rule) => rule.adjustment_type === "fixed_price"
    ).length;

    return {
      total: rules.length,
      active,
      specialDates,
      fixedPrice,
    };
  }, [rules]);

  function openCreateModal() {
    setErrorMessage("");
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(rule: PricingRuleItem) {
    setErrorMessage("");
    setForm(buildFormFromRule(rule));
    setModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;

    setModalOpen(false);
    setErrorMessage("");
    setForm(emptyForm);
  }

  function submitRule() {
    setErrorMessage("");

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          adjustment_value: Number(form.adjustment_value || 0),
          minimum_nights: form.minimum_nights
            ? Number(form.minimum_nights)
            : null,
          priority: Number(form.priority || 1),
        };

        if (form.id) {
          await updatePricingRuleAction(payload);
        } else {
          await createPricingRuleAction(payload);
        }

        window.location.reload();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a regra.";

        setErrorMessage(message);
      }
    });
  }

  function toggleStatus(rule: PricingRuleItem) {
    startTransition(async () => {
      try {
        await togglePricingRuleStatusAction(
          rule.id,
          !rule.is_active
        );

        setRules((current) =>
          current.map((item) =>
            item.id === rule.id
              ? {
                  ...item,
                  is_active: !item.is_active,
                }
              : item
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível alterar o status.";

        setErrorMessage(message);
      }
    });
  }

  function deleteRule(rule: PricingRuleItem) {
    const confirmed = window.confirm(
      `Deseja excluir a regra "${rule.name}"?`
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deletePricingRuleAction(rule.id);

        setRules((current) =>
          current.filter((item) => item.id !== rule.id)
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a regra.";

        setErrorMessage(message);
      }
    });
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  }

  const hasFilters =
    search || typeFilter !== "all" || statusFilter !== "all";

  return (
    <main className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PricingMetric
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Total de regras"
          value={metrics.total}
          description="Regras de preço cadastradas"
        />

        <PricingMetric
          icon={<Power className="h-5 w-5" />}
          label="Regras ativas"
          value={metrics.active}
          description="Aplicadas no cálculo da reserva"
        />

        <PricingMetric
          icon={<CalendarDays className="h-5 w-5" />}
          label="Datas especiais"
          value={metrics.specialDates}
          description="Eventos e feriados cadastrados"
        />

        <PricingMetric
          icon={<Sparkles className="h-5 w-5" />}
          label="Preço fixo"
          value={metrics.fixedPrice}
          description="Regras que substituem o preço base"
        />
      </section>

      <PricingSimulator units={units} />

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[var(--admin-border)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
              Regras de preço
            </h2>

            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Controle alta temporada, baixa temporada, feriados e eventos.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)]"
          >
            <Plus className="h-4 w-4" />
            Nova regra
          </button>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_190px_170px_auto]">
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
              <Search className="h-5 w-5 shrink-0 text-[var(--admin-muted-2)]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar regra, data ou acomodação..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
                className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold text-[var(--admin-text)] outline-none"
              >
                <option value="all">Todos os tipos</option>
                <option value="season">Temporada</option>
                <option value="event">Evento</option>
                <option value="holiday">Feriado</option>
                <option value="weekday">Dia da semana</option>
                <option value="manual">Manual</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold text-[var(--admin-text)] outline-none"
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Filter className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            {filteredRules.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-10 text-center">
                <CircleDollarSign className="mx-auto h-12 w-12 text-[var(--app-primary)]" />

                <h3 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
                  Nenhuma regra encontrada
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--admin-muted)]">
                  Crie sua primeira regra para automatizar preços de alta temporada, baixa temporada e datas especiais.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--app-primary-strong)]"
                >
                  <Plus className="h-4 w-4" />
                  Criar regra
                </button>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <article
                  key={rule.id}
                  className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5 transition hover:border-[var(--admin-border-strong)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getRuleTypeClass(
                            rule.type
                          )}`}
                        >
                          {ruleTypeLabels[rule.type] || "Regra"}
                        </span>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                            rule.is_active
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/45"
                          }`}
                        >
                          {rule.is_active ? "Ativa" : "Inativa"}
                        </span>

                        <span className="inline-flex rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1 text-xs font-black text-[var(--admin-muted)]">
                          Prioridade {rule.priority}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                        {rule.name}
                      </h3>

                      {rule.description ? (
                        <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--admin-muted)]">
                          {rule.description}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <p className="text-xs font-bold text-[var(--admin-muted)]">
                            Período
                          </p>

                          <p className="mt-1 text-sm font-black text-[var(--admin-text)]">
                            {formatDate(rule.starts_at)} até{" "}
                            {formatDate(rule.ends_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <p className="text-xs font-bold text-[var(--admin-muted)]">
                            Ajuste
                          </p>

                          <p className="mt-1 text-sm font-black text-[var(--admin-text)]">
                            {adjustmentTypeLabels[
                              rule.adjustment_type
                            ] || "Ajuste"}{" "}
                            · {formatAdjustment(rule)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <p className="text-xs font-bold text-[var(--admin-muted)]">
                            Estadia mínima
                          </p>

                          <p className="mt-1 text-sm font-black text-[var(--admin-text)]">
                            {rule.minimum_nights
                              ? `${rule.minimum_nights} noite(s)`
                              : "Padrão"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <p className="text-xs font-bold text-[var(--admin-muted)]">
                            Acomodações
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm font-black text-[var(--admin-text)]">
                            {getRuleUnitNames(rule)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStatus(rule)}
                        disabled={isPending}
                        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          rule.is_active
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                        }`}
                      >
                        <Power className="h-4 w-4" />
                        {rule.is_active ? "Desativar" : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(rule)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-black text-[var(--admin-muted)] transition hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteRule(rule)}
                        disabled={isPending}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <PricingRuleModal
        open={modalOpen}
        onClose={closeModal}
        form={form}
        setForm={setForm}
        units={units}
        onSubmit={submitRule}
        isPending={isPending}
      />
    </main>
  );
}

export default PricingRulesClient;
