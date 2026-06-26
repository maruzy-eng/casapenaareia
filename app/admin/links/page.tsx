export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowUpRight,
  BedDouble,
  CalendarCheck,
  ExternalLink,
  Globe,
  Home,
  Link2,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { CopyLinkButton } from "@/components/admin/copy-link-button";

function getBaseUrl(host: string | null) {
  if (!host) {
    return "http://localhost:3000";
  }

  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  const protocol = isLocalhost ? "http" : "https";

  return `${protocol}://${host}`;
}

type PublicLinkCardProps = {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  badge?: string;
};

function PublicLinkCard({
  title,
  description,
  url,
  icon,
  badge,
}: PublicLinkCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-primary-soft)] dark:bg-[var(--app-card)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
          {icon}
        </div>

        {badge ? (
          <span className="rounded-full bg-[var(--app-primary-soft)] px-3 py-1 text-xs font-black text-[var(--app-primary)]">
            {badge}
          </span>
        ) : null}
      </div>

      <h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-[var(--app-text)]">
        {title}
      </h2>

      <p className="mt-2 min-h-[44px] text-sm leading-6 text-[var(--app-text-soft)]">
        {description}
      </p>

      <div className="mt-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-4 py-3">
        <p className="break-all text-xs font-bold leading-5 text-[var(--app-text-muted)]">
          {url}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn-primary min-h-11 flex-1 px-4 text-sm"
        >
          Abrir
          <ArrowUpRight className="h-4 w-4" />
        </Link>

        <CopyLinkButton url={url} />
      </div>
    </article>
  );
}

export default async function AdminLinksPage() {
  const headersList = await headers();
  const host = headersList.get("host");
  const baseUrl = getBaseUrl(host);

  const supabase = createAdminClient();

  const { data: units, error } = await supabase
    .from("units")
    .select("id, name, slug, is_active, max_guests, cover_image")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const publicLinks = [
    {
      title: "Site público",
      description:
        "Página principal pública da Casa Pé n’Areia para apresentação e navegação.",
      url: `${baseUrl}/`,
      icon: <Home className="h-5 w-5" />,
      badge: "Principal",
    },
    {
      title: "Reservar",
      description:
        "Página pública para o hóspede consultar disponibilidade e solicitar uma reserva.",
      url: `${baseUrl}/reservar`,
      icon: <CalendarCheck className="h-5 w-5" />,
      badge: "Reserva",
    },
    {
      title: "Acomodações",
      description:
        "Página pública com a listagem das acomodações disponíveis da pousada.",
      url: `${baseUrl}/acomodacoes`,
      icon: <BedDouble className="h-5 w-5" />,
      badge: "Público",
    },
  ];

  const accommodationLinks =
    units?.map((unit) => ({
      title: unit.name || "Acomodação",
      description: `Link público da acomodação. Capacidade máxima: ${
        unit.max_guests || 0
      } hóspedes.`,
      url: `${baseUrl}/acomodacoes/${unit.slug}`,
      icon: <BedDouble className="h-5 w-5" />,
      badge: unit.is_active ? "Ativa" : "Inativa",
    })) || [];

  return (
    <div className="space-y-6 font-sans">
      <section className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
              Links públicos
            </p>

            <h1 className="mt-2 text-[34px] font-black leading-[1.05] tracking-[-0.05em] text-[var(--app-text)] md:text-[46px]">
              Central de links
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--app-text-soft)]">
              Acesse e copie rapidamente os links públicos do site, reservas e
              acomodações da Casa Pé n’Areia.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--app-primary)] shadow-sm dark:bg-white/5">
                <Globe className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--app-text-muted)]">
                  Domínio atual
                </p>

                <p className="mt-1 max-w-[280px] truncate text-sm font-black text-[var(--app-text)]">
                  {baseUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {publicLinks.map((item) => (
          <PublicLinkCard
            key={item.url}
            title={item.title}
            description={item.description}
            url={item.url}
            icon={item.icon}
            badge={item.badge}
          />
        ))}
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
              Acomodações
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
              Links individuais
            </h2>
          </div>

          <Link
            href="/admin/acomodacoes"
            className="admin-btn-secondary min-h-11 px-5 text-sm"
          >
            Gerenciar acomodações
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {accommodationLinks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-card-soft)] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
              <Link2 className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
              Nenhuma acomodação encontrada
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--app-text-soft)]">
              Cadastre uma acomodação para que o link público individual apareça
              aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {accommodationLinks.map((item) => (
              <PublicLinkCard
                key={item.url}
                title={item.title}
                description={item.description}
                url={item.url}
                icon={item.icon}
                badge={item.badge}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}