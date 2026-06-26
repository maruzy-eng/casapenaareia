import { redirect } from "next/navigation";

import { PricingRulesClient } from "@/components/admin/pricing-rules-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PricingUnitOption = {
  id: string;
  name: string;
};

export type PricingRuleUnitItem = {
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

export type PricingRuleItem = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  adjustment_type: string;
  adjustment_value: number | string;
  starts_at: string;
  ends_at: string;
  weekdays: number[] | null;
  minimum_nights: number | null;
  priority: number;
  applies_to_all_units: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  pricing_rule_units: PricingRuleUnitItem[] | null;
};

const allowedRoles = ["admin", "administrator", "manager", "editor"];

export default async function AdminPricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?redirect=/admin/tarifas");
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role || "").trim().toLowerCase();

  if (!profile || !allowedRoles.includes(role)) {
    redirect("/admin/login?redirect=/admin/tarifas");
  }

  const { data: rules, error: rulesError } =
    await adminClient
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
        is_active,
        created_at,
        updated_at,
        pricing_rule_units (
          unit_id,
          units (
            id,
            name
          )
        )
      `
      )
      .order("priority", {
        ascending: false,
      })
      .order("starts_at", {
        ascending: true,
      });

  if (rulesError) {
    console.error("Erro ao buscar regras de tarifa:", rulesError);
  }

  const { data: units, error: unitsError } =
    await adminClient
      .from("units")
      .select("id, name")
      .order("name", {
        ascending: true,
      });

  if (unitsError) {
    console.error("Erro ao buscar acomodações:", unitsError);
  }

  return (
    <PricingRulesClient
      initialRules={(rules || []) as PricingRuleItem[]}
      units={(units || []) as PricingUnitOption[]}
    />
  );
}
