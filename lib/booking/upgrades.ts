import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  type ReservationUpgradeBreakdown,
  type ReservationUpgradeInput,
} from "@/lib/booking/pricing";

export type UpgradePricingType =
  | "per_night"
  | "per_stay"
  | "per_guest_per_night"
  | "per_guest_per_stay";

export type AvailableUpgrade = ReservationUpgradeInput & {
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

type UnitUpgradeRow = {
  upgrade_id: string;
  upgrades:
    | {
        id: string;
        name: string | null;
        slug: string | null;
        description: string | null;
        price: number | string | null;
        pricing_type: string | null;
        is_active: boolean | null;
        sort_order: number | string | null;
      }
    | {
        id: string;
        name: string | null;
        slug: string | null;
        description: string | null;
        price: number | string | null;
        pricing_type: string | null;
        is_active: boolean | null;
        sort_order: number | string | null;
      }[]
    | null;
};

export const upgradePricingTypeLabels: Record<UpgradePricingType, string> = {
  per_night: "por noite",
  per_stay: "por reserva",
  per_guest_per_night: "por hóspede/noite",
  per_guest_per_stay: "por hóspede/reserva",
};

export function normalizeSelectedUpgradeIds(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isUpgradePricingType(value: string): value is UpgradePricingType {
  return [
    "per_night",
    "per_stay",
    "per_guest_per_night",
    "per_guest_per_stay",
  ].includes(value);
}

function normalizeUpgrade(row: UnitUpgradeRow): AvailableUpgrade | null {
  const upgrade = Array.isArray(row.upgrades)
    ? row.upgrades[0]
    : row.upgrades;

  if (!upgrade || !upgrade.id || !upgrade.name || !upgrade.is_active) {
    return null;
  }

  const pricingType = String(upgrade.pricing_type || "");

  if (!isUpgradePricingType(pricingType)) {
    return null;
  }

  return {
    id: upgrade.id,
    name: upgrade.name,
    slug: upgrade.slug || upgrade.id,
    description: upgrade.description,
    price: Number(upgrade.price || 0),
    pricing_type: pricingType,
    is_active: Boolean(upgrade.is_active),
    sort_order: Number(upgrade.sort_order || 0),
  };
}

export async function getAvailableUpgradesForUnit(unitId: string) {
  if (!unitId) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("unit_upgrades")
    .select(
      `
      upgrade_id,
      upgrades (
        id,
        name,
        slug,
        description,
        price,
        pricing_type,
        is_active,
        sort_order
      )
    `
    )
    .eq("unit_id", unitId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as UnitUpgradeRow[])
    .map(normalizeUpgrade)
    .filter(Boolean)
    .sort((first, second) => {
      if (first!.sort_order !== second!.sort_order) {
        return first!.sort_order - second!.sort_order;
      }

      return first!.name.localeCompare(second!.name);
    }) as AvailableUpgrade[];
}

export async function getSelectedAvailableUpgrades({
  unitId,
  selectedUpgradeIds,
}: {
  unitId: string;
  selectedUpgradeIds: string[];
}) {
  const availableUpgrades = await getAvailableUpgradesForUnit(unitId);
  const selectedSet = new Set(selectedUpgradeIds);

  return availableUpgrades.filter((upgrade) =>
    selectedSet.has(upgrade.id)
  );
}

export function buildReservationUpgradeRows({
  reservationId,
  upgradesBreakdown,
}: {
  reservationId: string;
  upgradesBreakdown: ReservationUpgradeBreakdown[];
}) {
  return upgradesBreakdown.map((upgrade) => ({
    reservation_id: reservationId,
    upgrade_id: upgrade.id,
    name: upgrade.name,
    pricing_type: upgrade.pricing_type,
    unit_price: upgrade.unit_price,
    quantity: upgrade.quantity,
    total: upgrade.total,
  }));
}
