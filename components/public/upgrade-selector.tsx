"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { PricingResult } from "@/lib/booking/pricing";
import type {
  AvailableUpgrade,
  UpgradePricingType,
} from "@/lib/booking/upgrades";

type UpgradeSelectorProps = {
  unitId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  availableUpgrades: AvailableUpgrade[];
  initialPricing: PricingResult;
  cleaningFee?: number;
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

export function UpgradeSelector({
  unitId,
  checkIn,
  checkOut,
  guestsCount,
  availableUpgrades,
  initialPricing,
  cleaningFee = 0,
}: UpgradeSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pricing, setPricing] = useState<PricingResult>(initialPricing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalWithCleaning = useMemo(
    () => pricing.total + Number(cleaningFee || 0),
    [pricing.total, cleaningFee]
  );

  useEffect(() => {
    let cancelled = false;

    async function quote() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/booking/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            unitId,
            checkIn,
            checkOut,
            guestsCount,
            selectedUpgradeIds: selectedIds,
          }),
        });

        const data = await response.json();

        if (cancelled) return;

        const quoteResult = data?.quotes?.[0];

        if (!response.ok || !data?.ok || !quoteResult?.pricing) {
          setError(data?.message || "Não foi possível recalcular.");
          return;
        }

        setPricing(quoteResult.pricing as PricingResult);
      } catch (caughtError) {
        if (cancelled) return;
        console.error("Erro ao cotar upgrades:", caughtError);
        setError("Não foi possível recalcular.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void quote();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [unitId, checkIn, checkOut, guestsCount, selectedIds]);

  function toggleUpgrade(upgradeId: string) {
    setSelectedIds((current) =>
      current.includes(upgradeId)
        ? current.filter((id) => id !== upgradeId)
        : [...current, upgradeId]
    );
  }

  if (availableUpgrades.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-50 p-5">
      {selectedIds.map((upgradeId) => (
        <input
          key={upgradeId}
          type="hidden"
          name="selected_upgrade_ids"
          value={upgradeId}
        />
      ))}

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b5963] text-white">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-stone-950">
            Adicione à sua estadia
          </h3>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            Selecione extras opcionais para atualizar o valor da reserva.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {availableUpgrades.map((upgrade) => {
          const selected = selectedIds.includes(upgrade.id);

          return (
            <button
              key={upgrade.id}
              type="button"
              onClick={() => toggleUpgrade(upgrade.id)}
              className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-[#0b5963] bg-white shadow-sm"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                  selected
                    ? "border-[#0b5963] bg-[#0b5963] text-white"
                    : "border-stone-300 bg-white text-transparent"
                }`}
              >
                <Check className="h-4 w-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-stone-950">
                  {upgrade.name}
                </span>

                {upgrade.description ? (
                  <span className="mt-1 block text-sm leading-6 text-stone-500">
                    {upgrade.description}
                  </span>
                ) : null}

                <span className="mt-2 block text-sm font-semibold text-[#0b5963]">
                  {formatMoney(upgrade.price)}{" "}
                  {upgradePricingTypeLabels[upgrade.pricing_type]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-stone-500">Hospedagem</span>
          <strong className="text-stone-950">
            {formatMoney(pricing.lodgingSubtotal)}
          </strong>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 text-sm">
          <span className="text-stone-500">Upgrades</span>
          <strong className="text-stone-950">
            {formatMoney(pricing.upgradesSubtotal)}
          </strong>
        </div>

        {pricing.upgradesBreakdown.length > 0 ? (
          <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
            {pricing.upgradesBreakdown.map((upgrade) => (
              <div
                key={upgrade.id}
                className="flex items-center justify-between gap-3 text-xs text-stone-500"
              >
                <span>
                  {upgrade.name} · {formatMoney(upgrade.unit_price)} x{" "}
                  {upgrade.quantity}
                </span>
                <strong className="text-stone-700">
                  {formatMoney(upgrade.total)}
                </strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-stone-200 pt-4">
          <span className="font-semibold text-stone-950">Total final</span>
          <span className="text-2xl font-semibold text-stone-950">
            {formatMoney(totalWithCleaning)}
          </span>
        </div>

        {loading ? (
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-stone-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Recalculando...
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
