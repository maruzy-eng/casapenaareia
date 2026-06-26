export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlockedDateForm } from "@/components/admin/blocked-date-form";

type EditBlockedDatePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

type UnitItem = {
  id: string;
  name: string | null;
};

type BlockedDateItem = {
  id: string;
  unit_id: string | null;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
};

function getMessage(message: string) {
  const messages: Record<string, string> = {
    missing_fields: "Preencha acomodação, datas e motivo.",
    invalid_dates: "Informe datas válidas.",
    invalid_period: "A data final precisa ser maior que a data inicial.",
    reservation_conflict:
      "Não foi possível salvar: já existe reserva ativa nesse período.",
    block_conflict:
      "Não foi possível salvar: já existe outro bloqueio nesse período.",
    error: "Não foi possível salvar o bloqueio. Tente novamente.",
  };

  return messages[message] || "";
}

export default async function EditBlockedDatePage({
  params,
  searchParams,
}: EditBlockedDatePageProps) {
  const { id } = await params;
  const { message = "" } = await searchParams;

  const supabase = createAdminClient();

  const [unitsResult, blockedDateResult] = await Promise.all([
    supabase
      .from("units")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("blocked_dates")
      .select("id, unit_id, start_date, end_date, reason")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (unitsResult.error) {
    throw new Error(unitsResult.error.message);
  }

  if (blockedDateResult.error) {
    throw new Error(blockedDateResult.error.message);
  }

  if (!blockedDateResult.data) {
    notFound();
  }

  const units = (unitsResult.data || []) as UnitItem[];
  const blockedDate = blockedDateResult.data as BlockedDateItem;
  const notice = getMessage(String(message || ""));

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--app-shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
                <LockKeyhole className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
                  Editar bloqueio
                </h1>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">
                  Ajuste acomodação, período e motivo do bloqueio.
                </p>
              </div>
            </div>

            <Link
              href="/admin/bloqueios"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </section>

        {notice ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {notice}
          </div>
        ) : null}

        <BlockedDateForm units={units} blockedDate={blockedDate} mode="edit" />
      </div>
    </main>
  );
}
