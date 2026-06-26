import { NextResponse } from "next/server";

import { calculateReservationPricing } from "@/lib/booking/pricing";
import {
  getAvailableUpgradesForUnit,
  normalizeSelectedUpgradeIds,
} from "@/lib/booking/upgrades";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type QuotePayload = {
  unitId?: string;
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
  selectedUpgradeIds?: string[];
};

const allowedRoles = ["admin", "administrator", "manager", "editor"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sessão inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const payload = (await request.json()) as QuotePayload;

    const unitId = String(payload.unitId || "").trim();
    const checkIn = String(payload.checkIn || "").trim();
    const checkOut = String(payload.checkOut || "").trim();
    const guestsCount = Number(payload.guestsCount || 1);
    const selectedUpgradeIds = normalizeSelectedUpgradeIds(
      payload.selectedUpgradeIds
    );

    if (!unitId || !checkIn || !checkOut) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe acomodação, check-in e check-out.",
        },
        {
          status: 400,
        }
      );
    }

    const adminClient = createAdminClient();

    const { data: profile, error: profileError } =
      await adminClient
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          ok: false,
          message: "Perfil administrativo não encontrado.",
        },
        {
          status: 403,
        }
      );
    }

    const role = String(profile.role || "").trim().toLowerCase();

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sem permissão para cotar tarifas.",
        },
        {
          status: 403,
        }
      );
    }

    const { data: unit, error: unitError } = await adminClient
      .from("units")
      .select("id, name, base_price, max_guests")
      .eq("id", unitId)
      .maybeSingle();

    if (unitError || !unit) {
      return NextResponse.json(
        {
          ok: false,
          message: "Acomodação não encontrada.",
        },
        {
          status: 404,
        }
      );
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
          pricing_rule_units (
            unit_id
          )
        `
        )
        .eq("is_active", true)
        .lte("starts_at", checkOut)
        .gte("ends_at", checkIn)
        .order("priority", {
          ascending: false,
        });

    if (rulesError) {
      console.error("Erro ao buscar regras de preço:", rulesError);

      return NextResponse.json(
        {
          ok: false,
          message: "Não foi possível buscar as regras de preço.",
        },
        {
          status: 500,
        }
      );
    }

    const availableUpgrades = await getAvailableUpgradesForUnit(unit.id);
    const selectedAvailableUpgrades = availableUpgrades.filter((upgrade) =>
      selectedUpgradeIds.includes(upgrade.id)
    );

    const pricing = calculateReservationPricing({
      selectedUpgradeIds,
      upgrades: selectedAvailableUpgrades,
      unitId: unit.id,
      basePrice: unit.base_price,
      checkIn,
      checkOut,
      rules: rules || [],
      guestsCount,
    });

    return NextResponse.json({
      ok: true,
      unit,
      availableUpgrades,
      pricing,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível calcular a tarifa.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      {
        status: 400,
      }
    );
  }
}
