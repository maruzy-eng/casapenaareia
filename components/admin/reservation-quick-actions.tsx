"use client";

import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  cancelReservation,
  confirmReservation,
  markReservationAsAwaitingPayment,
  markReservationAsPaid,
  markReservationCheckIn,
  markReservationCheckOut,
} from "@/lib/actions/admin/reservations";

type ReservationQuickActionsProps = {
  reservationId: string;
};

export function ReservationQuickActions({
  reservationId,
}: ReservationQuickActionsProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  return (
    <>
      <aside className="rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
          Ações rápidas
        </p>

        <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
          Atualizar reserva
        </h3>

        <div className="mt-6 grid gap-2">
          <form action={confirmReservation}>
            <input type="hidden" name="id" value={reservationId} />

            <button
              type="submit"
              className="admin-btn-primary min-h-12 w-full px-4 text-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar
            </button>
          </form>

          <form action={markReservationAsAwaitingPayment}>
            <input type="hidden" name="id" value={reservationId} />

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-4 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)]"
            >
              <Clock3 className="h-4 w-4" />
              Aguardando pagamento
            </button>
          </form>

          <form action={markReservationAsPaid}>
            <input type="hidden" name="id" value={reservationId} />

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-4 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)]"
            >
              <CreditCard className="h-4 w-4" />
              Marcar como pago
            </button>
          </form>

          <form action={markReservationCheckIn}>
            <input type="hidden" name="id" value={reservationId} />

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-4 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)]"
            >
              <ShieldCheck className="h-4 w-4" />
              Check-in feito
            </button>
          </form>

          <form action={markReservationCheckOut}>
            <input type="hidden" name="id" value={reservationId} />

            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-4 text-sm font-bold text-[var(--app-text)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)]"
            >
              <CalendarCheck className="h-4 w-4" />
              Check-out feito
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="admin-btn-danger min-h-12 w-full px-4 text-sm"
          >
            <XCircle className="h-4 w-4" />
            Cancelar reserva
          </button>
        </div>
      </aside>

      {isCancelModalOpen ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-2xl dark:bg-[var(--app-card)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300">
                <XCircle className="h-6 w-6" />
              </div>

              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--app-border)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-card-soft)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
              Cancelar reserva?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--app-text-soft)]">
              Tem certeza que deseja cancelar esta reserva? Essa ação vai mudar
              o status para <strong>Cancelada</strong>.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-5 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
              >
                Voltar
              </button>

              <form action={cancelReservation} className="flex-1">
                <input type="hidden" name="id" value={reservationId} />

                <button
                  type="submit"
                  className="admin-btn-danger min-h-12 w-full px-5 text-sm"
                >
                  Sim, cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}