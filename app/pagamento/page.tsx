export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  CreditCard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateReservationPricing,
  type PricingRule,
} from "@/lib/booking/pricing";

type PaymentPageProps = {
  searchParams: Promise<{
    unit?: string;
    check_in?: string;
    check_out?: string;
    guests?: string;
  }>;
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value: string | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function parseYmdAsUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function differenceInDays(checkIn: string, checkOut: string) {
  const start = parseYmdAsUtc(checkIn);
  const end = parseYmdAsUtc(checkOut);

  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 86_400_000)
  );
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams;

  const unitSlug = String(params.unit || "");
  const checkIn = String(params.check_in || "");
  const checkOut = String(params.check_out || "");
  const guests = String(params.guests || "1");

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
      cover_image
    `
    )
    .eq("slug", unitSlug)
    .single();

  if (error || !unit) {
    return (
      <main className="min-h-screen bg-[#f4fbfb] px-5 py-16 font-sans text-[#07343b]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#d7edf0] bg-white p-10 text-center shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
          <CreditCard className="mx-auto h-12 w-12 text-[#0b5963]" />

          <h1 className="mt-5 text-3xl font-black tracking-[-0.05em]">
            Reserva não encontrada
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#5c7b82]">
            Volte para a página de acomodações e escolha uma opção para
            reservar.
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

  const nights = checkIn && checkOut ? differenceInDays(checkIn, checkOut) : 0;

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

  const pricing =
    checkIn && checkOut && nights > 0
      ? calculateReservationPricing({
          unitId: unit.id,
          basePrice: unit.base_price,
          checkIn,
          checkOut,
          rules: (rules || []) as PricingRule[],
        })
      : null;

  const subtotal = pricing?.subtotal || Number(unit.base_price || 0) * nights;
  const cleaningFee = Number(unit.cleaning_fee || 0);
  const total = subtotal + cleaningFee;
  const averageNightlyRate =
    pricing && pricing.nights > 0 ? pricing.total / pricing.nights : 0;

  return (
    <main className="min-h-screen bg-[#f4fbfb] font-sans text-[#07343b]">
      <header className="border-b border-[#d7edf0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0b5963] text-white">
              <BedDouble className="h-5 w-5" />
            </div>

            <div>
              <p className="font-black tracking-[-0.03em]">
                Casa Pé n&apos;Areia
              </p>
              <p className="text-xs text-[#5c7b82]">Pagamento da reserva</p>
            </div>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <Link
          href={`/acomodacoes/${unit.slug}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`}
          className="inline-flex items-center gap-2 rounded-full border border-[#d7edf0] bg-white px-4 py-2 text-sm font-bold text-[#0b5963] transition hover:bg-[#e9f8fa]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para detalhes
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[2rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b5963] text-white">
              <CreditCard className="h-6 w-6" />
            </div>

            <h1 className="mt-6 text-[36px] font-black leading-tight tracking-[-0.06em] md:text-[54px]">
              Finalizar reserva
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5c7b82]">
              Esta é a página inicial de pagamento. Aqui você pode integrar
              Stripe, Mercado Pago, Asaas, Pagar.me ou outro gateway.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#bfe3e8] bg-[#f7fcfc] p-8 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-[#0b5963]" />

              <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">
                Gateway de pagamento ainda não conectado
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#5c7b82]">
                O próximo passo é conectar esta página com o provedor de
                pagamento escolhido e criar a reserva após confirmação.
              </p>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[#d7edf0] bg-white p-6 shadow-[0_18px_50px_rgba(7,52,59,0.08)]">
            <h2 className="text-2xl font-black tracking-[-0.05em]">Resumo</h2>

            {unit.cover_image ? (
              <img
                src={unit.cover_image}
                alt={unit.name || "Acomodação"}
                className="mt-5 h-48 w-full rounded-[1.5rem] object-cover"
              />
            ) : null}

            <h3 className="mt-5 text-xl font-black tracking-[-0.04em]">
              {unit.name}
            </h3>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[#5c7b82]">
                  <CalendarDays className="h-4 w-4 text-[#0b5963]" />
                  Check-in
                </span>
                <strong>{formatDate(checkIn)}</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[#5c7b82]">
                  <CalendarDays className="h-4 w-4 text-[#0b5963]" />
                  Check-out
                </span>
                <strong>{formatDate(checkOut)}</strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[#5c7b82]">
                  <Users className="h-4 w-4 text-[#0b5963]" />
                  Hóspedes
                </span>
                <strong>{guests}</strong>
              </div>

              <div className="border-t border-[#d7edf0] pt-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#5c7b82]">
                    {nights} noite{nights !== 1 ? "s" : ""}
                    {pricing ? ` × ${formatMoney(averageNightlyRate)}` : ""}
                  </span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>

                {pricing?.appliedRulesSummary.length ? (
                  <div className="mt-2 rounded-2xl bg-[#f7fcfc] p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#789097]">
                      Regras aplicadas
                    </p>
                    <p className="mt-1 text-sm font-black text-[#07343b]">
                      {pricing.appliedRulesSummary
                        .map((rule) => rule.name)
                        .join(", ")}
                    </p>
                  </div>
                ) : null}

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-[#5c7b82]">Taxa de limpeza</span>
                  <strong>{formatMoney(cleaningFee)}</strong>
                </div>
              </div>

              <div className="border-t border-[#d7edf0] pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-lg font-black">Total</span>
                  <strong className="text-3xl tracking-[-0.06em]">
                    {formatMoney(total)}
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 inline-flex min-h-13 w-full items-center justify-center rounded-2xl bg-[#0b5963] px-5 text-sm font-black text-white opacity-60"
            >
              Pagamento em breve
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}
