import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  DollarSign,
  ImageIcon,
  LinkIcon,
  Plus,
  ToggleRight,
  Upload,
  Users,
} from "lucide-react";
import { createAccommodation } from "@/lib/actions/admin/accommodations";

export default async function NewAccommodationPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/admin/acomodacoes"
              className="inline-flex items-center gap-2 text-sm text-stone-600 transition hover:text-stone-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para acomodações
            </Link>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
              Nova acomodação
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Cadastre uma nova suíte, quarto ou unidade disponível para reserva.
            </p>
          </div>

          <Link
            href="/admin/dashboard"
            className="inline-flex rounded-2xl bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <form
          action={createAccommodation}
          className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-500">
              Cadastro
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              Dados da acomodação
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              Depois de salvar, a acomodação aparecerá na lista do admin e, se
              estiver ativa, também na busca pública.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Nome da acomodação *
              </span>

              <input
                name="name"
                required
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="Suíte Jardim"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <LinkIcon className="h-4 w-4" />
                Slug
              </span>

              <input
                name="slug"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="suite-jardim"
              />

              <span className="mt-2 block text-xs text-stone-500">
                Se deixar vazio, o sistema cria automaticamente a partir do nome.
              </span>
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Descrição
            </span>

            <textarea
              name="description"
              rows={6}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400"
              placeholder="Descreva a acomodação..."
            />
          </label>

          <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-stone-950">
              <ImageIcon className="h-4 w-4" />
              Imagem principal
            </div>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Envie uma imagem principal para aparecer nos cards, na página
              pública da acomodação e no admin.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <Upload className="h-4 w-4" />
                Enviar imagem
              </span>

              <input
                name="cover_image_file"
                type="file"
                accept="image/*"
                className="block w-full cursor-pointer rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-800"
              />

              <span className="mt-2 block text-xs text-stone-500">
                JPG, PNG, WEBP ou GIF. Tamanho máximo: 10MB.
              </span>
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Ou cole uma URL manual
              </span>

              <input
                name="cover_image"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
                placeholder="https://..."
              />

              <span className="mt-2 block text-xs text-stone-500">
                Se você enviar uma imagem, o upload será usado no lugar da URL.
              </span>
            </label>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <Users className="h-4 w-4" />
                Máx. hóspedes
              </span>

              <input
                name="max_guests"
                type="number"
                min="1"
                step="1"
                defaultValue={2}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <BedDouble className="h-4 w-4" />
                Quartos
              </span>

              <input
                name="bedrooms"
                type="number"
                min="0"
                step="1"
                defaultValue={1}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <Bath className="h-4 w-4" />
                Banheiros
              </span>

              <input
                name="bathrooms"
                type="number"
                min="0"
                step="0.5"
                defaultValue={1}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
              />

              <span className="mt-2 block text-xs text-stone-500">
                Pode usar número decimal, exemplo: 1,5.
              </span>
            </label>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <DollarSign className="h-4 w-4" />
                Preço por noite
              </span>

              <input
                name="base_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={0}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                <DollarSign className="h-4 w-4" />
                Taxa de limpeza
              </span>

              <input
                name="cleaning_fee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={0}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none transition focus:border-stone-400"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Comodidades
            </span>

            <textarea
              name="amenities"
              rows={4}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400"
              placeholder="Wi-Fi, Ar-condicionado, Banheiro privativo"
            />

            <span className="mt-2 block text-xs text-stone-500">
              Separe cada comodidade por vírgula.
            </span>
          </label>

          <label className="mt-6 flex items-center justify-between gap-4 rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <span>
              <span className="flex items-center gap-2 text-sm font-medium text-stone-950">
                <ToggleRight className="h-4 w-4" />
                Acomodação ativa
              </span>

              <span className="mt-1 block text-sm text-stone-500">
                Quando ativa, aparece na busca pública de acomodações.
              </span>
            </span>

            <input
              name="is_active"
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-stone-300"
            />
          </label>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Criar acomodação
            </button>

            <Link
              href="/admin/acomodacoes"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-stone-200 bg-white px-6 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
            >
              Cancelar
            </Link>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-stone-950">
              Dica de cadastro
            </h3>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              Use nomes claros como “Suíte Jardim”, “Suíte Família” ou “Casa
              Completa”. Isso ajuda o hóspede a entender rapidamente o tipo de
              acomodação.
            </p>
          </div>

          <div className="rounded-[2rem] border border-green-200 bg-green-50 p-6">
            <h3 className="font-semibold text-green-950">
              Imagem principal
            </h3>

            <p className="mt-2 text-sm leading-6 text-green-800">
              A imagem enviada será salva no Supabase Storage e usada
              automaticamente como capa da acomodação.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
            <h3 className="font-semibold text-amber-950">
              Galeria de fotos e vídeos
            </h3>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              A galeria completa fica disponível depois de criar a acomodação,
              na tela de edição. Isso acontece porque a galeria precisa do ID da
              acomodação já criada.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}