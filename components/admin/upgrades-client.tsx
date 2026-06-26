"use client";

import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Edit3,
  Loader2,
  Plus,
  Power,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  createUpgradeAction,
  deleteUpgradeAction,
  toggleUpgradeStatusAction,
  updateUpgradeAction,
} from "@/lib/actions/admin/upgrades";
import type { UpgradePricingType } from "@/lib/booking/upgrades";
import type {
  UpgradeItem,
  UpgradeUnitOption,
} from "@/app/admin/upgrades/page";

type UpgradesClientProps = {
  initialUpgrades: UpgradeItem[];
  units: UpgradeUnitOption[];
};

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  pricing_type: UpgradePricingType;
  sort_order: string;
  is_active: boolean;
  applies_to_all_units: boolean;
  unit_ids: string[];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  pricing_type: "per_stay",
  sort_order: "0",
  is_active: true,
  applies_to_all_units: true,
  unit_ids: [],
};

const upgradePricingTypeLabels: Record<UpgradePricingType, string> = {
  per_night: "por noite",
  per_stay: "por reserva",
  per_guest_per_night: "por hóspede/noite",
  per_guest_per_stay: "por hóspede/reserva",
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function getUnitIds(upgrade: UpgradeItem) {
  return (
    upgrade.unit_upgrades
      ?.map((item) => item.unit_id)
      .filter(Boolean) || []
  );
}

function getUnitNames(upgrade: UpgradeItem, units: UpgradeUnitOption[]) {
  const linkedIds = new Set(getUnitIds(upgrade));

  if (linkedIds.size === units.length && units.length > 0) {
    return "Todas as acomodações";
  }

  const names =
    upgrade.unit_upgrades
      ?.map((item) => {
        const unit = Array.isArray(item.units)
          ? item.units[0]
          : item.units;

        return unit?.name;
      })
      .filter(Boolean) || [];

  return names.length > 0 ? names.join(", ") : "Nenhuma acomodação";
}

function buildForm(upgrade: UpgradeItem, units: UpgradeUnitOption[]): FormState {
  const unitIds = getUnitIds(upgrade);

  return {
    id: upgrade.id,
    name: upgrade.name || "",
    slug: upgrade.slug || "",
    description: upgrade.description || "",
    price: String(upgrade.price || ""),
    pricing_type: upgrade.pricing_type || "per_stay",
    sort_order: String(upgrade.sort_order || 0),
    is_active: Boolean(upgrade.is_active),
    applies_to_all_units: unitIds.length === units.length && units.length > 0,
    unit_ids: unitIds,
  };
}

export function UpgradesClient({
  initialUpgrades,
  units,
}: UpgradesClientProps) {
  const router = useRouter();
  const [upgrades, setUpgrades] = useState(initialUpgrades);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeCount = useMemo(
    () => upgrades.filter((upgrade) => upgrade.is_active).length,
    [upgrades]
  );

  useEffect(() => {
    setUpgrades(initialUpgrades);
  }, [initialUpgrades]);

  function updateForm<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setMessage("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
    setError("");
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: Number(form.price || 0),
      pricing_type: form.pricing_type,
      sort_order: Number(form.sort_order || 0),
      is_active: form.is_active,
      applies_to_all_units: form.applies_to_all_units,
      unit_ids: form.unit_ids,
    };

    startTransition(() => {
      void (async () => {
        try {
          if (form.id) {
            await updateUpgradeAction(payload);
            setMessage("Upgrade atualizado.");
          } else {
            await createUpgradeAction(payload);
            setMessage("Upgrade criado.");
          }

          resetForm();
          router.refresh();
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Não foi possível salvar o upgrade."
          );
        }
      })();
    });
  }

  function toggleUnit(unitId: string) {
    updateForm(
      "unit_ids",
      form.unit_ids.includes(unitId)
        ? form.unit_ids.filter((id) => id !== unitId)
        : [...form.unit_ids, unitId]
    );
  }

  function toggleStatus(upgrade: UpgradeItem) {
    startTransition(() => {
      void (async () => {
        try {
          await toggleUpgradeStatusAction(upgrade.id, !upgrade.is_active);
          setUpgrades((current) =>
            current.map((item) =>
              item.id === upgrade.id
                ? { ...item, is_active: !item.is_active }
                : item
            )
          );
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Não foi possível alterar o status."
          );
        }
      })();
    });
  }

  function deleteUpgrade(upgrade: UpgradeItem) {
    if (!window.confirm(`Excluir ${upgrade.name}?`)) return;

    startTransition(() => {
      void (async () => {
        try {
          await deleteUpgradeAction(upgrade.id);
          setUpgrades((current) =>
            current.filter((item) => item.id !== upgrade.id)
          );
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Não foi possível excluir o upgrade."
          );
        }
      })();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--app-shadow-soft)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--app-primary)]">
              Upgrades
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
              {editing ? "Editar extra" : "Novo extra"}
            </h2>
          </div>

          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)]"
              aria-label="Cancelar edição"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <form onSubmit={submitForm} className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Nome
            </span>
            <input
              required
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              placeholder="Café da manhã"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Slug
            </span>
            <input
              value={form.slug}
              onChange={(event) => updateForm("slug", event.target.value)}
              className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              placeholder="cafe-da-manha"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Descrição
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              rows={3}
              className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              placeholder="Detalhes do extra para o hóspede."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                Preço
              </span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                Ordem
              </span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  updateForm("sort_order", event.target.value)
                }
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Tipo de cobrança
            </span>
            <div className="relative">
              <select
                value={form.pricing_type}
                onChange={(event) =>
                  updateForm(
                    "pricing_type",
                    event.target.value as UpgradePricingType
                  )
                }
                className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              >
                {Object.entries(upgradePricingTypeLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-sm font-bold text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                updateForm("is_active", event.target.checked)
              }
              className="h-4 w-4 accent-[var(--app-primary)]"
            />
            Upgrade ativo
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 text-sm font-bold text-[var(--admin-text)]">
            <input
              type="checkbox"
              checked={form.applies_to_all_units}
              onChange={(event) =>
                updateForm("applies_to_all_units", event.target.checked)
              }
              className="h-4 w-4 accent-[var(--app-primary)]"
            />
            Aplicar em todas as acomodações
          </label>

          {!form.applies_to_all_units ? (
            <div className="grid gap-2 rounded-2xl border border-[var(--admin-border)] p-3">
              {units.map((unit) => (
                <label
                  key={unit.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-[var(--admin-text)] hover:bg-[var(--admin-surface-soft)]"
                >
                  <input
                    type="checkbox"
                    checked={form.unit_ids.includes(unit.id)}
                    onChange={() => toggleUnit(unit.id)}
                    className="h-4 w-4 accent-[var(--app-primary)]"
                  />
                  {unit.name}
                </label>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--app-primary-strong)] disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : form.id ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {form.id ? "Salvar upgrade" : "Criar upgrade"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
            <p className="text-sm font-bold text-[var(--admin-muted)]">Total</p>
            <p className="mt-1 text-3xl font-black text-[var(--admin-text)]">
              {upgrades.length}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
            <p className="text-sm font-bold text-[var(--admin-muted)]">Ativos</p>
            <p className="mt-1 text-3xl font-black text-[var(--admin-text)]">
              {activeCount}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
            <p className="text-sm font-bold text-[var(--admin-muted)]">
              Acomodações
            </p>
            <p className="mt-1 text-3xl font-black text-[var(--admin-text)]">
              {units.length}
            </p>
          </div>
        </div>

        {upgrades.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-[var(--app-primary)]" />
            <p className="mt-4 text-lg font-black text-[var(--admin-text)]">
              Nenhum upgrade cadastrado
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upgrades.map((upgrade) => (
              <article
                key={upgrade.id}
                className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--app-shadow-soft)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                        {upgrade.name}
                      </h3>
                      <span className="rounded-full bg-[var(--app-primary-soft)] px-3 py-1 text-xs font-black text-[var(--app-primary)]">
                        {upgradePricingTypeLabels[upgrade.pricing_type]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          upgrade.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {upgrade.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
                      {upgrade.description || "Sem descrição."}
                    </p>

                    <p className="mt-3 text-sm font-bold text-[var(--admin-text)]">
                      {getUnitNames(upgrade, units)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <p className="mr-2 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
                      {formatMoney(upgrade.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(buildForm(upgrade, units));
                        setEditing(true);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
                      aria-label="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(upgrade)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
                      aria-label="Ativar ou desativar"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUpgrade(upgrade)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 text-rose-500 transition hover:bg-rose-50"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
