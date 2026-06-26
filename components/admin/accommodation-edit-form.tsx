"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  Bath,
  BedDouble,
  DollarSign,
  ImageIcon,
  LinkIcon,
  Save,
  ToggleRight,
  Upload,
  Users,
} from "lucide-react";
import {
  updateAccommodation,
  type AccommodationActionState,
} from "@/lib/actions/admin/accommodations";

type AccommodationEditFormProps = {
  unit: {
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
    amenities: string[] | null;
    is_active: boolean | null;
  };
};

const initialState: AccommodationActionState = {
  success: false,
  message: "",
};

function FieldLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--app-text)]">
      {icon}
      {children}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5";

const textareaClass =
  "w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm leading-6 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5";

export function AccommodationEditForm({ unit }: AccommodationEditFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    updateAccommodation,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.push("/admin/acomodacoes?updated=1");
      router.refresh();
    }
  }, [state.success, router]);

  const amenitiesText = Array.isArray(unit.amenities)
    ? unit.amenities.join(", ")
    : "";

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]"
    >
      <input type="hidden" name="id" value={unit.id} />

      <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-6 md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
          Dados principais
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
          Informações da acomodação
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-soft)]">
          Edite nome, URL, descrição, imagem principal, capacidade, preços e
          comodidades.
        </p>
      </div>

      <div className="p-6 md:p-8">
        {state.message && !state.success ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {state.message}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <FieldLabel>Nome da acomodação *</FieldLabel>

            <input
              name="name"
              required
              defaultValue={unit.name || ""}
              className={inputClass}
              placeholder="Suíte Jardim"
            />
          </label>

          <label className="block">
            <FieldLabel icon={<LinkIcon className="h-4 w-4" />}>Slug</FieldLabel>

            <input
              name="slug"
              defaultValue={unit.slug || ""}
              className={inputClass}
              placeholder="suite-jardim"
            />

            <span className="mt-2 block text-xs text-[var(--app-text-muted)]">
              Usado na URL pública da acomodação.
            </span>
          </label>
        </div>

        <label className="mt-5 block">
          <FieldLabel>Descrição</FieldLabel>

          <textarea
            name="description"
            rows={6}
            defaultValue={unit.description || ""}
            className={textareaClass}
            placeholder="Descreva a acomodação..."
          />
        </label>

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-card-soft)]">
          <div className="border-b border-[var(--app-border)] px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-black text-[var(--app-text)]">
              <ImageIcon className="h-4 w-4 text-[var(--app-primary)]" />
              Imagem principal
            </div>

            <p className="mt-1 text-xs leading-5 text-[var(--app-text-soft)]">
              Essa imagem aparece nos cards, no detalhe público e no resumo do
              admin.
            </p>
          </div>

          <div className="p-5">
            {unit.cover_image ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-[var(--app-border)] bg-white dark:bg-white/5">
                <img
                  src={unit.cover_image}
                  alt={unit.name || "Imagem da acomodação"}
                  className="h-64 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--app-border-strong)] bg-white text-sm font-medium text-[var(--app-text-muted)] dark:bg-white/5">
                Nenhuma imagem cadastrada.
              </div>
            )}

            <label className="mt-5 block">
              <FieldLabel icon={<Upload className="h-4 w-4" />}>
                Enviar nova imagem
              </FieldLabel>

              <input
                name="cover_image_file"
                type="file"
                accept="image/*"
                className="block w-full cursor-pointer rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm text-[var(--app-text-soft)] outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--app-primary)] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[var(--app-primary-strong)] dark:bg-white/5"
              />

              <span className="mt-2 block text-xs text-[var(--app-text-muted)]">
                JPG, PNG, WEBP ou GIF. Tamanho máximo recomendado: 10MB.
              </span>
            </label>

            <label className="mt-5 block">
              <FieldLabel>Ou manter/colar URL manual</FieldLabel>

              <input
                name="cover_image"
                defaultValue={unit.cover_image || ""}
                className={inputClass}
                placeholder="https://..."
              />

              <span className="mt-2 block text-xs text-[var(--app-text-muted)]">
                Se você enviar uma nova imagem, ela substitui essa URL.
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <label className="block">
            <FieldLabel icon={<Users className="h-4 w-4" />}>
              Máx. hóspedes
            </FieldLabel>

            <input
              name="max_guests"
              type="number"
              min="1"
              step="1"
              defaultValue={unit.max_guests || 1}
              className={inputClass}
            />
          </label>

          <label className="block">
            <FieldLabel icon={<BedDouble className="h-4 w-4" />}>
              Quartos
            </FieldLabel>

            <input
              name="bedrooms"
              type="number"
              min="0"
              step="1"
              defaultValue={unit.bedrooms || 1}
              className={inputClass}
            />
          </label>

          <label className="block">
            <FieldLabel icon={<Bath className="h-4 w-4" />}>
              Banheiros
            </FieldLabel>

            <input
              name="bathrooms"
              type="number"
              min="0"
              step="0.5"
              defaultValue={unit.bathrooms || 1}
              className={inputClass}
            />

            <span className="mt-2 block text-xs text-[var(--app-text-muted)]">
              Pode usar número decimal, exemplo: 1,5.
            </span>
          </label>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <FieldLabel icon={<DollarSign className="h-4 w-4" />}>
              Preço por noite
            </FieldLabel>

            <input
              name="base_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={unit.base_price || 0}
              className={inputClass}
            />
          </label>

          <label className="block">
            <FieldLabel icon={<DollarSign className="h-4 w-4" />}>
              Taxa de limpeza
            </FieldLabel>

            <input
              name="cleaning_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={unit.cleaning_fee || 0}
              className={inputClass}
            />
          </label>
        </div>

        <label className="mt-5 block">
          <FieldLabel>Comodidades</FieldLabel>

          <textarea
            name="amenities"
            rows={4}
            defaultValue={amenitiesText}
            className={textareaClass}
            placeholder="Wi-Fi, Ar-condicionado, Banheiro privativo"
          />

          <span className="mt-2 block text-xs text-[var(--app-text-muted)]">
            Separe cada comodidade por vírgula.
          </span>
        </label>

        <label className="mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5">
          <span>
            <span className="flex items-center gap-2 text-sm font-black text-[var(--app-text)]">
              <ToggleRight className="h-4 w-4 text-[var(--app-primary)]" />
              Acomodação ativa
            </span>

            <span className="mt-1 block text-sm leading-6 text-[var(--app-text-soft)]">
              Quando ativa, aparece na busca pública de acomodações.
            </span>
          </span>

          <input
            name="is_active"
            type="checkbox"
            defaultChecked={Boolean(unit.is_active)}
            className="h-5 w-5 rounded border-[var(--app-border)] accent-[var(--app-primary)]"
          />
        </label>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Salvando..." : "Salvar alterações"}
          </button>

          <Link
            href="/admin/acomodacoes"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-6 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  );
}