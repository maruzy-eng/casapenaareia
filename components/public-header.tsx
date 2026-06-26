import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type PublicHeaderProps = {
  active?: "home" | "acomodacoes" | "reservar" | "pagamento";
};

export function PublicHeader({ active }: PublicHeaderProps) {
  const availabilityHref =
    active === "home" ? "#buscar-disponibilidade" : "/#buscar-disponibilidade";

  return (
    <header className="sticky top-0 z-40 border-b border-[#d7edf0] bg-white/92 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3">
        <BrandLogo />

        <nav className="hidden items-center gap-7 text-sm font-bold text-[#466970] md:flex">
          <Link
            href="/"
            className={`transition hover:text-[#0b5963] ${
              active === "home" ? "text-[#0b5963]" : ""
            }`}
          >
            Início
          </Link>

          <Link
            href="/acomodacoes"
            className={`transition hover:text-[#0b5963] ${
              active === "acomodacoes" ? "text-[#0b5963]" : ""
            }`}
          >
            Acomodações
          </Link>

          <Link
            href={availabilityHref}
            className={`transition hover:text-[#0b5963] ${
              active === "reservar" ? "text-[#0b5963]" : ""
            }`}
          >
            Reservar
          </Link>
        </nav>

        <Link
          href={availabilityHref}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0b5963] px-5 text-sm font-black text-white transition hover:bg-[#084b54]"
        >
          Reservar agora
        </Link>
      </div>
    </header>
  );
}
