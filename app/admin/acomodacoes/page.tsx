import Link from "next/link";
import {
  BedDouble,
  CheckCircle2,
  Eye,
  ImageIcon,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminAccommodationsPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
  }>;
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: numberValue % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(numberValue);
}

export default async function AdminAccommodationsPage({
  searchParams,
}: AdminAccommodationsPageProps) {
  const params = await searchParams;

  const wasCreated = params.created === "1";
  const wasUpdated = params.updated === "1";

  const supabase = createAdminClient();

  const { data: units, error } = await supabase
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
      is_active,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const safeUnits = units || [];

  const activeUnits = safeUnits.filter((unit) => unit.is_active).length;

  const totalGuestsCapacity = safeUnits.reduce(
    (sum, unit) => sum + Number(unit.max_guests || 0),
    0
  );

  const unitsWithCoverImage = safeUnits.filter((unit) =>
    Boolean(unit.cover_image)
  ).length;

  const stats = [
    {
      label: "Total de unidades",
      value: safeUnits.length,
      helper: "Cadastradas no sistema",
      icon: BedDouble,
    },
    {
      label: "Acomodações ativas",
      value: activeUnits,
      helper: "Disponíveis para reserva",
      icon: CheckCircle2,
    },
    {
      label: "Capacidade total",
      value: totalGuestsCapacity,
      helper: "Hóspedes no total",
      icon: Users,
    },
    {
      label: "Com imagem principal",
      value: unitsWithCoverImage,
      helper: "Unidades com capa",
      icon: ImageIcon,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {wasCreated ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">Acomodação criada com sucesso.</p>

            <p className="mt-1 text-sm">
              Agora você pode adicionar fotos, vídeos e ajustar os detalhes.
            </p>
          </div>
        </div>
      ) : null}

      {wasUpdated ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">Acomodação atualizada com sucesso.</p>

            <p className="mt-1 text-sm">
              As informações já foram salvas no sistema.
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
                {item.label}
              </p>

              <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
                {formatNumber(item.value)}
              </p>

              <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
                {item.helper}
              </p>
            </div>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
              Acomodações cadastradas
            </h2>

            <p className="mt-1 text-sm text-[var(--app-text-soft)]">
              Lista geral de acomodações.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-4 text-sm text-[var(--app-text-muted)]">
              <Search className="h-4 w-4" />
              Busca em breve
            </div>

            <Link
              href="/admin/acomodacoes/nova"
              className="admin-btn-primary min-h-11 px-5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Nova
            </Link>
          </div>
        </div>

        {safeUnits.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-card-soft)] p-10 text-center">
            <BedDouble className="mx-auto h-10 w-10 text-[var(--app-primary)]" />

            <h3 className="mt-4 text-xl font-black text-[var(--app-text)]">
              Nenhuma acomodação cadastrada
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--app-text-soft)]">
              Comece criando sua primeira suíte, quarto ou casa completa.
            </p>

            <Link
              href="/admin/acomodacoes/nova"
              className="admin-btn-primary mt-6 min-h-12 px-6 text-sm"
            >
              Criar acomodação
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {safeUnits.map((unit) => (
              <article
                key={unit.id}
                className="group overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow)]"
              >
                <div className="relative h-56 bg-[var(--app-primary-soft)]">
                  {unit.cover_image ? (
                    <img
                      src={unit.cover_image}
                      alt={unit.name || "Acomodação"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-[var(--app-primary)]/50" />
                    </div>
                  )}

                  <div className="absolute left-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                        unit.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {unit.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
                        {unit.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-[var(--app-text-muted)]">
                        /acomodacoes/{unit.slug}
                      </p>
                    </div>

                    <p className="shrink-0 text-right text-sm font-black text-[var(--app-primary)]">
                      {formatMoney(unit.base_price)}
                      <span className="block text-xs font-medium text-[var(--app-text-muted)]">
                        /noite
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl border border-[var(--app-border)] bg-white p-3 dark:bg-white/5">
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Hóspedes
                      </p>

                      <p className="mt-1 font-black text-[var(--app-text)]">
                        {formatNumber(unit.max_guests)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--app-border)] bg-white p-3 dark:bg-white/5">
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Quartos
                      </p>

                      <p className="mt-1 font-black text-[var(--app-text)]">
                        {formatNumber(unit.bedrooms)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--app-border)] bg-white p-3 dark:bg-white/5">
                      <p className="text-xs text-[var(--app-text-muted)]">
                        Banhos
                      </p>

                      <p className="mt-1 font-black text-[var(--app-text)]">
                        {formatNumber(unit.bathrooms)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Link
                      href={`/admin/acomodacoes/${unit.id}`}
                      className="admin-btn-primary min-h-11 flex-1 px-4 text-sm"
                    >
                      Editar
                    </Link>

                    <Link
                      href={`/acomodacoes/${unit.slug}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}