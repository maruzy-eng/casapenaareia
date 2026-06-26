"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  LockKeyhole,
  X,
} from "lucide-react";

type CalendarUnit = {
  id: string;
  name: string | null;
};

type CalendarEventItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "reservation" | "blocked";
  status: string;
  payment_status?: string | null;
  unit_id: string | null;
  unit_name: string | null;
  guest_name?: string | null;
  guests_count?: number | string | null;
  nights?: number | string | null;
  total?: number | string | null;
  source?: string | null;
  url?: string;
};

type ReservationFullCalendarProps = {
  units: CalendarUnit[];
  events: CalendarEventItem[];
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function getStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    awaiting_payment: "Aguardando pagamento",
    confirmed: "Confirmada",
    checked_in: "Check-in feito",
    checked_out: "Check-out feito",
    cancelled: "Cancelada",
    blocked: "Bloqueado",
  };

  return labels[String(status || "")] || "Pendente";
}

function getPaymentLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    refunded: "Reembolsado",
    failed: "Falhou",
  };

  return labels[String(status || "")] || "Pendente";

}

function getSourceLabel(source: string | null | undefined) {
  const labels: Record<string, string> = {
    manual: "Manual",
    site: "Site",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    booking: "Booking",
    airbnb: "Airbnb",
    international_site: "Site internacional",
  };

  return labels[String(source || "")] || source || "Não informado";
}

function getEventColors(event: CalendarEventItem) {
  if (event.type === "blocked") {
    return {
      backgroundColor: "#475569",
      borderColor: "#475569",
      textColor: "#ffffff",
    };
  }

  const colors: Record<
    string,
    {
      backgroundColor: string;
      borderColor: string;
      textColor: string;
    }
  > = {
    pending: {
      backgroundColor: "#f59e0b",
      borderColor: "#f59e0b",
      textColor: "#ffffff",
    },
    awaiting_payment: {
      backgroundColor: "#0ea5e9",
      borderColor: "#0ea5e9",
      textColor: "#ffffff",
    },
    confirmed: {
      backgroundColor: "#0b5963",
      borderColor: "#0b5963",
      textColor: "#ffffff",
    },
    checked_in: {
      backgroundColor: "#0f766e",
      borderColor: "#0f766e",
      textColor: "#ffffff",
    },
    checked_out: {
      backgroundColor: "#64748b",
      borderColor: "#64748b",
      textColor: "#ffffff",
    },
    cancelled: {
      backgroundColor: "#e11d48",
      borderColor: "#e11d48",
      textColor: "#ffffff",
    },
  };

  return colors[event.status] || colors.pending;
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-black text-[var(--admin-text)]">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function ReservationFullCalendar({
  units,
  events,
}: ReservationFullCalendarProps) {
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEventItem | null>(null);

  const filteredEvents = useMemo(() => {
    const filtered =
      selectedUnit === "all"
        ? events
        : events.filter((event) => event.unit_id === selectedUnit);

    return filtered.map((event) => {
      const colors = getEventColors(event);

      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: true,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        extendedProps: event,
      };
    });
  }, [events, selectedUnit]);

  const stats = useMemo(() => {
    const reservationEvents = events.filter(
      (event) => event.type === "reservation" && event.status !== "cancelled"
    );

    const blockedEvents = events.filter((event) => event.type === "blocked");

    const confirmedEvents = events.filter(
      (event) => event.status === "confirmed" || event.status === "checked_in"
    );

    const pendingEvents = events.filter(
      (event) =>
        event.status === "pending" || event.status === "awaiting_payment"
    );

    return {
      reservations: reservationEvents.length,
      blocked: blockedEvents.length,
      confirmed: confirmedEvents.length,
      pending: pendingEvents.length,
    };
  }, [events]);

  return (
    <section className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <CalendarDays className="h-7 w-7 text-[var(--app-primary)]" />
          <p className="mt-4 text-sm font-bold text-[var(--admin-muted)]">
            Reservas no calendário
          </p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {stats.reservations}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          <p className="mt-4 text-sm font-bold text-[var(--admin-muted)]">
            Confirmadas
          </p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {stats.confirmed}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <Clock3 className="h-7 w-7 text-amber-600" />
          <p className="mt-4 text-sm font-bold text-[var(--admin-muted)]">
            Pendentes
          </p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {stats.pending}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <LockKeyhole className="h-7 w-7 text-[var(--admin-text)]" />
          <p className="mt-4 text-sm font-bold text-[var(--admin-muted)]">
            Bloqueios
          </p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
            {stats.blocked}
          </p>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary)] text-white">
                <Filter className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black tracking-[-0.04em] text-[var(--admin-text)]">
                  Filtros do calendário
                </h2>

                <p className="text-xs text-[var(--admin-muted)]">
                  Filtre a agenda por acomodação ou visualize todas.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[260px_auto]">
            <select
              value={selectedUnit}
              onChange={(event) => setSelectedUnit(event.target.value)}
              className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-black text-[var(--admin-text)] outline-none focus:border-[var(--app-primary)]"
            >
              <option value="all">Todas as acomodações</option>

              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name || "Acomodação"}
                </option>
              ))}
            </select>

            <Link
              href="/admin/mapa-reservas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:opacity-90"
              style={{
                backgroundColor: "var(--app-primary)",
                color: "#ffffff",
              }}
            >
              Ver mapa
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <LegendItem color="#0b5963" label="Confirmada" />
          <LegendItem color="#0f766e" label="Check-in" />
          <LegendItem color="#0ea5e9" label="Aguardando pagamento" />
          <LegendItem color="#f59e0b" label="Pendente" />
          <LegendItem color="#64748b" label="Check-out / Finalizada" />
          <LegendItem color="#475569" label="Bloqueio" />
          <LegendItem color="#e11d48" label="Cancelada" />
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
        <div className="admin-fullcalendar p-4 md:p-5">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin,
            ]}
            locales={[ptBrLocale]}
            locale="pt-br"
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,listWeek",
            }}
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              list: "Lista",
            }}
            height="auto"
            events={filteredEvents}
            eventClick={(info) => {
              info.jsEvent.preventDefault();

              const event = info.event.extendedProps as CalendarEventItem;

              setSelectedEvent(event);
            }}
            eventDisplay="block"
            dayMaxEventRows={3}
            moreLinkText={(count) => `+${count} reservas`}
            nowIndicator
          />
        </div>
      </section>

      {selectedEvent ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)] px-6 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{
                    backgroundColor: getEventColors(selectedEvent)
                      .backgroundColor,
                  }}
                >
                  {selectedEvent.type === "blocked" ? (
                    <LockKeyhole className="h-5 w-5" />
                  ) : (
                    <BedDouble className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                    {selectedEvent.title}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {selectedEvent.unit_name || "Acomodação"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[var(--admin-surface-soft)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                    Período
                  </p>

                  <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                    {formatDate(selectedEvent.start)} até{" "}
                    {formatDate(selectedEvent.end)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--admin-surface-soft)] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                    Status
                  </p>

                  <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                    {getStatusLabel(selectedEvent.status)}
                  </p>
                </div>

                {selectedEvent.type === "reservation" ? (
                  <>
                    <div className="rounded-2xl bg-[var(--admin-surface-soft)] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                        Hóspede
                      </p>

                      <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                        {selectedEvent.guest_name || "Hóspede"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--admin-surface-soft)] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                        Pagamento
                      </p>

                      <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                        {getPaymentLabel(selectedEvent.payment_status)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--admin-surface-soft)] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                        Total
                      </p>

                      <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                        {formatMoney(selectedEvent.total)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--admin-surface-soft)] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--admin-muted)]">
                        Origem
                      </p>

                      <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                        {getSourceLabel(selectedEvent.source)}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-black text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-soft)]"
                >
                  Fechar
                </button>

                {selectedEvent.url ? (
                  <Link
                    href={selectedEvent.url}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:opacity-90"
                    style={{
                      backgroundColor: "var(--app-primary)",
                      color: "#ffffff",
                    }}
                  >
                    Abrir reserva
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .admin-fullcalendar .fc {
          font-family: inherit;
          color: var(--app-text);
        }

        .admin-fullcalendar .fc .fc-toolbar {
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .admin-fullcalendar .fc .fc-toolbar-title {
          font-size: 24px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.055em;
          color: var(--admin-text);
          text-transform: capitalize;
        }

        .admin-fullcalendar .fc .fc-button {
          border: 1px solid var(--admin-border);
          border-radius: 14px;
          background: var(--admin-surface);
          color: var(--admin-text);
          box-shadow: none;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 900;
          text-transform: capitalize;
          transition: 0.2s ease;
        }

        .admin-fullcalendar .fc .fc-button:hover,
        .admin-fullcalendar .fc .fc-button:focus {
          border-color: var(--app-primary);
          background: var(--app-primary-soft);
          color: var(--app-primary);
          box-shadow: none;
        }

        .admin-fullcalendar .fc .fc-button-primary:not(:disabled).fc-button-active,
        .admin-fullcalendar .fc .fc-button-primary:not(:disabled):active {
          border-color: var(--app-primary);
          background: var(--app-primary);
          color: #ffffff;
          box-shadow: none;
        }

        .admin-fullcalendar .fc .fc-col-header-cell {
          background: var(--admin-surface-soft);
          border-color: var(--admin-border);
          padding: 10px 0;
        }

        .admin-fullcalendar .fc .fc-col-header-cell-cushion {
          color: var(--admin-muted-2);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
        }

        .admin-fullcalendar .fc .fc-daygrid-day,
        .admin-fullcalendar .fc .fc-scrollgrid,
        .admin-fullcalendar .fc .fc-scrollgrid-section > *,
        .admin-fullcalendar .fc .fc-timegrid-slot,
        .admin-fullcalendar .fc .fc-list,
        .admin-fullcalendar .fc .fc-list-table td,
        .admin-fullcalendar .fc .fc-list-day-cushion {
          border-color: var(--admin-border);
        }

        .admin-fullcalendar .fc .fc-daygrid-day-number {
          padding: 10px;
          color: var(--admin-text);
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
        }

        .admin-fullcalendar .fc .fc-day-today {
          background: rgba(11, 89, 99, 0.06) !important;
        }

        .admin-fullcalendar .fc .fc-event {
          border-radius: 12px;
          border: none;
          padding: 3px 6px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(7, 52, 59, 0.08);
        }

        .admin-fullcalendar .fc .fc-event-title {
          font-weight: 900;
        }

        .admin-fullcalendar .fc .fc-list-event-title,
        .admin-fullcalendar .fc .fc-list-event-time {
          font-size: 13px;
          font-weight: 800;
        }

        .admin-fullcalendar .fc .fc-list-day-cushion {
          background: var(--admin-surface-soft);
          color: var(--admin-text);
          font-weight: 900;
          text-transform: capitalize;
        }

        @media (max-width: 768px) {
          .admin-fullcalendar .fc .fc-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .admin-fullcalendar .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }

          .admin-fullcalendar .fc .fc-toolbar-title {
            font-size: 20px;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
