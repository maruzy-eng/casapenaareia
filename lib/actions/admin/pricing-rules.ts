"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = [
  "admin",
  "administrator",
  "manager",
  "editor",
];

function revalidatePricingPaths() {
  revalidatePath("/admin/tarifas");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/mapa-reservas");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/dashboard");
  revalidatePath("/acomodacoes");
  revalidatePath("/reservar");
}

type PricingRulePayload = {
  id?: string;
  name: string;
  description?: string;
  type: string;
  adjustment_type: string;
  adjustment_value: number;
  starts_at: string;
  ends_at: string;
  weekdays?: number[];
  minimum_nights?: number | null;
  priority: number;
  applies_to_all_units: boolean;
  unit_ids?: string[];
  is_active?: boolean;
};

async function requireAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sessão inválida.");
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Perfil administrativo não encontrado.");
  }

  const normalizedRole = String(profile.role || "")
    .trim()
    .toLowerCase();

  if (!allowedRoles.includes(normalizedRole)) {
    throw new Error("Sem permissão para gerenciar tarifas.");
  }

  return {
    user,
    adminClient,
  };
}

function normalizePayload(payload: PricingRulePayload) {
  const name = String(payload.name || "").trim();

  if (!name) {
    throw new Error("Informe o nome da regra.");
  }

  if (!payload.starts_at || !payload.ends_at) {
    throw new Error("Informe a data inicial e final.");
  }

  const startsAt = new Date(`${payload.starts_at}T00:00:00`);
  const endsAt = new Date(`${payload.ends_at}T00:00:00`);

  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime())
  ) {
    throw new Error("Datas inválidas.");
  }

  if (endsAt < startsAt) {
    throw new Error("A data final precisa ser maior ou igual à inicial.");
  }

  const adjustmentValue = Number(payload.adjustment_value || 0);

  if (adjustmentValue < 0) {
    throw new Error("O ajuste não pode ser negativo.");
  }

  const priority = Number(payload.priority || 1);

  const minimumNights =
    payload.minimum_nights === null ||
    payload.minimum_nights === undefined ||
    Number(payload.minimum_nights) <= 0
      ? null
      : Number(payload.minimum_nights);

  const appliesToAllUnits = Boolean(payload.applies_to_all_units);

  const unitIds = Array.isArray(payload.unit_ids)
    ? payload.unit_ids.filter(Boolean)
    : [];

  if (!appliesToAllUnits && unitIds.length === 0) {
    throw new Error(
      "Selecione pelo menos uma acomodação ou aplique em todas."
    );
  }

  return {
    name,
    description: String(payload.description || "").trim() || null,
    type: payload.type || "season",
    adjustment_type:
      payload.adjustment_type || "percentage_increase",
    adjustment_value: adjustmentValue,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
    weekdays:
      Array.isArray(payload.weekdays) &&
      payload.weekdays.length > 0
        ? payload.weekdays
        : null,
    minimum_nights: minimumNights,
    priority,
    applies_to_all_units: appliesToAllUnits,
    is_active:
      typeof payload.is_active === "boolean"
        ? payload.is_active
        : true,
    unit_ids: unitIds,
  };
}

export async function createPricingRuleAction(
  payload: PricingRulePayload
) {
  const { adminClient } = await requireAdminAccess();
  const data = normalizePayload(payload);

  const { data: createdRule, error } = await adminClient
    .from("pricing_rules")
    .insert({
      name: data.name,
      description: data.description,
      type: data.type,
      adjustment_type: data.adjustment_type,
      adjustment_value: data.adjustment_value,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      weekdays: data.weekdays,
      minimum_nights: data.minimum_nights,
      priority: data.priority,
      applies_to_all_units: data.applies_to_all_units,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !createdRule) {
    console.error("Erro ao criar regra de tarifa:", error);
    throw new Error("Não foi possível criar a regra de tarifa.");
  }

  if (!data.applies_to_all_units && data.unit_ids.length > 0) {
    const rows = data.unit_ids.map((unitId) => ({
      pricing_rule_id: createdRule.id,
      unit_id: unitId,
    }));

    const { error: unitsError } = await adminClient
      .from("pricing_rule_units")
      .insert(rows);

    if (unitsError) {
      console.error(
        "Erro ao vincular acomodações à regra:",
        unitsError
      );

      throw new Error(
        "Regra criada, mas não foi possível vincular as acomodações."
      );
    }
  }

  revalidatePricingPaths();

  return {
    ok: true,
  };
}

export async function updatePricingRuleAction(
  payload: PricingRulePayload
) {
  const { adminClient } = await requireAdminAccess();

  if (!payload.id) {
    throw new Error("Regra inválida.");
  }

  const data = normalizePayload(payload);

  const { error } = await adminClient
    .from("pricing_rules")
    .update({
      name: data.name,
      description: data.description,
      type: data.type,
      adjustment_type: data.adjustment_type,
      adjustment_value: data.adjustment_value,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      weekdays: data.weekdays,
      minimum_nights: data.minimum_nights,
      priority: data.priority,
      applies_to_all_units: data.applies_to_all_units,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id);

  if (error) {
    console.error("Erro ao atualizar regra de tarifa:", error);
    throw new Error("Não foi possível atualizar a regra de tarifa.");
  }

  const { error: deleteUnitsError } = await adminClient
    .from("pricing_rule_units")
    .delete()
    .eq("pricing_rule_id", payload.id);

  if (deleteUnitsError) {
    console.error(
      "Erro ao limpar acomodações da regra:",
      deleteUnitsError
    );

    throw new Error(
      "Não foi possível atualizar as acomodações da regra."
    );
  }

  if (!data.applies_to_all_units && data.unit_ids.length > 0) {
    const rows = data.unit_ids.map((unitId) => ({
      pricing_rule_id: payload.id,
      unit_id: unitId,
    }));

    const { error: insertUnitsError } = await adminClient
      .from("pricing_rule_units")
      .insert(rows);

    if (insertUnitsError) {
      console.error(
        "Erro ao inserir acomodações da regra:",
        insertUnitsError
      );

      throw new Error(
        "Não foi possível vincular as acomodações da regra."
      );
    }
  }

  revalidatePricingPaths();

  return {
    ok: true,
  };
}

export async function togglePricingRuleStatusAction(
  ruleId: string,
  isActive: boolean
) {
  const { adminClient } = await requireAdminAccess();

  const { error } = await adminClient
    .from("pricing_rules")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId);

  if (error) {
    console.error("Erro ao alterar status da regra:", error);
    throw new Error("Não foi possível alterar o status da regra.");
  }

  revalidatePricingPaths();

  return {
    ok: true,
  };
}

export async function deletePricingRuleAction(ruleId: string) {
  const { adminClient } = await requireAdminAccess();

  const { error } = await adminClient
    .from("pricing_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    console.error("Erro ao excluir regra de tarifa:", error);
    throw new Error("Não foi possível excluir a regra de tarifa.");
  }

  revalidatePricingPaths();

  return {
    ok: true,
  };
}
