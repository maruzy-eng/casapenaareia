import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  Eye,
  ImageIcon,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { AccommodationEditForm } from "@/components/admin/accommodation-edit-form";
import { AccommodationMediaManager } from "@/components/admin/accommodation-media-manager";

type AdminAccommodationEditPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    created?: string;
    media?: string;
  }>;
};

function formatMoney(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
}

function formatNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: numberValue % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(numberValue);
}

export default async function AdminAccommodationEditPage({
  params,
  searchParams,
}: AdminAccommodationEditPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const wasCreated = query.created === "1";
  const wasMediaCreated = query.media === "created";
  const wasMediaDeleted = query.media === "deleted";

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
      is_active,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !unit) {
    notFound();
  }

  const { data: media, error: mediaError } = await supabase
    .from("unit_media")
    .select(
      `
      id,
      unit_id,
      media_type,
      url,
      title,
      sort_order,
      created_at
    `
    )
    .eq("unit_id", unit.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  const safeMedia = (media || []).map((item) => ({
    id: item.id,
    unit_id: item.unit_id,
    media_type: item.media_type as "image" | "video",
    url: item.url,
    title: item.title,
    sort_order: item.sort_order,
    created_at: item.created_at,
  }));

  return (
    <div className="space-y-6 font-sans">
      {wasCreated ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">Acomodação criada com sucesso.</p>

            <p className="mt-1 text-sm">
              Agora você pode adicionar fotos e vídeos na galeria dessa
              acomodação.
            </p>
          </div>
        </div>
      ) : null}

      {wasMediaCreated ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">Mídia adicionada com sucesso.</p>

            <p className="mt-1 text-sm">
              A foto ou vídeo já aparece na galeria da acomodação.
            </p>
          </div>
        </div>
      ) : null}

      {wasMediaDeleted ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">Mídia removida com sucesso.</p>

            <p className="mt-1 text-sm">
              O item foi removido da galeria da acomodação.
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,89,99,0.10),rgba(39,180,196,0.08)_42%,transparent_72%)]" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--app-teal-light)]/20 blur-3xl" />

          <div className="relative p-6 md:p-8">
            <Link
              href="/admin/acomodacoes"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white/70 px-3 py-1.5 text-xs font-bold text-[var(--app-primary)] shadow-sm backdrop-blur transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para acomodações
            </Link>

            <h2 className="mt-5 max-w-3xl text-[30px] font-black leading-[1.05] tracking-[-0.045em] text-[var(--app-text)] md:text-[44px]">
              {unit.name}
            </h2>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--app-text-soft)]">
              Edite informações, imagem principal, preços, comodidades, fotos e
              vídeos da acomodação.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/acomodacoes/${unit.slug}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--app-primary-strong)]"
              >
                <Eye className="h-4 w-4" />
                Ver página pública
              </Link>

              <Link
                href="/admin/acomodacoes"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-6 text-sm font-bold text-[var(--app-primary)] shadow-sm transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
              >
                Lista de acomodações
              </Link>
            </div>
          </div>
        </div>

        <aside className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="relative h-56 bg-[var(--app-primary-soft)]">
            {unit.cover_image ? (
              <img
                src={unit.cover_image}
                alt={unit.name || "Acomodação"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-10 w-10 text-[var(--app-primary)]/50" />
              </div>
            )}

            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                unit.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {unit.is_active ? "Ativa" : "Inativa"}
            </span>
          </div>

          <div className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
              Resumo
            </p>

            <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
              {unit.name}
            </h3>

            <p className="mt-1 text-xs text-[var(--app-text-muted)]">
              /acomodacoes/{unit.slug}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <p className="text-[var(--app-text-muted)]">Diária</p>
                <p className="mt-1 font-black text-[var(--app-text)]">
                  {formatMoney(unit.base_price)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <p className="text-[var(--app-text-muted)]">Limpeza</p>
                <p className="mt-1 font-black text-[var(--app-text)]">
                  {formatMoney(unit.cleaning_fee)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <p className="text-[var(--app-text-muted)]">Hóspedes</p>
                <p className="mt-1 font-black text-[var(--app-text)]">
                  {formatNumber(unit.max_guests)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <p className="text-[var(--app-text-muted)]">Galeria</p>
                <p className="mt-1 font-black text-[var(--app-text)]">
                  {safeMedia.length} item
                  {safeMedia.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <Users className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Capacidade
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatNumber(unit.max_guests)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <BedDouble className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Quartos
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {formatNumber(unit.bedrooms)}
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--app-border)] bg-white p-5 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
            <ImageIcon className="h-5 w-5" />
          </div>

          <p className="mt-5 text-sm font-medium text-[var(--app-text-soft)]">
            Fotos e vídeos
          </p>

          <p className="mt-1 text-[34px] font-black tracking-[-0.055em] text-[var(--app-text)]">
            {safeMedia.length}
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <AccommodationEditForm unit={unit} />

          <AccommodationMediaManager
            unitId={unit.id}
            unitSlug={unit.slug || ""}
            unitName={unit.name || "Acomodação"}
            media={safeMedia}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-[var(--app-border)] bg-[var(--app-primary)] p-6 text-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)] dark:text-[var(--app-text)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60 dark:text-[var(--app-text-muted)]">
              Dica
            </p>

            <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-white dark:text-[var(--app-text)]">
              Galeria vende mais
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/72 dark:text-[var(--app-text-soft)]">
              Use fotos horizontais, bem iluminadas, e adicione vídeos curtos da
              área externa, quarto, banheiro e vista. Isso aumenta a confiança
              do hóspede.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
              Checklist
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <CheckCircle2 className="h-5 w-5 text-[var(--app-primary)]" />
                <p className="text-sm font-bold text-[var(--app-text)]">
                  Imagem principal cadastrada
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <CheckCircle2 className="h-5 w-5 text-[var(--app-primary)]" />
                <p className="text-sm font-bold text-[var(--app-text)]">
                  Galeria com {safeMedia.length} item
                  {safeMedia.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] p-4">
                <CheckCircle2 className="h-5 w-5 text-[var(--app-primary)]" />
                <p className="text-sm font-bold text-[var(--app-text)]">
                  Preço por noite configurado
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}