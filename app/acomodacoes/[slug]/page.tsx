export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Tv,
  Users,
  Utensils,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateReservationPricing,
  type PricingResult,
  type PricingRule,
} from "@/lib/booking/pricing";
import { PublicHeader } from "@/components/public-header";

type AccommodationDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
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

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value: string | undefined) {
  if (!value) return "";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function parseYmdAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function isValidYmd(value: string | undefined) {
  if (!value) return false;

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidDateRange(
  checkIn: string | undefined,
  checkOut: string | undefined
) {
  if (!isValidYmd(checkIn) || !isValidYmd(checkOut)) return false;

  return parseYmdAsUtc(checkOut!).getTime() > parseYmdAsUtc(checkIn!).getTime();
}

function differenceInDays(checkIn: string, checkOut: string) {
  const start = parseYmdAsUtc(checkIn);
  const end = parseYmdAsUtc(checkOut);

  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function buildReservationUrl({
  unitSlug,
  checkIn,
  checkOut,
  guests,
}: {
  unitSlug: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}) {
  const params = new URLSearchParams();

  params.set("unit", unitSlug);

  if (checkIn) params.set("check_in", checkIn);
  if (checkOut) params.set("check_out", checkOut);
  if (guests) params.set("guests", guests);

  return `/reservar?${params.toString()}`;
}

function AmenityCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#d7edf0] bg-[#f7fcfc] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b5963] text-white">
        {icon}
      </div>

      <div>
        <h3 className="font-black tracking-[-0.03em] text-[#07343b]">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-[#5c7b82]">{text}</p>
      </div>
    </div>
  );
}

function DetailSearchForm({
  slug,
  unitName,
  checkIn,
  checkOut,
  guests,
}: {
  slug: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  guests: string;
}) {
  return (
    <form
      action={`/acomodacoes/${slug}`}
      className="mt-4 rounded-[2rem] border border-[#d7edf0] bg-white p-4 shadow-[0_18px_50px_rgba(7,52,59,0.08)]"
    >
      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr_0.8fr_auto]">
        <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3 transition focus-within:border-[#0b5963] focus-within:ring-4 focus-within:ring-[#0b5963]/10">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
            <Search className="h-4 w-4 text-[#0b5963]" />
            Destino
          </span>

          <input
            name="q"
            defaultValue={unitName}
            placeholder="Nome da acomodação"
            className="mt-2 h-8 w-full bg-transparent text-sm font-bold text-[#07343b] outline-none placeholder:text-[#8aa2a7]"
          />
        </label>

        <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3 transition focus-within:border-[#0b5963] focus-within:ring-4 focus-within:ring-[#0b5963]/10">
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

        <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3 transition focus-within:border-[#0b5963] focus-within:ring-4 focus-within:ring-[#0b5963]/10">
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

        <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3 transition focus-within:border-[#0b5963] focus-within:ring-4 focus-within:ring-[#0b5963]/10">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
            <Users className="h-4 w-4 text-[#0b5963]" />
            Hóspedes
          </span>

          <input
            type="number"
            name="guests"
            min="1"
            defaultValue={guests || "1"}
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
  );
}

export default async function AccommodationDetailPage({
  params,
  searchParams,
}: AccommodationDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const checkIn = String(query.check_in || "").trim();
  const checkOut = String(query.check_out || "").trim();
  const guests = String(query.guests || "1").trim();

  const hasDateSearch = isValidDateRange(checkIn, checkOut);
  const nights = hasDateSearch ? differenceInDays(checkIn, checkOut) : 0;

  const supabase = createAdminClient();

  const { data, error } = await supabase
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
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#f4fbfb] px-5 py-16 font-sans text-[#07343b]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#d7edf0] bg-white p-10 text-center shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
          <BedDouble className="mx-auto h-12 w-12 text-[#0b5963]" />

          <h1 className="mt-5 text-3xl font-black tracking-[-0.05em]">
            Acomodação não encontrada
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#5c7b82]">
            Essa acomodação não existe ou não está mais disponível.
          </p>

          <Link
            href="/acomodacoes"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0b5963] px-6 text-sm font-black text-white transition hover:bg-[#084b54]"
          >
            Ver acomodações
          </Link>
        </div>
      </main>
    );
  }

  const unit = data as UnitItem;
  const unitName = unit.name || "Acomodação";

  const gallery = [
    unit.cover_image,
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=1200&q=85",
  ].filter(Boolean) as string[];

  let pricing: PricingResult | null = null;
  let pricingMessage = "";

  if (hasDateSearch) {
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

    try {
      pricing = calculateReservationPricing({
        unitId: unit.id,
        basePrice: unit.base_price,
        checkIn,
        checkOut,
        rules: (rules || []) as PricingRule[],
      });
    } catch (error) {
      pricingMessage =
        error instanceof Error
          ? error.message
          : "Não foi possível calcular a tarifa para esse período.";
    }
  }

  const subtotal = pricing
    ? pricing.subtotal
    : hasDateSearch
      ? Number(unit.base_price || 0) * nights
      : 0;
  const cleaningFee = Number(unit.cleaning_fee || 0);
  const estimatedStayTotal = hasDateSearch ? subtotal + cleaningFee : 0;
  const displayedNightlyRate =
    pricing && pricing.nights > 0
      ? pricing.total / pricing.nights
      : Number(unit.base_price || 0);

  const reservationUrl = buildReservationUrl({
    unitSlug: slug,
    checkIn,
    checkOut,
    guests,
  });

  return (
    <main className="min-h-screen bg-[#f4fbfb] font-sans text-[#07343b]">
      <PublicHeader active="acomodacoes" />

      <section className="mx-auto max-w-7xl px-5 py-8">
        <Link
          href={`/acomodacoes?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
          className="inline-flex items-center gap-2 rounded-full border border-[#d7edf0] bg-white px-4 py-2 text-sm font-bold text-[#0b5963] transition hover:bg-[#e9f8fa]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para resultados
        </Link>

        <section className="mt-6 rounded-[2rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e9f8fa] px-3 py-1 text-xs font-black text-[#0b5963]">
              Até {unit.max_guests || 0} hóspedes
            </span>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              Disponível para consulta
            </span>

            <span className="rounded-full bg-[#fff4da] px-3 py-1 text-xs font-black text-[#9a6b13]">
              Perto do mar
            </span>
          </div>

          <h1 className="mt-4 text-[38px] font-black leading-[1.02] tracking-[-0.065em] text-[#07343b] md:text-[58px]">
            {unitName}
          </h1>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#5c7b82]">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0b5963]" />
              Casa Pé n&apos;Areia, Caetanos de Amontada — CE
            </span>

            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 fill-[#d7b77c] text-[#d7b77c]" />
              Hospedagem perto do mar
            </span>
          </div>
        </section>

        <DetailSearchForm
          slug={slug}
          unitName={unitName}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
        />

        {checkIn || checkOut ? (
          !hasDateSearch ? (
            <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
              <p className="font-bold">Período inválido.</p>
              <p className="mt-1 text-sm">
                O check-out precisa ser posterior ao check-in.
              </p>
            </div>
          ) : (
            <section className="mt-4 rounded-[2rem] border border-[#d7edf0] bg-white p-4 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
              {pricingMessage ? (
                <div className="mb-4 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  {pricingMessage}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.1fr]">
                <div className="rounded-[1.4rem] bg-[#f7fcfc] p-4">
                  <p className="text-xs font-bold text-[#789097]">
                    {pricing ? "Diária média" : "A partir de"}
                  </p>

                  <p className="mt-1 text-3xl font-black tracking-[-0.07em] text-[#07343b]">
                    {formatMoney(displayedNightlyRate)}
                  </p>

                  <p className="text-sm text-[#789097]">
                    {pricing ? "por noite no período" : "por noite"}
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-[#f1fafb] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5c7b82]">
                    Sua busca
                  </p>

                  <p className="mt-2 text-sm font-black text-[#07343b]">
                    {formatDate(checkIn)} até {formatDate(checkOut)}
                  </p>

                  <p className="mt-1 text-sm text-[#5c7b82]">
                    {nights} noite{nights !== 1 ? "s" : ""} · {guests || 1}{" "}
                    hóspede{Number(guests || 1) !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-[#f7fcfc] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5c7b82]">
                    Valores
                  </p>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#5c7b82]">Diárias</span>
                      <strong>{formatMoney(subtotal)}</strong>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#5c7b82]">Limpeza</span>
                      <strong>{formatMoney(cleaningFee)}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.4rem] bg-[#0b5963] p-4 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-white/65">
                    Total estimado
                  </p>

                  <p className="mt-1 text-3xl font-black tracking-[-0.07em]">
                    {formatMoney(estimatedStayTotal)}
                  </p>

                  {pricing?.appliedRulesSummary.length ? (
                    <p className="mt-2 text-xs font-bold text-white/75">
                      {pricing.appliedRulesSummary
                        .map((rule) => rule.name)
                        .join(", ")}
                    </p>
                  ) : null}

                  <Link
                    href={reservationUrl}
                    className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#0b5963] transition hover:bg-[#e9f8fa] ${
                      pricingMessage ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    Reservar agora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          )
        ) : null}

        <section className="mt-6 grid gap-3 lg:grid-cols-[1.25fr_0.75fr_0.75fr] lg:grid-rows-[250px_250px]">
          {gallery.slice(0, 5).map((image, index) => (
            <figure
              key={`${image}-${index}`}
              className={`overflow-hidden rounded-[1.7rem] bg-[#e6f6f8] shadow-[0_18px_44px_rgba(7,52,59,0.08)] ${
                index === 0 ? "lg:row-span-2" : ""
              }`}
            >
              <img
                src={image}
                alt={`${unitName} foto ${index + 1}`}
                className="h-full min-h-[250px] w-full object-cover transition duration-500 hover:scale-105"
              />
            </figure>
          ))}
        </section>

        <section className="mt-6 grid gap-6">
          <div className="space-y-6">
            <article className="rounded-[1.75rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
              <h2 className="text-2xl font-black tracking-[-0.05em]">
                Sobre esta acomodação
              </h2>

              <p className="mt-4 text-base leading-8 text-[#5c7b82]">
                {unit.description ||
                  "Acomodação confortável para sua estadia na Casa Pé n’Areia, ideal para aproveitar Caetanos de Amontada com conforto, praticidade e proximidade do mar."}
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
              <h2 className="text-2xl font-black tracking-[-0.05em]">
                Informações da acomodação
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#f1fafb] p-4">
                  <Users className="h-5 w-5 text-[#0b5963]" />
                  <p className="mt-3 text-sm font-bold text-[#5c7b82]">
                    Hóspedes
                  </p>
                  <p className="text-2xl font-black">{unit.max_guests || 0}</p>
                </div>

                <div className="rounded-2xl bg-[#f1fafb] p-4">
                  <BedDouble className="h-5 w-5 text-[#0b5963]" />
                  <p className="mt-3 text-sm font-bold text-[#5c7b82]">
                    Quartos
                  </p>
                  <p className="text-2xl font-black">{unit.bedrooms || 0}</p>
                </div>

                <div className="rounded-2xl bg-[#f1fafb] p-4">
                  <Bath className="h-5 w-5 text-[#0b5963]" />
                  <p className="mt-3 text-sm font-bold text-[#5c7b82]">
                    Banheiros
                  </p>
                  <p className="text-2xl font-black">{unit.bathrooms || 0}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
              <h2 className="text-2xl font-black tracking-[-0.05em]">
                Principais comodidades
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <AmenityCard
                  icon={<Wifi className="h-5 w-5" />}
                  title="Wi-Fi"
                  text="Internet para sua estadia."
                />

                <AmenityCard
                  icon={<Wind className="h-5 w-5" />}
                  title="Ar-condicionado"
                  text="Mais conforto após a praia."
                />

                <AmenityCard
                  icon={<Utensils className="h-5 w-5" />}
                  title="Cozinha equipada"
                  text="Estrutura para refeições."
                />

                <AmenityCard
                  icon={<Tv className="h-5 w-5" />}
                  title="Smart TV"
                  text="Entretenimento e descanso."
                />

                <AmenityCard
                  icon={<Waves className="h-5 w-5" />}
                  title="Perto da praia"
                  text="A poucos passos do mar."
                />

                <AmenityCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Atendimento assistido"
                  text="Confirmação pela equipe."
                />
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
              <h2 className="text-2xl font-black tracking-[-0.05em]">
                Endereço
              </h2>

              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#d7edf0]">
                <div className="flex min-h-[280px] items-center justify-center bg-[linear-gradient(rgba(13,101,116,0.16),rgba(13,101,116,0.16)),url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-[#0b5963] shadow-xl backdrop-blur">
                    <MapPin className="h-9 w-9" />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-[#fffaf1] p-5 text-sm font-black leading-7 text-[#07343b]">
                Casa Pé n&apos;Areia
                <br />
                Caetanos de Amontada — Ceará
                <br />
                Aproximadamente 25 metros da praia.
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
