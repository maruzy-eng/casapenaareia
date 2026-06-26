import {
  CheckCircle2,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSystemSettings } from "@/lib/actions/admin/settings";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

type SettingsMap = Record<string, string>;

function getMessageContent(message: string | undefined) {
  const messages: Record<
    string,
    {
      title: string;
      description: string;
      type: "success" | "error";
    }
  > = {
    saved: {
      title: "Configurações salvas com sucesso.",
      description: "As informações foram atualizadas no sistema.",
      type: "success",
    },
    error: {
      title: "Não foi possível salvar.",
      description: "Verifique os dados e tente novamente.",
      type: "error",
    },
  };

  if (!message) return null;

  return messages[message] || null;
}

function getSetting(settings: SettingsMap, key: string, fallback = "") {
  return settings[key] || fallback;
}

function FieldLabel({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--app-text)]">
      {icon}
      {children}
    </span>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-bold text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5";

const textareaClass =
  "w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-medium leading-6 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5";

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const params = await searchParams;
  const messageContent = getMessageContent(params.message);

  const supabase = createAdminClient();

  const { data: settingsRows, error } = await supabase
    .from("system_settings")
    .select("key, value")
    .order("key", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const settings = (settingsRows || []).reduce<SettingsMap>((acc, item) => {
    acc[item.key] = item.value || "";
    return acc;
  }, {});

  const filledSettings = Object.values(settings).filter(Boolean).length;

  const stats = [
    {
      label: "Configurações",
      value: filledSettings,
      helper: "Campos preenchidos",
      icon: Settings,
    },
    {
      label: "Contato",
      value:
        getSetting(settings, "contact_email") ||
        getSetting(settings, "contact_phone")
          ? "OK"
          : "—",
      helper: "E-mail ou telefone",
      icon: Phone,
    },
    {
      label: "WhatsApp",
      value: getSetting(settings, "whatsapp_number") ? "OK" : "—",
      helper: "Número principal",
      icon: MessageCircle,
    },
    {
      label: "E-mails",
      value:
        getSetting(settings, "reservation_email_subject") ||
        getSetting(settings, "confirmation_email_subject")
          ? "OK"
          : "—",
      helper: "Templates básicos",
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {messageContent ? (
        <div
          className={`flex items-start gap-3 rounded-[1.5rem] border p-5 ${
            messageContent.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
          }`}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">{messageContent.title}</p>

            <p className="mt-1 text-sm">{messageContent.description}</p>
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
                {item.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
                {item.helper}
              </p>
            </div>
          );
        })}
      </section>

      <form
        action={updateSystemSettings}
        className="space-y-6 rounded-[2rem] border border-[var(--app-border)] bg-white p-6 shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]"
      >
        <div className="flex flex-col gap-4 border-b border-[var(--app-border)] pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--app-text)]">
              Configurações gerais
            </h2>

            <p className="mt-1 text-sm text-[var(--app-text-soft)]">
              Dados usados no site, reservas e e-mails automáticos.
            </p>
          </div>

          <button
            type="submit"
            className="admin-btn-primary min-h-11 px-5 text-sm"
          >
            <Save className="h-4 w-4" />
            Salvar alterações
          </button>
        </div>

        <section className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
              <Globe className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
                Identidade
              </h3>

              <p className="text-sm text-[var(--app-text-soft)]">
                Nome, marca e informações públicas.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <FieldLabel>Nome do site</FieldLabel>

              <input
                name="site_name"
                defaultValue={getSetting(
                  settings,
                  "site_name",
                  "Casa Pé n'Areia"
                )}
                className={inputClass}
                placeholder="Casa Pé n'Areia"
              />
            </label>

            <label className="block">
              <FieldLabel>Nome da empresa</FieldLabel>

              <input
                name="business_name"
                defaultValue={getSetting(settings, "business_name")}
                className={inputClass}
                placeholder="Casa Pé n'Areia"
              />
            </label>

            <label className="block md:col-span-2">
              <FieldLabel>URL da logo</FieldLabel>

              <input
                name="logo_url"
                defaultValue={getSetting(settings, "logo_url")}
                className={inputClass}
                placeholder="https://..."
              />
            </label>

            <label className="block md:col-span-2">
              <FieldLabel>Texto principal do botão</FieldLabel>

              <input
                name="primary_cta_text"
                defaultValue={getSetting(
                  settings,
                  "primary_cta_text",
                  "Reservar agora"
                )}
                className={inputClass}
                placeholder="Reservar agora"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
              <Phone className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
                Contato
              </h3>

              <p className="text-sm text-[var(--app-text-soft)]">
                Informações para comunicação com hóspedes.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <FieldLabel icon={<Mail className="h-4 w-4" />}>
                E-mail principal
              </FieldLabel>

              <input
                name="contact_email"
                type="email"
                defaultValue={getSetting(settings, "contact_email")}
                className={inputClass}
                placeholder="contato@casapenareia.com"
              />
            </label>

            <label className="block">
              <FieldLabel icon={<Phone className="h-4 w-4" />}>
                Telefone
              </FieldLabel>

              <input
                name="contact_phone"
                defaultValue={getSetting(settings, "contact_phone")}
                className={inputClass}
                placeholder="+55..."
              />
            </label>

            <label className="block">
              <FieldLabel icon={<MessageCircle className="h-4 w-4" />}>
                WhatsApp
              </FieldLabel>

              <input
                name="whatsapp_number"
                defaultValue={getSetting(settings, "whatsapp_number")}
                className={inputClass}
                placeholder="+55..."
              />
            </label>

            <label className="block">
              <FieldLabel>Instagram</FieldLabel>

              <input
                name="instagram_url"
                defaultValue={getSetting(settings, "instagram_url")}
                className={inputClass}
                placeholder="https://instagram.com/..."
              />
            </label>

            <label className="block md:col-span-2">
              <FieldLabel>Endereço</FieldLabel>

              <input
                name="address"
                defaultValue={getSetting(settings, "address")}
                className={inputClass}
                placeholder="Endereço da pousada"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-primary-soft)] text-[var(--app-primary)]">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-[var(--app-text)]">
                E-mails automáticos
              </h3>

              <p className="text-sm text-[var(--app-text-soft)]">
                Textos usados nos e-mails de reserva.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <label className="block">
              <FieldLabel>Assunto — reserva recebida</FieldLabel>

              <input
                name="reservation_email_subject"
                defaultValue={getSetting(
                  settings,
                  "reservation_email_subject",
                  "Recebemos sua solicitação de reserva"
                )}
                className={inputClass}
                placeholder="Recebemos sua solicitação de reserva"
              />
            </label>

            <label className="block">
              <FieldLabel>Texto — reserva recebida</FieldLabel>

              <textarea
                name="reservation_email_intro"
                rows={4}
                defaultValue={getSetting(
                  settings,
                  "reservation_email_intro",
                  "Recebemos sua solicitação e nossa equipe irá revisar os detalhes."
                )}
                className={textareaClass}
              />
            </label>

            <label className="block">
              <FieldLabel>Assunto — reserva confirmada</FieldLabel>

              <input
                name="confirmation_email_subject"
                defaultValue={getSetting(
                  settings,
                  "confirmation_email_subject",
                  "Sua reserva foi confirmada"
                )}
                className={inputClass}
                placeholder="Sua reserva foi confirmada"
              />
            </label>

            <label className="block">
              <FieldLabel>Texto — reserva confirmada</FieldLabel>

              <textarea
                name="confirmation_email_intro"
                rows={4}
                defaultValue={getSetting(
                  settings,
                  "confirmation_email_intro",
                  "Sua reserva está confirmada. Estamos felizes em receber você."
                )}
                className={textareaClass}
              />
            </label>

            <label className="block">
              <FieldLabel>Assunto — reserva cancelada</FieldLabel>

              <input
                name="cancellation_email_subject"
                defaultValue={getSetting(
                  settings,
                  "cancellation_email_subject",
                  "Sua reserva foi cancelada"
                )}
                className={inputClass}
                placeholder="Sua reserva foi cancelada"
              />
            </label>

            <label className="block">
              <FieldLabel>Texto — reserva cancelada</FieldLabel>

              <textarea
                name="cancellation_email_intro"
                rows={4}
                defaultValue={getSetting(
                  settings,
                  "cancellation_email_intro",
                  "Sua reserva foi cancelada. Entre em contato caso precise de ajuda."
                )}
                className={textareaClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-primary)] p-5 text-white dark:bg-[var(--app-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white dark:bg-[var(--app-primary-soft)] dark:text-[var(--app-primary)]">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-[-0.03em] text-white dark:text-[var(--app-text)]">
                  Salvar configurações
                </h3>

                <p className="mt-1 text-sm leading-6 text-white/72 dark:text-[var(--app-text-soft)]">
                  As alterações serão aplicadas nos próximos e-mails e páginas
                  que usam essas informações.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[var(--app-primary)] transition hover:bg-white/90 dark:bg-[var(--app-primary)] dark:text-white"
            >
              <Save className="h-4 w-4" />
              Salvar
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}