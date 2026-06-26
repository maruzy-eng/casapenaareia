import Link from "next/link";
import { ArrowLeft, CalendarDays, Users, WalletCards } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateReservationPricing,
  type PricingRule,
} from "@/lib/booking/pricing";
import { checkUnitAvailability } from "@/lib/booking/availability";
import { createReservation } from "@/lib/actions/reservations";
import { UpgradeSelector } from "@/components/public/upgrade-selector";
import { getAvailableUpgradesForUnit } from "@/lib/booking/upgrades";

type ReservationPageProps = {
  searchParams: Promise<{
    unit?: string;
    check_in?: string;
    check_out?: string;
    guests?: string;
  }>;
};

function formatMoney(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function formatDateLabel(value: string) {
  if (!value) {
    return "data não informada";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function hasValidDateRange(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return false;
  }

  return checkOut > checkIn;
}

export default async function ReservationPage({
  searchParams,
}: ReservationPageProps) {
  const params = await searchParams;

  const unitSlug = params.unit || "";
  const checkIn = params.check_in || "";
  const checkOut = params.check_out || "";
  const guests = Number(params.guests || 1);

  const hasValidDates = hasValidDateRange(checkIn, checkOut);

  if (!unitSlug) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10">
        <section className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para busca
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-2xl font-semibold text-red-900">
              Acomodação não informada
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Volte para a busca e selecione uma acomodação para continuar.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!hasValidDates) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10">
        <section className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para busca
          </Link>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-semibold text-amber-950">
              Datas inválidas
            </h1>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Para reservar, informe uma data de check-in e uma data de
              check-out válida.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-amber-950 px-6 text-sm font-medium text-white transition hover:bg-amber-900"
            >
              Fazer nova busca
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const supabase = createAdminClient();

  const { data: unit, error } = await supabase
    .from("units")
    .select(
      `
      id,
      name,
      slug,
      description,
      max_guests,
      bedrooms,
      bathrooms,
      base_price,
      cleaning_fee,
      cover_image,
      amenities,
      is_active
    `
    )
    .eq("slug", unitSlug)
    .eq("is_active", true)
    .single();

  if (error || !unit) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10">
        <section className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para busca
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-2xl font-semibold text-red-900">
              Acomodação não encontrada
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Esta acomodação não existe ou não está disponível para reserva.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (guests > Number(unit.max_guests || 1)) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10">
        <section className="mx-auto max-w-4xl">
          <Link
            href={`/acomodacoes?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para acomodações
          </Link>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-semibold text-amber-950">
              Capacidade excedida
            </h1>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Esta acomodação comporta até {unit.max_guests} hóspede
              {Number(unit.max_guests || 1) > 1 ? "s" : ""}. Altere a busca
              para continuar.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const isAvailable = await checkUnitAvailability({
    unitId: unit.id,
    checkIn,
    checkOut,
  });

  if (!isAvailable) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10">
        <section className="mx-auto max-w-4xl">
          <Link
            href={`/acomodacoes?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para acomodações
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-2xl font-semibold text-red-900">
              Acomodação indisponível
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Esta acomodação já possui uma reserva ou bloqueio entre{" "}
              <strong>{formatDateLabel(checkIn)}</strong> e{" "}
              <strong>{formatDateLabel(checkOut)}</strong>.
            </p>

            <Link
              href={`/acomodacoes?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-red-900 px-6 text-sm font-medium text-white transition hover:bg-red-800"
            >
              Ver outras acomodações
            </Link>
          </div>
        </section>
      </main>
    );
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

  let pricing;

  try {
    pricing = calculateReservationPricing({
      unitId: unit.id,
      basePrice: unit.base_price,
      checkIn,
      checkOut,
      rules: (rules || []) as PricingRule[],
    });
  } catch (pricingError) {
    const message =
      pricingError instanceof Error
        ? pricingError.message
        : "Não foi possível calcular a tarifa.";

    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10">
        <section className="mx-auto max-w-4xl">
          <Link
            href={`/acomodacoes?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para acomodações
          </Link>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-semibold text-amber-950">
              Tarifa indisponível
            </h1>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              {message}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const cleaningFee = Number(unit.cleaning_fee || 0);
  const total = pricing.total + cleaningFee;
  const availableUpgrades = await getAvailableUpgradesForUnit(unit.id);

  const averageNightlyRate =
    pricing.nights > 0 ? pricing.subtotal / pricing.nights : 0;

  const appliedRuleNames = pricing.appliedRulesSummary.map((rule) => rule.name);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/acomodacoes?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
            className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para acomodações
          </Link>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 md:text-4xl">
            Finalizar reserva
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Preencha seus dados para criar a reserva pendente.
          </p>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <form
          action={createReservation}
          className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8"
        >
          <input type="hidden" name="unit_id" value={unit.id} />
          <input type="hidden" name="check_in" value={checkIn} />
          <input type="hidden" name="check_out" value={checkOut} />
          <input type="hidden" name="guests_count" value={guests} />

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-500">
              Dados do hóspede
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              Quem vai se hospedar?
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Após enviar, a reserva será criada como pendente. Depois podemos
              conectar pagamento, e-mail automático e confirmação.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Nome completo *
              </span>

              <input
                name="guest_name"
                required
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="Seu nome"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                E-mail *
              </span>

              <input
                name="guest_email"
                type="email"
                required
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="voce@email.com"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Telefone / WhatsApp
              </span>

              <input
                name="guest_phone"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="+55..."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                País
              </span>

              <input
                name="guest_country"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="Brasil"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Observações
            </span>

            <textarea
              name="internal_notes"
              rows={5}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400"
              placeholder="Alguma observação importante?"
            />
          </label>

          <UpgradeSelector
            unitId={unit.id}
            checkIn={checkIn}
            checkOut={checkOut}
            guestsCount={guests}
            availableUpgrades={availableUpgrades}
            initialPricing={pricing}
            cleaningFee={cleaningFee}
          />

          <button
            type="submit"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-stone-950 px-6 text-sm font-medium text-white transition hover:bg-stone-800 md:w-auto"
          >
            Criar reserva pendente
          </button>
        </form>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
            <div
              className="h-56 bg-stone-200 bg-cover bg-center"
              style={{
                backgroundImage: unit.cover_image
                  ? `url(${unit.cover_image})`
                  : undefined,
              }}
            />

            <div className="p-6">
              <h2 className="text-xl font-semibold text-stone-950">
                {unit.name}
              </h2>

              <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
                {unit.description || "Sem descrição cadastrada."}
              </p>

              <div className="mt-5 space-y-3 text-sm text-stone-600">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-stone-400" />
                    Check-in
                  </span>

                  <strong className="font-semibold text-stone-950">
                    {formatDateLabel(checkIn)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-stone-400" />
                    Check-out
                  </span>

                  <strong className="font-semibold text-stone-950">
                    {formatDateLabel(checkOut)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-stone-400" />
                    Hóspedes
                  </span>

                  <strong className="font-semibold text-stone-950">
                    {guests}
                  </strong>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-stone-50 p-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-stone-500">
                    {pricing.nights} noite{pricing.nights > 1 ? "s" : ""} ×{" "}
                    {formatMoney(averageNightlyRate)}
                  </span>

                  <span className="font-medium text-stone-950">
                    {formatMoney(pricing.subtotal)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <span className="text-stone-500">Taxa de limpeza</span>

                  <span className="font-medium text-stone-950">
                    {formatMoney(cleaningFee)}
                  </span>
                </div>

                {appliedRuleNames.length > 0 ? (
                  <div className="mt-4 rounded-2xl bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Regras aplicadas
                    </p>

                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {appliedRuleNames.join(", ")}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 border-t border-stone-200 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-stone-950">
                      <WalletCards className="h-4 w-4" />
                      Total
                    </span>

                    <span className="text-2xl font-semibold text-stone-950">
                      {formatMoney(total)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-stone-500">
                Esta reserva será criada como pendente. A confirmação final
                poderá ser feita após pagamento ou aprovação manual.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
