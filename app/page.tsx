export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Search,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicHeader } from "@/components/public-header";

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

function SearchBox() {
  return (
    <section className="relative z-20 mx-auto -mt-16 max-w-7xl px-5">
      <form
        action="/acomodacoes"
        className="rounded-[2rem] border border-[#cfe9ed] bg-white p-4 shadow-[0_24px_80px_rgba(7,52,59,0.14)]"
      >
        <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr_1fr_0.8fr_auto]">
          <label className="rounded-[1.4rem] border border-[#d7edf0] bg-[#f7fcfc] px-4 py-3">
            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6c8990]">
              <MapPin className="h-4 w-4 text-[#0b5963]" />
              Destino
            </span>

            <input
              name="q"
              placeholder="Casa Pé n’Areia"
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
              defaultValue="2"
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
    </section>
  );
}

function AccommodationCard({ unit }: { unit: UnitItem }) {
  const href = unit.slug ? `/acomodacoes/${unit.slug}` : "/acomodacoes";

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#d7edf0] bg-white shadow-[0_18px_50px_rgba(7,52,59,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_74px_rgba(7,52,59,0.15)]">
      <Link href={href} className="block">
        <div
          className="relative h-64 bg-[#e6f6f8] bg-cover bg-center"
          style={{
            backgroundImage: unit.cover_image
              ? `url(${unit.cover_image})`
              : undefined,
          }}
        >
          {!unit.cover_image ? (
            <div className="flex h-full items-center justify-center text-[#0b5963]">
              <BedDouble className="h-12 w-12" />
            </div>
          ) : null}

          <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-black text-[#07343b] shadow-sm backdrop-blur">
            Até {unit.max_guests || 0} hóspedes
          </div>
        </div>
      </Link>

      <div className="p-5">
        <h3 className="truncate text-xl font-black tracking-[-0.04em] text-[#07343b]">
          {unit.name || "Acomodação"}
        </h3>

        <p className="mt-2 min-h-[54px] text-sm leading-6 text-[#61777d]">
          {unit.description ||
            "Acomodação confortável para sua estadia na Casa Pé n’Areia."}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[#f1fafb] p-3">
            <Users className="h-4 w-4 text-[#0b5963]" />
            <p className="mt-2 text-xs font-bold text-[#61777d]">Hóspedes</p>
            <p className="font-black text-[#07343b]">{unit.max_guests || 0}</p>
          </div>

          <div className="rounded-2xl bg-[#f1fafb] p-3">
            <BedDouble className="h-4 w-4 text-[#0b5963]" />
            <p className="mt-2 text-xs font-bold text-[#61777d]">Quartos</p>
            <p className="font-black text-[#07343b]">{unit.bedrooms || 0}</p>
          </div>

          <div className="rounded-2xl bg-[#f1fafb] p-3">
            <CheckCircle2 className="h-4 w-4 text-[#0b5963]" />
            <p className="mt-2 text-xs font-bold text-[#61777d]">Banhos</p>
            <p className="font-black text-[#07343b]">{unit.bathrooms || 0}</p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#d7edf0] pt-5">
          <div>
            <p className="text-xs font-bold text-[#789097]">A partir de</p>

            <p className="text-2xl font-black tracking-[-0.05em] text-[#07343b]">
              {formatMoney(unit.base_price)}
            </p>

            <p className="text-xs text-[#789097]">por noite</p>
          </div>

          <Link
            href={href}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0b5963] px-4 text-sm font-black text-white transition hover:bg-[#084b54]"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function HomePage() {
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
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const accommodations = (data || []) as UnitItem[];

  return (
    <main className="min-h-screen bg-[#fffaf1] font-sans text-[#14323a]">
      <PublicHeader active="home" />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,250,241,0.97)_0%,rgba(255,250,241,0.86)_46%,rgba(255,250,241,0.20)_100%),url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(44,184,197,0.16),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(215,183,124,0.22),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl gap-10 px-5 pb-28 pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-[1.4rem] border border-[#0d6574]/12 bg-white/72 px-4 py-3 shadow-[0_18px_40px_rgba(7,63,73,0.08)] backdrop-blur">
              <img
                src="https://casapenareia.com/wp-content/uploads/2026/06/LOGO-Casa-Pe-n%C2%B4Areia.png"
                alt="Casa Pé n’Areia"
                className="h-16 w-auto max-w-[230px] object-contain"
              />
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#0d6574]/16 bg-white/72 px-4 py-2 text-sm font-bold text-[#073f49] shadow-[0_10px_28px_rgba(7,63,73,0.07)] backdrop-blur">
              <MapPin className="h-4 w-4 text-[#0d6574]" />
              Caetanos de Amontada — Ceará
            </div>

            <h1 className="mt-6 max-w-4xl text-[42px] font-black leading-[0.94] tracking-[-0.075em] text-[#073f49] md:text-[76px]">
              Chalés e casa de praia a poucos passos do{" "}
              <span className="text-[#0d6574]">mar.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#31525a] md:text-xl">
              Hospede-se na Casa Pé n’Areia e viva dias de descanso, praia,
              vento e natureza em uma vila de pescadores no litoral oeste do
              Ceará.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/reservar"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#0d6574] to-[#2cb8c5] px-6 text-sm font-black text-white shadow-[0_16px_38px_rgba(13,101,116,0.28)] transition hover:-translate-y-1"
              >
                Consultar disponibilidade
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#acomodacoes"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-[#0d6574]/18 bg-white/76 px-6 text-sm font-black text-[#073f49] shadow-[0_14px_30px_rgba(7,63,73,0.08)] transition hover:-translate-y-1 hover:bg-white"
              >
                Ver acomodações
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[560px] lg:block">
            <div className="absolute inset-x-0 bottom-0 left-16 top-10 overflow-hidden rounded-[2.4rem] border-[8px] border-white/80 shadow-[0_24px_70px_rgba(7,63,73,0.14)]">
              <img
                src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85"
                alt="Praia tropical"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute bottom-12 left-0 w-[245px] rotate-[-4deg] overflow-hidden rounded-[1.9rem] border-[7px] border-white/90 shadow-[0_20px_50px_rgba(7,63,73,0.18)]">
              <img
                src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=700&q=85"
                alt="Mar e areia"
                className="h-[245px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <SearchBox />

      <section className="bg-[linear-gradient(180deg,#fffaf1_0%,#ffffff_38%,#f7fbfb_100%)] py-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-[1.8rem] border border-[#d7edf0] bg-white/82 p-6 shadow-[0_18px_54px_rgba(7,63,73,0.08)]">
              <Waves className="h-8 w-8 text-[#0b5963]" />
              <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-[#073f49]">
                A poucos passos da praia
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#61777d]">
                A hospedagem fica a cerca de 25 metros do mar.
              </p>
            </article>

            <article className="rounded-[1.8rem] border border-[#d7edf0] bg-white/82 p-6 shadow-[0_18px_54px_rgba(7,63,73,0.08)]">
              <Wifi className="h-8 w-8 text-[#0b5963]" />
              <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-[#073f49]">
                Conforto essencial
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#61777d]">
                Wi-Fi, ar-condicionado, Smart TV e cozinha equipada.
              </p>
            </article>

            <article className="rounded-[1.8rem] border border-[#d7edf0] bg-white/82 p-6 shadow-[0_18px_54px_rgba(7,63,73,0.08)]">
              <Users className="h-8 w-8 text-[#0b5963]" />
              <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-[#073f49]">
                Para diferentes viagens
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#61777d]">
                Casais, famílias, grupos de amigos e kitesurfistas.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="acomodacoes" className="bg-[#f7fbfb] py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0d6574]">
                Acomodações
              </p>

              <h2 className="mt-3 text-[34px] font-black leading-tight tracking-[-0.06em] text-[#073f49] md:text-[52px]">
                Escolha a acomodação ideal para sua viagem.
              </h2>
            </div>

            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
              <Link
                href="/acomodacoes"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#cfe9ed] bg-white px-5 text-sm font-black text-[#0d6574] transition hover:bg-[#e9f8fa]"
              >
                Ver todas as acomodações
              </Link>

              <Link
                href="/reservar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0d6574] px-5 text-sm font-black text-white transition hover:bg-[#073f49]"
              >
                Solicitar reserva
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {accommodations.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-dashed border-[#bfe3e8] bg-white p-12 text-center">
              <BedDouble className="mx-auto h-10 w-10 text-[#0d6574]" />
              <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#073f49]">
                Nenhuma acomodação cadastrada ainda
              </h3>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {accommodations.slice(0, 6).map((unit) => (
                <AccommodationCard key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#d7edf0] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-[#073f49]">Casa Pé n&apos;Areia</p>
            <p className="mt-1 text-sm leading-6 text-[#61777d]">
              Caetanos de Amontada — CE · Chalés e casa de praia a poucos
              passos do mar.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm font-bold text-[#466970]">
            <Link href="/acomodacoes" className="hover:text-[#0d6574]">
              Acomodações
            </Link>
            <Link href="/reservar" className="hover:text-[#0d6574]">
              Reservar
            </Link>
            <Link href="/admin/login" className="hover:text-[#0d6574]">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}