export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Search,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateReservationPricing,
  type PricingRule,
} from "@/lib/booking/pricing";
import { PublicHeader } from "@/components/public-header";

type AccommodationsPageProps = {
  searchParams: Promise<{
    q?: string;
    check_in?: string;
    check_out?: string;
    guests?: string;
  }>;
};

type UnitItem = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  max_guests: number | string | null;
  bedrooms: number | string | null;
  bathrooms: number | string | null;
  base_price: number | string | null;
  cleaning_fee: number | string | null;
  cover_image: string | null;
  is_active: boolean | null;
};

type UnitQuote = {
  available: boolean;
  total: number;
  subtotal: number;
  nights: number;
  appliedRuleNames: string[];
  message?: string;
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function isValidYmd(value: string | undefined) {
  if (!value) return false;

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseYmdAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function isValidDateRange(
  checkIn: string | undefined,
  checkOut: string | undefined
) {
  if (!isValidYmd(checkIn) || !isValidYmd(checkOut)) {
    return false;
  }

  return parseYmdAsUtc(checkOut!).getTime() > parseYmdAsUtc(checkIn!).getTime();
}

function differenceInDays(checkIn: string, checkOut: string) {
  const start = parseYmdAsUtc(checkIn);
  const end = parseYmdAsUtc(checkOut);

  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function formatDate(value: string | undefined) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function buildAccommodationDetailUrl({
  unitSlug,
  checkIn,
  checkOut,
  guests,
}: {
  unitSlug?: string | null;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}) {
  const params = new URLSearchParams();

  if (checkIn) params.set("check_in", checkIn);
  if (checkOut) params.set("check_out", checkOut);
  if (guests) params.set("guests", guests);

  const query = params.toString();
  const slug = unitSlug || "";

  return query ? `/acomodacoes/${slug}?${query}` : `/acomodacoes/${slug}`;
}

export default async function AccommodationsPage({
  searchParams,
}: AccommodationsPageProps) {
  const params = await searchParams;

  const q = String(params.q || "").trim().toLowerCase();
  const checkIn = String(params.check_in || "").trim();
  const checkOut = String(params.check_out || "").trim();
  const guests = Number(params.guests || 0);

  const hasDateSearch = isValidDateRange(checkIn, checkOut);
  const nights = hasDateSearch ? differenceInDays(checkIn, checkOut) : 0;

  const supabase = createAdminClient();

  const { data: unitsData, error: unitsError } = await supabase
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
      is_active
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (unitsError) {
    throw new Error(unitsError.message);
  }

  const units = (unitsData || []) as UnitItem[];

  let unavailableUnitIds = new Set<string>();
  let activePricingRules: PricingRule[] = [];

  if (hasDateSearch) {
    const [reservationsResult, blockedDatesResult, rulesResult] = await Promise.all([
      supabase
        .from("reservations")
        .select("unit_id")
        .lt("check_in", checkOut)
        .gt("check_out", checkIn)
        .neq("status", "cancelled"),

      supabase
        .from("blocked_dates")
        .select("unit_id")
        .lt("start_date", checkOut)
        .gt("end_date", checkIn),

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
        .lte("starts_at", checkOut)
        .gte("ends_at", checkIn)
        .order("priority", { ascending: false }),
    ]);

    if (reservationsResult.error) {
      throw new Error(reservationsResult.error.message);
    }

    if (blockedDatesResult.error) {
      throw new Error(blockedDatesResult.error.message);
    }

    if (rulesResult.error) {
      throw new Error(rulesResult.error.message);
    }

    unavailableUnitIds = new Set([
      ...(reservationsResult.data || [])
        .map((item) => item.unit_id)
        .filter(Boolean),
      ...(blockedDatesResult.data || [])
        .map((item) => item.unit_id)
        .filter(Boolean),
    ]);

    activePricingRules = (rulesResult.data || []) as PricingRule[];
  }

  const quotesByUnitId = new Map<string, UnitQuote>();

  if (hasDateSearch) {
    units.forEach((unit) => {
      if (unavailableUnitIds.has(unit.id)) {
        quotesByUnitId.set(unit.id, {
          available: false,
          total: 0,
          subtotal: 0,
          nights,
          appliedRuleNames: [],
          message: "Indisponível no período.",
        });
        return;
      }

      try {
        const pricing = calculateReservationPricing({
          unitId: unit.id,
          basePrice: unit.base_price,
          checkIn,
          checkOut,
          rules: activePricingRules,
        });

        quotesByUnitId.set(unit.id, {
          available: true,
          total: pricing.total,
          subtotal: pricing.subtotal,
          nights: pricing.nights,
          appliedRuleNames: pricing.appliedRulesSummary.map(
            (rule) => rule.name
          ),
        });
      } catch (error) {
        quotesByUnitId.set(unit.id, {
          available: false,
          total: 0,
          subtotal: 0,
          nights,
          appliedRuleNames: [],
          message:
            error instanceof Error
              ? error.message
              : "Tarifa indisponível para o período.",
        });
      }
    });
  }

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      !q ||
      String(unit.name || "").toLowerCase().includes(q) ||
      String(unit.description || "").toLowerCase().includes(q);

    const matchesGuests = !guests || Number(unit.max_guests || 0) >= guests;
    const quote = quotesByUnitId.get(unit.id);
    const isAvailable = !hasDateSearch || quote?.available === true;

    return matchesSearch && matchesGuests && isAvailable;
  });

  return (
    <main className="min-h-screen bg-[#f4fbfb] font-sans text-[#07343b]">
      <PublicHeader active="acomodacoes" />

      <section className="mx-auto max-w-7xl px-5 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#d7edf0] bg-white px-4 py-2 text-sm font-bold text-[#0b5963] transition hover:bg-[#e9f8fa]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0f7f8c]">
              Acomodações
            </p>

            <h1 className="mt-3 text-[38px] font-black leading-[1.02] tracking-[-0.06em] md:text-[58px]">
              Encontre a acomodação ideal.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5c7b82]">
              Escolha datas, quantidade de hóspedes e veja as opções disponíveis
              para sua estadia na Casa Pé n&apos;Areia.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-[#d7edf0] bg-white p-5 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
            <p className="text-sm font-black text-[#07343b]">
              Resultado da busca
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5c7b82]">
              {hasDateSearch ? (
                <>
                  {formatDate(checkIn)} até {formatDate(checkOut)} · {nights}{" "}
                  noite{nights !== 1 ? "s" : ""}
                </>
              ) : (
                "Informe datas para consultar disponibilidade."
              )}
            </p>

            <p className="mt-1 text-sm text-[#5c7b82]">
              {guests > 0
                ? `${guests} hóspede${guests !== 1 ? "s" : ""}`
                : "Hóspedes não informados"}
            </p>
          </div>
        </div>

        <form
          action="/acomodacoes"
          className="mt-8 rounded-[2rem] border border-[#cfe9ed] bg-white p-4 shadow-[0_18px_50px_rgba(7,52,59,0.08)]"
        >
          <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr_0.8fr_auto]">
            <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
                <Search className="h-4 w-4 text-[#0b5963]" />
                Buscar
              </span>

              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Nome da acomodação"
                className="mt-2 h-8 w-full bg-transparent text-sm font-bold text-[#07343b] outline-none placeholder:text-[#8aa2a7]"
              />
            </label>

            <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
                <CalendarDays className="h-4 w-4 text-[#0b5963]" />
                Check-in
              </span>

              <input
                type="date"
                name="check_in"
                defaultValue={checkIn}
                className="mt-2 h-8 w-full bg-transparent text-sm font-bold text-[#07343b] outline-none"
              />
            </label>

            <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
                <CalendarDays className="h-4 w-4 text-[#0b5963]" />
                Check-out
              </span>

              <input
                type="date"
                name="check_out"
                defaultValue={checkOut}
                className="mt-2 h-8 w-full bg-transparent text-sm font-bold text-[#07343b] outline-none"
              />
            </label>

            <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
                <Users className="h-4 w-4 text-[#0b5963]" />
                Hóspedes
              </span>

              <input
                type="number"
                name="guests"
                min="1"
                defaultValue={guests || 2}
                className="mt-2 h-8 w-full bg-transparent text-sm font-bold text-[#07343b] outline-none"
              />
            </label>

            <button
              type="submit"
              className="inline-flex min-h-[76px] items-center justify-center gap-2 rounded-[1.4rem] bg-[#0b5963] px-6 text-sm font-black text-white transition hover:bg-[#084b54]"
            >
              <Search className="h-5 w-5" />
              Buscar
            </button>
          </div>
        </form>

        {!isValidDateRange(checkIn, checkOut) && (checkIn || checkOut) ? (
          <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <p className="font-bold">Período inválido.</p>
            <p className="mt-1 text-sm">
              O check-out precisa ser posterior ao check-in.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-[-0.04em]">
            {filteredUnits.length} acomodação
            {filteredUnits.length !== 1 ? "ões" : ""} encontrada
            {filteredUnits.length !== 1 ? "s" : ""}
          </h2>

          <Link
            href="/acomodacoes"
            className="text-sm font-black text-[#0b5963] hover:underline"
          >
            Limpar filtros
          </Link>
        </div>

        {filteredUnits.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-[#bfe3e8] bg-white p-12 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-[#0b5963]" />

            <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
              Nenhuma acomodação disponível
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#5c7b82]">
              Tente mudar as datas, a quantidade de hóspedes ou limpar os
              filtros.
            </p>
          </div>
        ) : (
          <section className="mt-6 grid gap-6">
            {filteredUnits.map((unit) => {
              const quote = quotesByUnitId.get(unit.id);
              const displayedTotal =
                quote?.available && hasDateSearch
                  ? quote.total
                  : Number(unit.base_price || 0) * nights;
              const displayedNightlyRate =
                quote?.available && hasDateSearch && quote.nights > 0
                  ? quote.total / quote.nights
                  : Number(unit.base_price || 0);

              return (
                <article
                  key={unit.id}
                  className="grid overflow-hidden rounded-[2rem] border border-[#d7edf0] bg-white shadow-[0_18px_50px_rgba(7,52,59,0.08)] transition hover:shadow-[0_24px_70px_rgba(7,52,59,0.14)] lg:grid-cols-[340px_1fr_260px]"
                >
                <Link
                  href={buildAccommodationDetailUrl({
                    unitSlug: unit.slug,
                    checkIn,
                    checkOut,
                    guests: String(guests || ""),
                  })}
                  className="block min-h-[260px] bg-[#e6f6f8] bg-cover bg-center"
                  style={{
                    backgroundImage: unit.cover_image
                      ? `url(${unit.cover_image})`
                      : undefined,
                  }}
                >
                  {!unit.cover_image ? (
                    <div className="flex h-full min-h-[260px] items-center justify-center text-[#0b5963]">
                      <BedDouble className="h-12 w-12" />
                    </div>
                  ) : null}
                </Link>

                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#e9f8fa] px-3 py-1 text-xs font-black text-[#0b5963]">
                      Até {unit.max_guests || 0} hóspedes
                    </span>

                    {hasDateSearch ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        Disponível no período
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">
                    {unit.name || "Acomodação"}
                  </h3>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5c7b82]">
                    {unit.description ||
                      "Acomodação confortável para sua estadia na Casa Pé n’Areia."}
                  </p>

                  <div className="mt-5 grid max-w-md grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-[#f1fafb] p-3">
                      <Users className="h-4 w-4 text-[#0b5963]" />
                      <p className="mt-2 text-xs font-bold text-[#5c7b82]">
                        Hóspedes
                      </p>
                      <p className="font-black">{unit.max_guests || 0}</p>
                    </div>

                    <div className="rounded-2xl bg-[#f1fafb] p-3">
                      <BedDouble className="h-4 w-4 text-[#0b5963]" />
                      <p className="mt-2 text-xs font-bold text-[#5c7b82]">
                        Quartos
                      </p>
                      <p className="font-black">{unit.bedrooms || 0}</p>
                    </div>

                    <div className="rounded-2xl bg-[#f1fafb] p-3">
                      <CheckCircle2 className="h-4 w-4 text-[#0b5963]" />
                      <p className="mt-2 text-xs font-bold text-[#5c7b82]">
                        Banhos
                      </p>
                      <p className="font-black">{unit.bathrooms || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-[#d7edf0] p-6 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-xs font-bold text-[#789097]">
                      {hasDateSearch ? "Diária média" : "A partir de"}
                    </p>

                    <p className="mt-1 text-3xl font-black tracking-[-0.06em]">
                      {formatMoney(displayedNightlyRate)}
                    </p>

                    <p className="text-xs text-[#789097]">
                      {hasDateSearch ? "por noite no período" : "por noite"}
                    </p>

                    {hasDateSearch ? (
                      <div className="mt-4 rounded-2xl bg-[#f1fafb] p-4">
                        <p className="text-xs font-bold text-[#5c7b82]">
                          Estimativa
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {formatMoney(displayedTotal)}
                        </p>

                        <p className="mt-1 text-xs text-[#789097]">
                          {quote?.nights || nights} noite
                          {(quote?.nights || nights) !== 1 ? "s" : ""}, sem taxas.
                        </p>

                        {quote?.appliedRuleNames.length ? (
                          <p className="mt-2 text-[11px] font-bold text-[#0b5963]">
                            {quote.appliedRuleNames.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <Link
                    href={buildAccommodationDetailUrl({
                      unitSlug: unit.slug,
                      checkIn,
                      checkOut,
                      guests: String(guests || ""),
                    })}
                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b5963] px-5 text-sm font-black text-white transition hover:bg-[#084b54]"
                  >
                    Ver detalhes
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
