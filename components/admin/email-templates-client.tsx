"use client";

import {
  Check,
  Code2,
  Eye,
  FileText,
  Mail,
  Pencil,
  Power,
  RotateCcw,
  Save,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  updateEmailTemplateAction,
  type UpdateEmailTemplatePayload,
} from "@/lib/actions/admin/email-templates";

import type { EmailTemplateItem } from "@/app/admin/emails/page";

type EmailTemplatesClientProps = {
  initialTemplates: EmailTemplateItem[];
};

type EditorState = {
  id: string;
  template_key: string;
  title: string;
  subject: string;
  description: string;
  html_body: string;
  is_active: boolean;
};

const templateLabels: Record<string, string> = {
  payment_confirmation: "Pagamento confirmado",
  checkin_completed: "Check-in feito",
  checkout_completed: "Checkout feito",
};

const sampleVariables = {
  guest_name: "Maria Silva",
  unit_name: "Suíte Jardim",
  check_in: "29/12/2026",
  check_out: "02/01/2027",
  total: "US$ 2.480,00",
};

function replacePreviewVariables(html: string) {
  return html
    .replaceAll("{{guest_name}}", sampleVariables.guest_name)
    .replaceAll("{{unit_name}}", sampleVariables.unit_name)
    .replaceAll("{{check_in}}", sampleVariables.check_in)
    .replaceAll("{{check_out}}", sampleVariables.check_out)
    .replaceAll("{{total}}", sampleVariables.total);
}

function buildEditorState(template: EmailTemplateItem): EditorState {
  return {
    id: template.id,
    template_key: template.template_key,
    title: template.title || "",
    subject: template.subject || "",
    description: template.description || "",
    html_body: template.html_body || "",
    is_active: Boolean(template.is_active),
  };
}

function EmailMetric({
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

function VariableBadge({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value)}
      className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-black text-[var(--admin-muted)] transition hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
      title="Clique para copiar"
    >
      {value}
    </button>
  );
}

export function EmailTemplatesClient({
  initialTemplates,
}: EmailTemplatesClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplates[0]?.id || ""
  );

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ||
      templates[0] ||
      null,
    [templates, selectedTemplateId]
  );

  const [editor, setEditor] = useState<EditorState | null>(
    selectedTemplate ? buildEditorState(selectedTemplate) : null
  );

  const [viewMode, setViewMode] = useState<"preview" | "html">(
    "preview"
  );

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const active = templates.filter(
      (template) => template.is_active
    ).length;

    return {
      total: templates.length,
      active,
      inactive: templates.length - active,
    };
  }, [templates]);

  function selectTemplate(template: EmailTemplateItem) {
    if (isPending) return;

    setSelectedTemplateId(template.id);
    setEditor(buildEditorState(template));
    setMessage("");
    setErrorMessage("");
    setViewMode("preview");
  }

  function updateEditor<Key extends keyof EditorState>(
    key: Key,
    value: EditorState[Key]
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });

    setMessage("");
    setErrorMessage("");
  }

  function resetEditor() {
    if (!selectedTemplate) return;

    setEditor(buildEditorState(selectedTemplate));
    setMessage("");
    setErrorMessage("");
  }

  function saveTemplate() {
    if (!editor) return;

    setMessage("");
    setErrorMessage("");

    const payload: UpdateEmailTemplatePayload = {
      id: editor.id,
      title: editor.title,
      subject: editor.subject,
      description: editor.description,
      html_body: editor.html_body,
      is_active: editor.is_active,
    };

    startTransition(async () => {
      try {
        await updateEmailTemplateAction(payload);

        setTemplates((current) =>
          current.map((template) =>
            template.id === editor.id
              ? {
                  ...template,
                  title: editor.title,
                  subject: editor.subject,
                  description: editor.description || null,
                  html_body: editor.html_body,
                  is_active: editor.is_active,
                  updated_at: new Date().toISOString(),
                }
              : template
          )
        );

        setMessage("Email atualizado com sucesso.");
      } catch (error) {
        const errorText =
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o email.";

        setErrorMessage(errorText);
      }
    });
  }

  const previewHtml = editor
    ? replacePreviewVariables(editor.html_body)
    : "";

  if (!editor || templates.length === 0) {
    return (
      <main className="rounded-[2rem] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-10 text-center">
        <Mail className="mx-auto h-12 w-12 text-[var(--app-primary)]" />

        <h2 className="mt-4 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
          Nenhum template encontrado
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-[var(--admin-muted)]">
          Rode o SQL inicial para criar os emails de confirmação de pagamento,
          check-in feito e checkout feito.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <EmailMetric
          icon={<Mail className="h-5 w-5" />}
          label="Templates"
          value={metrics.total}
          description="Emails cadastrados no sistema"
        />

        <EmailMetric
          icon={<Power className="h-5 w-5" />}
          label="Ativos"
          value={metrics.active}
          description="Emails disponíveis para envio"
        />

        <EmailMetric
          icon={<FileText className="h-5 w-5" />}
          label="Inativos"
          value={metrics.inactive}
          description="Templates pausados"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[330px_1fr]">
        <aside className="overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <div className="border-b border-[var(--admin-border)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">
              Emails do sistema
            </p>

            <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-[var(--admin-text)]">
              Templates
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
              Edite assunto, título e corpo HTML dos emails automáticos.
            </p>
          </div>

          <div className="grid gap-2 p-3">
            {templates.map((template) => {
              const active = template.id === editor.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  className={`rounded-[1.35rem] border p-4 text-left transition ${
                    active
                      ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)]"
                      : "border-transparent bg-transparent hover:border-[var(--admin-border)] hover:bg-[var(--admin-surface-soft)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[var(--admin-text)]">
                        {templateLabels[template.template_key] ||
                          template.title}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs text-[var(--admin-muted)]">
                        {template.subject}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                        template.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-white/45"
                      }`}
                    >
                      {template.is_active ? "Ativo" : "Off"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="overflow-hidden rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(7,52,59,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[var(--admin-border)] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--app-primary)]">
                Editor de email
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[var(--admin-text)]">
                {editor.title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
                {editor.description || "Sem descrição."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  updateEditor("is_active", !editor.is_active)
                }
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${
                  editor.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/45"
                }`}
              >
                <Power className="h-4 w-4" />
                {editor.is_active ? "Ativo" : "Inativo"}
              </button>

              <button
                type="button"
                onClick={resetEditor}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-bold text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                Desfazer
              </button>

              <button
                type="button"
                onClick={saveTemplate}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-5">
            {message ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                {message}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                  Título interno
                </span>

                <input
                  value={editor.title}
                  onChange={(event) =>
                    updateEditor("title", event.target.value)
                  }
                  className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-semibold text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                  Assunto do email
                </span>

                <input
                  value={editor.subject}
                  onChange={(event) =>
                    updateEditor("subject", event.target.value)
                  }
                  className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-semibold text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                Descrição
              </span>

              <input
                value={editor.description}
                onChange={(event) =>
                  updateEditor("description", event.target.value)
                }
                className="min-h-12 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] px-4 text-sm font-semibold text-[var(--admin-text)] outline-none transition focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary)]/10"
              />
            </label>

            <div className="rounded-[1.5rem] border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
              <p className="text-sm font-black text-[var(--admin-text)]">
                Variáveis disponíveis
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
                Use essas variáveis no assunto ou no HTML. No envio real, elas
                serão trocadas pelos dados da reserva.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <VariableBadge value="{{guest_name}}" />
                <VariableBadge value="{{unit_name}}" />
                <VariableBadge value="{{check_in}}" />
                <VariableBadge value="{{check_out}}" />
                <VariableBadge value="{{total}}" />
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--admin-border)]">
              <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--admin-text)]">
                    Corpo do email
                  </p>

                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    Edite o HTML e visualize como o email será renderizado.
                  </p>
                </div>

                <div className="flex rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                      viewMode === "preview"
                        ? "bg-[var(--app-primary)] text-white"
                        : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("html")}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                      viewMode === "html"
                        ? "bg-[var(--app-primary)] text-white"
                        : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    HTML
                  </button>
                </div>
              </div>

              {viewMode === "html" ? (
                <textarea
                  value={editor.html_body}
                  onChange={(event) =>
                    updateEditor("html_body", event.target.value)
                  }
                  spellCheck={false}
                  className="min-h-[540px] w-full resize-y border-0 bg-[#071e23] p-5 font-mono text-sm leading-7 text-[#e8fbff] outline-none placeholder:text-white/30"
                />
              ) : (
                <div className="bg-[var(--admin-surface-soft)] p-4">
                  <iframe
                    title="Preview do email"
                    srcDoc={previewHtml}
                    className="h-[580px] w-full rounded-2xl border border-[var(--admin-border)] bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveTemplate}
                disabled={isPending}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--app-primary)] bg-[var(--app-primary)] px-6 text-sm font-black text-white shadow-[0_14px_34px_rgba(11,89,99,0.18)] transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default EmailTemplatesClient;