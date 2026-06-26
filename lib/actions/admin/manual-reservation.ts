"use server";

import { revalidatePath } from "next/cache";

import { calculateReservationPricing } from "@/lib/booking/pricing";
import { checkUnitAvailability } from "@/lib/booking/availability";
import {
  buildReservationUpgradeRows,
  getSelectedAvailableUpgrades,
  normalizeSelectedUpgradeIds,
} from "@/lib/booking/upgrades";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = [
  "admin",
  "administrator",
  "manager",
  "editor",
];

export type ManualReservationPayload = {
  unit_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_country?: string;
  guests_count: number;
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  notes?: string;
  selected_upgrade_ids?: string[];
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
    throw new Error("Sem permissão para criar reservas.");
  }

  return {
    user,
    adminClient,
  };
}

function normalizeText(value: string | undefined | null) {
  return String(value || "").trim();
}

function normalizeEmail(value: string | undefined | null) {
  return String(value || "").trim().toLowerCase();
}

function validatePayload(payload: ManualReservationPayload) {
  const unitId = normalizeText(payload.unit_id);
  const guestName = normalizeText(payload.guest_name);
  const guestEmail = normalizeEmail(payload.guest_email);
  const guestPhone = normalizeText(payload.guest_phone);
  const guestCountry = normalizeText(payload.guest_country);
  const checkIn = normalizeText(payload.check_in);
  const checkOut = normalizeText(payload.check_out);
  const guestsCount = Number(payload.guests_count || 1);
  const selectedUpgradeIds = normalizeSelectedUpgradeIds(
    payload.selected_upgrade_ids
  );

  if (!unitId) {
    throw new Error("Selecione uma acomodação.");
  }

  if (!guestName) {
    throw new Error("Informe o nome do hóspede.");
  }

  if (!guestEmail) {
    throw new Error("Informe o e-mail do hóspede.");
  }

  if (!checkIn || !checkOut) {
    throw new Error("Informe check-in e check-out.");
  }

  if (!Number.isFinite(guestsCount) || guestsCount <= 0) {
    throw new Error("Informe uma quantidade válida de hóspedes.");
  }

  return {
    unit_id: unitId,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone || null,
    guest_country: guestCountry || null,
    guests_count: guestsCount,
    check_in: checkIn,
    check_out: checkOut,
    status: normalizeText(payload.status) || "confirmed",
    payment_status:
      normalizeText(payload.payment_status) || "pending",
    notes: normalizeText(payload.notes) || null,
    selected_upgrade_ids: selectedUpgradeIds,
  };
}

async function findOrCreateGuest({
  adminClient,
  name,
  email,
  phone,
  country,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
}) {
  const { data: existingGuest, error: findError } =
    await adminClient
      .from("guests")
      .select("id")
      .eq("email", email)
      .maybeSingle();

  if (findError) {
    console.error("Erro ao buscar hóspede:", findError);
    throw new Error("Não foi possível buscar o hóspede.");
  }

  if (existingGuest?.id) {
    const { error: updateError } = await adminClient
      .from("guests")
      .update({
        name,
        phone,
        country,
      })
      .eq("id", existingGuest.id);

    if (updateError) {
      console.warn(
        "Não foi possível atualizar os dados do hóspede:",
        updateError
      );
    }

    return existingGuest.id as string;
  }

  const { data: createdGuest, error: createError } =
    await adminClient
      .from("guests")
      .insert({
        name,
        email,
        phone,
        country,
      })
      .select("id")
      .single();

  if (createError || !createdGuest) {
    console.error("Erro ao criar hóspede:", createError);
    throw new Error("Não foi possível criar o hóspede.");
  }

  return createdGuest.id as string;
}

export async function createManualReservationAction(
  payload: ManualReservationPayload
) {
  const { adminClient } = await requireAdminAccess();

  const data = validatePayload(payload);

  const { data: unit, error: unitError } = await adminClient
    .from("units")
    .select("id, name, base_price, max_guests")
    .eq("id", data.unit_id)
    .maybeSingle();

  if (unitError || !unit) {
    console.error("Erro ao buscar acomodação:", unitError);
    throw new Error("Acomodação não encontrada.");
  }

  const maxGuests = Number(unit.max_guests || 0);

  if (maxGuests > 0 && data.guests_count > maxGuests) {
    throw new Error(
      `Essa acomodação aceita no máximo ${maxGuests} hóspede(s).`
    );
  }

  const isAvailable = await checkUnitAvailability({
    unitId: data.unit_id,
    checkIn: data.check_in,
    checkOut: data.check_out,
  });

  if (!isAvailable) {
    throw new Error("Acomodação indisponível para o período selecionado.");
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
      .lte("starts_at", data.check_out)
      .gte("ends_at", data.check_in)
      .order("priority", {
        ascending: false,
      });

  if (rulesError) {
    console.error("Erro ao buscar regras de preço:", rulesError);
    throw new Error("Não foi possível buscar as regras de preço.");
  }

  const selectedUpgrades = await getSelectedAvailableUpgrades({
    unitId: data.unit_id,
    selectedUpgradeIds: data.selected_upgrade_ids,
  });

  const pricing = calculateReservationPricing({
    unitId: unit.id,
    basePrice: unit.base_price,
    checkIn: data.check_in,
    checkOut: data.check_out,
    rules: rules || [],
    guestsCount: data.guests_count,
    selectedUpgradeIds: selectedUpgrades.map((upgrade) => upgrade.id),
    upgrades: selectedUpgrades,
  });

  const guestId = await findOrCreateGuest({
    adminClient,
    name: data.guest_name,
    email: data.guest_email,
    phone: data.guest_phone,
    country: data.guest_country,
  });

  const { data: createdReservation, error: reservationError } =
    await adminClient
      .from("reservations")
      .insert({
        unit_id: data.unit_id,
        guest_id: guestId,
        check_in: data.check_in,
        check_out: data.check_out,
        guests_count: data.guests_count,
        nights: pricing.nights,
        total: pricing.total,
        status: data.status,
        payment_status: data.payment_status,
        source: "manual",
        notes: data.notes,
      })
      .select("id")
      .single();

  if (reservationError || !createdReservation) {
    console.error("Erro ao criar reserva:", reservationError);
    throw new Error("Não foi possível criar a reserva.");
  }

  if (pricing.upgradesBreakdown.length > 0) {
    const { error: upgradesError } = await adminClient
      .from("reservation_upgrades")
      .insert(
        buildReservationUpgradeRows({
          reservationId: createdReservation.id,
          upgradesBreakdown: pricing.upgradesBreakdown,
        })
      );

    if (upgradesError) {
      console.error("Erro ao salvar upgrades da reserva:", upgradesError);
      throw new Error("Reserva criada, mas não foi possível salvar os upgrades.");
    }
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/calendario");
  revalidatePath("/admin/mapa-reservas");
  revalidatePath("/admin/financeiro");

  return {
    ok: true,
    reservationId: createdReservation.id as string,
    pricing,
  };
}
