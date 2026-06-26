"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateReservationPricing,
  type PricingRule,
} from "@/lib/booking/pricing";
import {
  buildReservationUpgradeRows,
  getSelectedAvailableUpgrades,
  normalizeSelectedUpgradeIds,
} from "@/lib/booking/upgrades";
import { checkUnitAvailability } from "@/lib/booking/availability";
import { sendReservationCreatedEmail } from "@/lib/email/reservation-emails";

export async function createReservation(formData: FormData) {
  const unitId = String(formData.get("unit_id") || "");
  const checkIn = String(formData.get("check_in") || "");
  const checkOut = String(formData.get("check_out") || "");
  const guestsCount = Number(formData.get("guests_count") || 1);
  const selectedUpgradeIds = normalizeSelectedUpgradeIds(
    formData.getAll("selected_upgrade_ids")
  );

  const guestName = String(formData.get("guest_name") || "").trim();
  const guestEmail = String(formData.get("guest_email") || "").trim();
  const guestPhone = String(formData.get("guest_phone") || "").trim();
  const guestCountry = String(formData.get("guest_country") || "").trim();
  const internalNotes = String(formData.get("internal_notes") || "").trim();

  if (!unitId || !checkIn || !checkOut) {
    throw new Error("Dados da reserva incompletos.");
  }

  if (!guestName || !guestEmail) {
    throw new Error("Nome e e-mail são obrigatórios.");
  }

  const supabase = createAdminClient();

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select(
      `
      id,
      name,
      slug,
      max_guests,
      base_price,
      cleaning_fee,
      is_active
    `
    )
    .eq("id", unitId)
    .eq("is_active", true)
    .single();

  if (unitError || !unit) {
    throw new Error("Acomodação não encontrada ou inativa.");
  }

  if (guestsCount > Number(unit.max_guests || 1)) {
    throw new Error("Quantidade de hóspedes acima da capacidade.");
  }

  const isAvailable = await checkUnitAvailability({
    unitId,
    checkIn,
    checkOut,
  });

  if (!isAvailable) {
    throw new Error("Acomodação indisponível para o período selecionado.");
  }

  const { data: rules, error: rulesError } = await supabase
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
    .order("priority", { ascending: false });

  if (rulesError) {
    throw new Error(rulesError.message);
  }

  const selectedUpgrades = await getSelectedAvailableUpgrades({
    unitId,
    selectedUpgradeIds,
  });

  const pricing = calculateReservationPricing({
    unitId,
    basePrice: unit.base_price,
    checkIn,
    checkOut,
    rules: (rules || []) as PricingRule[],
    guestsCount,
    selectedUpgradeIds: selectedUpgrades.map((upgrade) => upgrade.id),
    upgrades: selectedUpgrades,
  });

  const cleaningFee = Number(unit.cleaning_fee || 0);
  const total = pricing.total + cleaningFee;

  const { data: existingGuest, error: guestSearchError } = await supabase
    .from("guests")
    .select("id, name, email, phone, country")
    .eq("email", guestEmail)
    .maybeSingle();

  if (guestSearchError) {
    throw new Error(guestSearchError.message);
  }

  let guestId = existingGuest?.id;

  if (existingGuest) {
    await supabase
      .from("guests")
      .update({
        name: guestName,
        phone: guestPhone || existingGuest.phone,
        country: guestCountry || existingGuest.country,
      })
      .eq("id", existingGuest.id);
  }

  if (!guestId) {
    const { data: createdGuest, error: createGuestError } = await supabase
      .from("guests")
      .insert({
        name: guestName,
        email: guestEmail,
        phone: guestPhone || null,
        country: guestCountry || null,
      })
      .select("id")
      .single();

    if (createGuestError || !createdGuest) {
      throw new Error(createGuestError?.message || "Erro ao criar hóspede.");
    }

    guestId = createdGuest.id;
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      guest_id: guestId,
      unit_id: unitId,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guestsCount,
      nights: pricing.nights,
      subtotal: pricing.subtotal,
      cleaning_fee: cleaningFee,
      discount: 0,
      total,
      status: "pending",
      payment_status: "unpaid",
      source: "website",
      internal_notes: internalNotes || null,
    })
    .select("id")
    .single();

  if (reservationError || !reservation) {
    throw new Error(
      reservationError?.message || "Erro ao criar reserva."
    );
  }

  if (pricing.upgradesBreakdown.length > 0) {
    const { error: upgradesError } = await supabase
      .from("reservation_upgrades")
      .insert(
        buildReservationUpgradeRows({
          reservationId: reservation.id,
          upgradesBreakdown: pricing.upgradesBreakdown,
        })
      );

    if (upgradesError) {
      throw new Error("Reserva criada, mas não foi possível salvar os upgrades.");
    }
  }

  try {
    await sendReservationCreatedEmail({
      to: guestEmail,
      guestName,
      unitName: unit.name,
      checkIn,
      checkOut,
      guestsCount,
      nights: pricing.nights,
      total,
      upgradesSummary: pricing.upgradesBreakdown
        .map((upgrade) => `${upgrade.name}: ${upgrade.total}`)
        .join("\n"),
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de reserva criada:", error);
  }

  redirect(`/reserva-confirmada?id=${reservation.id}`);
}
