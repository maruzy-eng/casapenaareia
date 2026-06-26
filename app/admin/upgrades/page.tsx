import { redirect } from "next/navigation";

import { UpgradesClient } from "@/components/admin/upgrades-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UpgradePricingType } from "@/lib/booking/upgrades";

export type UpgradeUnitOption = {
  id: string;
  name: string;
};

export type UpgradeUnitItem = {
  unit_id: string;
  units:
    | {
        id: string;
        name: string | null;
      }
    | {
        id: string;
        name: string | null;
      }[]
    | null;
};

export type UpgradeItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  pricing_type: UpgradePricingType;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  unit_upgrades: UpgradeUnitItem[] | null;
};

const allowedRoles = ["admin", "administrator", "manager", "editor"];

export default async function AdminUpgradesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?redirect=/admin/upgrades");
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role || "").trim().toLowerCase();

  if (!profile || !allowedRoles.includes(role)) {
    redirect("/admin/login?redirect=/admin/upgrades");
  }

  const [upgradesResult, unitsResult] = await Promise.all([
    adminClient
      .from("upgrades")
      .select(
        `
        id,
        name,
        slug,
        description,
        price,
        pricing_type,
        is_active,
        sort_order,
        created_at,
        updated_at,
        unit_upgrades (
          unit_id,
          units (
            id,
            name
          )
        )
      `
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    adminClient
      .from("units")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (upgradesResult.error) {
    console.error("Erro ao buscar upgrades:", upgradesResult.error);
  }

  if (unitsResult.error) {
    console.error("Erro ao buscar acomodações:", unitsResult.error);
  }

  return (
    <UpgradesClient
      initialUpgrades={(upgradesResult.data || []) as UpgradeItem[]}
      units={(unitsResult.data || []) as UpgradeUnitOption[]}
    />
  );
}
