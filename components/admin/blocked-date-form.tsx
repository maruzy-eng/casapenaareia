import Link from "next/link";
import { CalendarDays, Save } from "lucide-react";
import {
  createBlockedDate,
  updateBlockedDate,
} from "@/lib/actions/admin/blocked-dates";

export type BlockedDateFormUnit = {
  id: string;
  name: string | null;
};

export type BlockedDateFormValue = {
  id: string;
  unit_id: string | null;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
};

type BlockedDateFormProps = {
  units: BlockedDateFormUnit[];
  blockedDate?: BlockedDateFormValue | null;
  mode?: "create" | "edit";
};

export function BlockedDateForm({
  units,
  blockedDate,
  mode = "create",
}: BlockedDateFormProps) {
  const isEditing = mode === "edit";

  return (
    <form
      id={isEditing ? undefined : "novo-bloqueio"}
      action={isEditing ? updateBlockedDate : createBlockedDate}
      className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[var(--app-shadow-soft)]"
    >
      {isEditing ? <input type="hidden" name="id" value={blockedDate?.id} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--admin-text)]">
              {isEditing ? "Editar bloqueio" : "Novo bloqueio"}
            </h2>

            <p className="text-sm text-[var(--admin-muted)]">
              Reserve um período indisponível para uma acomodação.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr_1.4fr]">
        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
            Acomodação *
          </span>

          <select
            name="unit_id"
            required
            defaultValue={blockedDate?.unit_id || ""}
            className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
          >
            <option value="">Selecione</option>

            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name || "Acomodação"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
            Data inicial *
          </span>

          <input
            type="date"
            name="start_date"
            required
            defaultValue={blockedDate?.start_date || ""}
            className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
            Data final *
          </span>

          <input
            type="date"
            name="end_date"
            required
            defaultValue={blockedDate?.end_date || ""}
            className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
            Motivo *
          </span>

          <input
            name="reason"
            required
            defaultValue={blockedDate?.reason || ""}
            placeholder="Manutenção, obra, uso interno..."
            className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-bold text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)] focus:border-[var(--app-primary)]"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        {isEditing ? (
          <Link
            href="/admin/bloqueios"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
          >
            Cancelar
          </Link>
        ) : null}

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:opacity-90"
          style={{ color: "#ffffff" }}
        >
          <Save className="h-4 w-4" />
          {isEditing ? "Salvar alterações" : "Criar bloqueio"}
        </button>
      </div>
    </form>
  );
}
