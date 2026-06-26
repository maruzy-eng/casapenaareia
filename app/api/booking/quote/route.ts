import { NextResponse } from "next/server";

import {
  calculateReservationPricing,
  type PricingResult,
  type PricingRule,
} from "@/lib/booking/pricing";
import {
  getAvailableUpgradesForUnit,
  normalizeSelectedUpgradeIds,
} from "@/lib/booking/upgrades";
import { getUnavailableUnitIds } from "@/lib/booking/availability";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BookingQuotePayload = {
  unitId?: string;
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
  selectedUpgradeIds?: string[];
};

type QuoteUnit = {
  id: string;
  name: string | null;
  base_price: number | string | null;
  max_guests: number | string | null;
};

type BookingQuote = {
  unit: {
    id: string;
    name: string;
    base_price: number;
    max_guests: number;
  };
  available: boolean;
  pricing: PricingResult | null;
  availableUpgrades?: Awaited<ReturnType<typeof getAvailableUpgradesForUnit>>;
  message?: string;
};

function isValidYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizePayload(payload: BookingQuotePayload) {
  const unitId = String(payload.unitId || "").trim();
  const checkIn = String(payload.checkIn || "").trim();
  const checkOut = String(payload.checkOut || "").trim();
  const guestsCount = Number(payload.guestsCount || 1);
  const selectedUpgradeIds = normalizeSelectedUpgradeIds(
    payload.selectedUpgradeIds
  );

  if (!isValidYmd(checkIn) || !isValidYmd(checkOut) || checkOut <= checkIn) {
    throw new Error("Informe check-in e check-out válidos.");
  }

  if (!Number.isFinite(guestsCount) || guestsCount <= 0) {
    throw new Error("Informe uma quantidade válida de hóspedes.");
  }

  return {
    unitId,
    checkIn,
    checkOut,
    guestsCount,
    selectedUpgradeIds,
  };
}

export async function POST(request: Request) {
  try {
    const payload = normalizePayload((await request.json()) as BookingQuotePayload);
    const supabase = createAdminClient();

    let unitsQuery = supabase
      .from("units")
      .select("id, name, base_price, max_guests")
      .eq("is_active", true)
      .gte("max_guests", payload.guestsCount)
      .order("name", { ascending: true });

    if (payload.unitId) {
      unitsQuery = unitsQuery.eq("id", payload.unitId);
    }

    const [unitsResult, rulesResult, unavailableUnitIds] = await Promise.all([
      unitsQuery,
      supabase
        .from("pricing_rules")
        .select(
          `
          id,
          name,
          description,
          type,
          adjustment_type,
          adjustment_value,
          starts_at,
          ends_at,
          weekdays,
          minimum_nights,
          priority,
          applies_to_all_units,
          pricing_rule_units (
            unit_id
          )
        `
        )
        .eq("is_active", true)
        .lte("starts_at", payload.checkOut)
        .gte("ends_at", payload.checkIn)
        .order("priority", { ascending: false }),
      getUnavailableUnitIds({
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
      }),
    ]);

    if (unitsResult.error) {
      throw new Error(unitsResult.error.message);
    }

    if (rulesResult.error) {
      throw new Error(rulesResult.error.message);
    }

    const unavailableSet = new Set(unavailableUnitIds);
    const rules = (rulesResult.data || []) as PricingRule[];
    const units = (unitsResult.data || []) as QuoteUnit[];

    const quotes: BookingQuote[] = await Promise.all(units.map(async (unit) => {
      const normalizedUnit = {
        id: unit.id,
        name: unit.name || "Acomodação",
        base_price: Number(unit.base_price || 0),
        max_guests: Number(unit.max_guests || 0),
      };

      if (unavailableSet.has(unit.id)) {
        return {
          unit: normalizedUnit,
          available: false,
          pricing: null,
          message: "Acomodação indisponível no período selecionado.",
        };
      }

      try {
        const availableUpgrades = await getAvailableUpgradesForUnit(unit.id);
        const selectedAvailableUpgrades = availableUpgrades.filter((upgrade) =>
          payload.selectedUpgradeIds.includes(upgrade.id)
        );

        return {
          unit: normalizedUnit,
          available: true,
          availableUpgrades,
          pricing: calculateReservationPricing({
            unitId: unit.id,
            basePrice: unit.base_price,
            checkIn: payload.checkIn,
            checkOut: payload.checkOut,
            rules,
            guestsCount: payload.guestsCount,
            selectedUpgradeIds: selectedAvailableUpgrades.map(
              (upgrade) => upgrade.id
            ),
            upgrades: selectedAvailableUpgrades,
          }),
        };
      } catch (error) {
        return {
          unit: normalizedUnit,
          available: false,
          pricing: null,
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível calcular a tarifa.",
        };
      }
    }));

    return NextResponse.json({
      ok: true,
      quotes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível calcular a cotação.";

    return NextResponse.json(
      {
        ok: false,
        message,
        quotes: [],
      },
      {
        status: 400,
      }
    );
  }
}
