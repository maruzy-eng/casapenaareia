"use client";

import {
  Activity,
  Check,
  ChevronDown,
  Edit3,
  ExternalLink,
  Globe2,
  PlugZap,
  Plus,
  Power,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Webhook,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  createAutomationWebhookAction,
  deleteAutomationWebhookAction,
  testAutomationWebhookAction,
  toggleAutomationWebhookAction,
  updateAutomationWebhookAction,
} from "@/lib/actions/admin/automation-webhooks";

import type { AutomationWebhookItem } from "@/app/admin/automacoes/page";

type AutomationWebhooksClientProps = {
  initialWebhooks: AutomationWebhookItem[];
};

type FormState = {
  id?: string;
  name: string;
  event_key: string;
  webhook_url: string;
  description: string;
  headers_json: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: "",
  event_key: "payment_confirmed",
  webhook_url: "",
  description: "",
  headers_json: "{\n  \"Authorization\": \"Bearer SEU_TOKEN_AQUI\"\n}",
  is_active: true,
};

const eventLabels: Record<string, string> = {
  payment_confirmed: "Pagamento confirmado",
  checkin_completed: "Check-in feito",
  checkout_completed: "Checkout feito",
  reservation_created: "Reserva criada",
  reservation_cancelled: "Reserva cancelada",
};

const eventDescriptions: Record<string, string> = {
  payment_confirmed:
    "Dispara quando o pagamento de uma reserva for confirmado.",
  checkin_completed:
    "Dispara quando o check-in do hóspede for marcado como feito.",
  checkout_completed:
    "Dispara quando o checkout do hóspede for marcado como feito.",
  reservation_created:
    "Dispara quando uma nova reserva for criada no sistema.",
  reservation_cancelled:
    "Dispara quando uma reserva for cancelada.",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function maskUrl(value: string) {
  try {
    const url = new URL(value);

    return `${url.origin}${url.pathname}`;
  } catch {
    return value;
  }
}

function buildFormFromWebhook(webhook: AutomationWebhookItem): FormState {
  return {
    id: webhook.id,
    name: webhook.name || "",
    event_key: webhook.event_key || "payment_confirmed",
    webhook_url: webhook.webhook_url || "",
    description: webhook.description || "",
    headers_json: JSON.stringify(webhook.headers_json || {}, null, 2),
    is_active: Boolean(webhook.is_active),
  };
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(7,52,59,0.05)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-[var(--admin-muted)]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-[var(--admin-text)]">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-[var(--admin-muted-2)]">
        {description}
      </p>
    </article>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
        {label}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted-2)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
      />
    </label>
  );
}

function AutomationModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  if (!open) return null;

  function updateForm<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">
              Automação
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
              {form.id ? "Editar webhook" : "Novo webhook"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
              Configure webhooks para pagamentos, check-in e checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome da automação"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
              placeholder="Ex: Enviar WhatsApp no pagamento"
              required
            />

            <SelectField
              label="Evento"
              value={form.event_key}
              onChange={(value) => updateForm("event_key", value)}
            >
              <option value="payment_confirmed">
                Pagamento confirmado
              </option>
              <option value="checkin_completed">Check-in feito</option>
              <option value="checkout_completed">
                Checkout feito
              </option>
              <option value="reservation_created">
                Reserva criada
              </option>
              <option value="reservation_cancelled">
                Reserva cancelada
              </option>
            </SelectField>
          </div>

          <TextField
            label="URL do webhook"
            value={form.webhook_url}
            onChange={(value) => updateForm("webhook_url", value)}
            placeholder="https://..."
            type="url"
            required
          />

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Descrição
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              rows={3}
              placeholder="Explique o que essa automação faz."
              className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm font-medium text-[var(--admin-text)] outline-none transition placeholder:text-[var(--admin-muted-2)] focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
              Headers JSON
            </span>

            <textarea
              value={form.headers_json}
              onChange={(event) =>
                updateForm("headers_json", event.target.value)
              }
              rows={7}
              spellCheck={false}
              className="rounded-2xl border border-[var(--admin-border)] bg-[#071e23] px-4 py-3 font-mono text-sm leading-7 text-[#e8fbff] outline-none transition placeholder:text-white/30 focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              placeholder='{"Authorization":"Bearer token"}'
            />
          </label>

          <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
            <p className="text-sm font-black text-[var(--admin-text)]">
              Payload enviado no webhook
            </p>

            <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#071e23] p-4 text-xs leading-6 text-[#e8fbff]">
{`{
  "event": "${form.event_key}",
  "triggered_at": "2026-12-29T10:00:00.000Z",
  "reservation": {
    "id": "reservation_id",
    "guest_name": "Maria Silva",
    "guest_email": "maria@email.com",
    "unit_name": "Suíte Jardim",
    "check_in": "2026-12-29",
    "check_out": "2027-01-02",
    "total": 2480,
    "payment_status": "paid",
    "status": "confirmed"
  }
}`}
            </pre>
          </div>

          <button
            type="button"
            onClick={() =>
              updateForm("is_active", !form.is_active)
            }
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition ${
              form.is_active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/45"
            }`}
          >
            <Power className="h-4 w-4" />
            {form.is_active ? "Automação ativa" : "Automação inativa"}
          </button>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--admin-border)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 text-sm font-bold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Salvar webhook
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AutomationWebhooksClient({
  initialWebhooks,
}: AutomationWebhooksClientProps) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const active = webhooks.filter((item) => item.is_active).length;

    const failed = webhooks.filter(
      (item) => item.last_status === "failed"
    ).length;

    return {
      total: webhooks.length,
      active,
      inactive: webhooks.length - active,
      failed,
    };
  }, [webhooks]);

  const filteredWebhooks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return webhooks.filter((webhook) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          webhook.name,
          webhook.event_key,
          webhook.webhook_url,
          webhook.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesEvent =
        eventFilter === "all" || webhook.event_key === eventFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && webhook.is_active) ||
        (statusFilter === "inactive" && !webhook.is_active) ||
        (statusFilter === "failed" &&
          webhook.last_status === "failed");

      return matchesSearch && matchesEvent && matchesStatus;
    });
  }, [webhooks, search, eventFilter, statusFilter]);

  function openCreateModal() {
    setForm(emptyForm);
    setModalOpen(true);
    setMessage("");
    setErrorMessage("");
  }

  function openEditModal(webhook: AutomationWebhookItem) {
    setForm(buildFormFromWebhook(webhook));
    setModalOpen(true);
    setMessage("");
    setErrorMessage("");
  }

  function closeModal() {
    if (isPending) return;

    setModalOpen(false);
    setForm(emptyForm);
  }

  function saveWebhook() {
    setMessage("");
    setErrorMessage("");

    startTransition(async () => {
      try {
        if (form.id) {
          await updateAutomationWebhookAction(form);
        } else {
          await createAutomationWebhookAction(form);
        }

        setMessage("Automação salva com sucesso.");
        window.location.reload();
      } catch (error) {
        const errorText =
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a automação.";

        setErrorMessage(errorText);
      }
    });
  }

  function toggleWebhook(webhook: AutomationWebhookItem) {
    setMessage("");
    setErrorMessage("");

    startTransition(async () => {
      try {
        await toggleAutomationWebhookAction(
          webhook.id,
          !webhook.is_active
        );

        setWebhooks((current) =>
          current.map((item) =>
            item.id === webhook.id
              ? {
                  ...item,
                  is_active: !item.is_active,
                }
              : item
          )
        );
      } catch (error) {
        const errorText =
          error instanceof Error
            ? error.message
            : "Não foi possível alterar o status.";

        setErrorMessage(errorText);
      }
    });
  }

  function deleteWebhook(webhook: AutomationWebhookItem) {
    const confirmed = window.confirm(
      `Deseja excluir a automação "${webhook.name}"?`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    startTransition(async () => {
      try {
        await deleteAutomationWebhookAction(webhook.id);

        setWebhooks((current) =>
          current.filter((item) => item.id !== webhook.id)
        );

        setMessage("Automação excluída com sucesso.");
      } catch (error) {
        const errorText =
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a automação.";

        setErrorMessage(errorText);
      }
    });
  }

  function testWebhook(webhook: AutomationWebhookItem) {
    setMessage("");
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = await testAutomationWebhookAction({
          webhookId: webhook.id,
        });

        setMessage(
          `Webhook testado com sucesso. Status ${result.statusCode || 200}.`
        );

        window.location.reload();
      } catch (error) {
        const errorText =
          error instanceof Error
            ? error.message
            : "Não foi possível testar o webhook.";

        setErrorMessage(errorText);

        window.location.reload();
      }
    });
  }

  function clearFilters() {
    setSearch("");
    setEventFilter("all");
    setStatusFilter("all");
  }

  const hasFilters =
    Boolean(search) || eventFilter !== "all" || statusFilter !== "all";

  return (
    <main className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Webhook className="h-5 w-5" />}
          label="Webhooks"
          value={metrics.total}
          description="Automações cadastradas"
        />

        <MetricCard
          icon={<Power className="h-5 w-5" />}
          label="Ativas"
          value={metrics.active}
          description="Disparam nos eventos configurados"
        />

        <MetricCard
          icon={<Activity className="h-5 w-5" />}
          label="Inativas"
          value={metrics.inactive}
          description="Pausadas temporariamente"
        />

        <MetricCard
          icon={<PlugZap className="h-5 w-5" />}
          label="Falhas"
          value={metrics.failed}
          description="Últimos testes ou envios com erro"
        />
      </section>

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[var(--admin-border)] p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
              Automações por webhook
            </h2>

            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Conecte pagamentos, check-in e checkout com ferramentas externas.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)]"
          >
            <Plus className="h-4 w-4" />
            Novo webhook
          </button>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]">
            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 transition focus-within:border-[var(--app-primary)] focus-within:ring-4 focus-within:ring-[var(--app-primary)]/10">
              <Search className="h-5 w-5 shrink-0 text-[var(--admin-muted-2)]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, evento ou URL..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted-2)]"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="relative">
              <select
                value={eventFilter}
                onChange={(event) => setEventFilter(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold text-[var(--admin-text)] outline-none"
              >
                <option value="all">Todos os eventos</option>
                <option value="payment_confirmed">
                  Pagamento confirmado
                </option>
                <option value="checkin_completed">Check-in feito</option>
                <option value="checkout_completed">Checkout feito</option>
                <option value="reservation_created">Reserva criada</option>
                <option value="reservation_cancelled">
                  Reserva cancelada
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 pr-10 text-sm font-semibold text-[var(--admin-text)] outline-none"
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
                <option value="failed">Com falha</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            {filteredWebhooks.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-10 text-center">
                <Webhook className="mx-auto h-12 w-12 text-[var(--app-primary)]" />

                <h3 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
                  Nenhuma automação encontrada
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--admin-muted)]">
                  Crie webhooks para enviar dados para Make, Zapier, n8n,
                  WhatsApp, CRMs ou sistemas externos.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--app-primary-strong)]"
                >
                  <Plus className="h-4 w-4" />
                  Criar webhook
                </button>
              </div>
            ) : (
              filteredWebhooks.map((webhook) => (
                <article
                  key={webhook.id}
                  className="rounded-[1.75rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-[var(--app-primary)] bg-[var(--app-primary-soft)] px-3 py-1 text-xs font-black text-[var(--app-primary)]">
                          {eventLabels[webhook.event_key] ||
                            webhook.event_key}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            webhook.is_active
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-white/45"
                          }`}
                        >
                          {webhook.is_active ? "Ativa" : "Inativa"}
                        </span>

                        {webhook.last_status ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              webhook.last_status === "success"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                            }`}
                          >
                            Último: {webhook.last_status}
                            {webhook.last_status_code
                              ? ` ${webhook.last_status_code}`
                              : ""}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
                        {webhook.name}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
                        {webhook.description ||
                          eventDescriptions[webhook.event_key] ||
                          "Sem descrição."}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--admin-muted)]">
                            <Globe2 className="h-4 w-4" />
                            URL
                          </div>

                          <p className="mt-2 break-all text-sm font-black text-[var(--admin-text)]">
                            {maskUrl(webhook.webhook_url)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--admin-muted)]">
                            <Send className="h-4 w-4" />
                            Último disparo
                          </div>

                          <p className="mt-2 text-sm font-black text-[var(--admin-text)]">
                            {formatDateTime(webhook.last_triggered_at)}
                          </p>
                        </div>
                      </div>

                      {webhook.last_response ? (
                        <details className="mt-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                          <summary className="cursor-pointer text-sm font-black text-[var(--admin-text)]">
                            Ver última resposta
                          </summary>

                          <pre className="mt-3 max-h-52 overflow-auto rounded-2xl bg-[#071e23] p-4 text-xs leading-6 text-[#e8fbff]">
                            {webhook.last_response}
                          </pre>
                        </details>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => testWebhook(webhook)}
                        disabled={isPending}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-4 text-sm font-black text-white transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" />
                        Testar
                      </button>

                      <a
                        href={webhook.webhook_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-black text-[var(--admin-muted)] transition hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>

                      <button
                        type="button"
                        onClick={() => toggleWebhook(webhook)}
                        disabled={isPending}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-black text-[var(--admin-muted)] transition hover:border-[var(--app-primary)] hover:text-[var(--app-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Power className="h-4 w-4" />
                        {webhook.is_active ? "Pausar" : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(webhook)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-black text-[var(--admin-muted)] transition hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteWebhook(webhook)}
                        disabled={isPending}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <AutomationModal
        open={modalOpen}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSubmit={saveWebhook}
        isPending={isPending}
      />
    </main>
  );
}

export default AutomationWebhooksClient;