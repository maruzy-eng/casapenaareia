"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UpgradePricingType } from "@/lib/booking/upgrades";

const allowedRoles = [
  "admin",
  "administrator",
  "manager",
  "editor",
];

export type UpgradePayload = {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  pricing_type: UpgradePricingType;
  sort_order: number;
  is_active: boolean;
  applies_to_all_units: boolean;
  unit_ids?: string[];
};

function revalidateUpgradePaths() {
  revalidatePath("/admin/upgrades");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/acomodacoes");
  revalidatePath("/reservar");
}

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
    throw new Error("Sem permissão para gerenciar upgrades.");
  }

  return {
    adminClient,
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizePayload(payload: UpgradePayload) {
  const name = String(payload.name || "").trim();
  const price = Number(payload.price || 0);
  const sortOrder = Number(payload.sort_order || 0);
  const pricingType = String(payload.pricing_type || "per_stay");
  const allowedPricingTypes = [
    "per_night",
    "per_stay",
    "per_guest_per_night",
    "per_guest_per_stay",
  ];
  const appliesToAllUnits = Boolean(payload.applies_to_all_units);
  const unitIds = Array.isArray(payload.unit_ids)
    ? payload.unit_ids.filter(Boolean)
    : [];

  if (!name) {
    throw new Error("Informe o nome do upgrade.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Informe um preço válido.");
  }

  if (!allowedPricingTypes.includes(pricingType)) {
    throw new Error("Tipo de cobrança inválido.");
  }

  if (!appliesToAllUnits && unitIds.length === 0) {
    throw new Error(
      "Selecione pelo menos uma acomodação ou aplique em todas."
    );
  }

  return {
    name,
    slug: slugify(payload.slug || name),
    description: String(payload.description || "").trim() || null,
    price,
    pricing_type: pricingType as UpgradePricingType,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: Boolean(payload.is_active),
    applies_to_all_units: appliesToAllUnits,
    unit_ids: unitIds,
  };
}

async function getAllUnitIds(adminClient: ReturnType<typeof createAdminClient>) {
  const { data, error } = await adminClient
    .from("units")
    .select("id")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as acomodações.");
  }

  return (data || []).map((unit) => String(unit.id));
}

async function replaceUpgradeUnits({
  adminClient,
  upgradeId,
  appliesToAllUnits,
  unitIds,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
  upgradeId: string;
  appliesToAllUnits: boolean;
  unitIds: string[];
}) {
  const { error: deleteError } = await adminClient
    .from("unit_upgrades")
    .delete()
    .eq("upgrade_id", upgradeId);

  if (deleteError) {
    throw new Error("Não foi possível atualizar as acomodações.");
  }

  const selectedUnitIds = appliesToAllUnits
    ? await getAllUnitIds(adminClient)
    : unitIds;

  if (selectedUnitIds.length === 0) return;

  const { error: insertError } = await adminClient
    .from("unit_upgrades")
    .insert(
      selectedUnitIds.map((unitId) => ({
        unit_id: unitId,
        upgrade_id: upgradeId,
        is_active: true,
      }))
    );

  if (insertError) {
    throw new Error("Não foi possível vincular o upgrade às acomodações.");
  }
}

export async function createUpgradeAction(payload: UpgradePayload) {
  const { adminClient } = await requireAdminAccess();
  const data = normalizePayload(payload);

  const { data: createdUpgrade, error } = await adminClient
    .from("upgrades")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      pricing_type: data.pricing_type,
      is_active: data.is_active,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !createdUpgrade) {
    console.error("Erro ao criar upgrade:", error);
    throw new Error("Não foi possível criar o upgrade.");
  }

  await replaceUpgradeUnits({
    adminClient,
    upgradeId: createdUpgrade.id,
    appliesToAllUnits: data.applies_to_all_units,
    unitIds: data.unit_ids,
  });

  revalidateUpgradePaths();

  return { ok: true };
}

export async function updateUpgradeAction(payload: UpgradePayload) {
  const { adminClient } = await requireAdminAccess();

  if (!payload.id) {
    throw new Error("Upgrade inválido.");
  }

  const data = normalizePayload(payload);

  const { error } = await adminClient
    .from("upgrades")
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      pricing_type: data.pricing_type,
      is_active: data.is_active,
      sort_order: data.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id);

  if (error) {
    console.error("Erro ao atualizar upgrade:", error);
    throw new Error("Não foi possível atualizar o upgrade.");
  }

  await replaceUpgradeUnits({
    adminClient,
    upgradeId: payload.id,
    appliesToAllUnits: data.applies_to_all_units,
    unitIds: data.unit_ids,
  });

  revalidateUpgradePaths();

  return { ok: true };
}

export async function toggleUpgradeStatusAction(
  upgradeId: string,
  isActive: boolean
) {
  const { adminClient } = await requireAdminAccess();

  const { error } = await adminClient
    .from("upgrades")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", upgradeId);

  if (error) {
    throw new Error("Não foi possível alterar o status do upgrade.");
  }

  revalidateUpgradePaths();

  return { ok: true };
}

export async function deleteUpgradeAction(upgradeId: string) {
  const { adminClient } = await requireAdminAccess();

  const { error } = await adminClient
    .from("upgrades")
    .delete()
    .eq("id", upgradeId);

  if (error) {
    throw new Error("Não foi possível excluir o upgrade.");
  }

  revalidateUpgradePaths();

  return { ok: true };
}
