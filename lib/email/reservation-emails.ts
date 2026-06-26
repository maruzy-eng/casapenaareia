import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFromEmail, getResendClient } from "@/lib/email/resend";

type ReservationEmailInput = {
  to: string;
  guestName: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number | string;
  nights: number | string;
  total: number | string;
};

type SystemSettings = {
  property_name: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  currency: string | null;
  cancellation_policy: string | null;
  pending_email_subject: string | null;
  confirmed_email_subject: string | null;
  cancelled_email_subject: string | null;
  pending_email_message: string | null;
  confirmed_email_message: string | null;
  cancelled_email_message: string | null;
};

const defaultSettings: SystemSettings = {
  property_name: "Casa Pé n'Areia",
  contact_email: null,
  whatsapp: null,
  currency: "USD",
  cancellation_policy: "Política de cancelamento ainda não configurada.",
  pending_email_subject: "Recebemos sua solicitação de reserva",
  confirmed_email_subject: "Sua reserva foi confirmada",
  cancelled_email_subject: "Sua reserva foi cancelada",
  pending_email_message:
    "Recebemos sua solicitação de reserva. Ela foi criada como pendente e nossa equipe irá revisar as informações.",
  confirmed_email_message:
    "Sua reserva foi confirmada com sucesso. Estamos felizes em receber você.",
  cancelled_email_message:
    "Sua reserva foi cancelada. Caso tenha alguma dúvida, entre em contato com nossa equipe.",
};

async function getSystemSettings(): Promise<SystemSettings> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("system_settings")
    .select(
      `
      property_name,
      contact_email,
      whatsapp,
      currency,
      cancellation_policy,
      pending_email_subject,
      confirmed_email_subject,
      cancelled_email_subject,
      pending_email_message,
      confirmed_email_message,
      cancelled_email_message
    `
    )
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar configurações do sistema:", error.message);
    return defaultSettings;
  }

  return {
    ...defaultSettings,
    ...data,
  };
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(
  value: number | string | null | undefined,
  currency: string | null | undefined
) {
  const numberValue = Number(value || 0);
  const safeCurrency = currency || "USD";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: safeCurrency,
  }).format(numberValue);
}

function formatDate(value: string) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatMultilineText(value: string | null | undefined) {
  if (!value) return "";

  return escapeHtml(value).replace(/\n/g, "<br />");
}

function baseLayout({
  propertyName,
  content,
}: {
  propertyName: string;
  content: string;
}) {
  const safePropertyName = escapeHtml(propertyName);

  return `
    <div style="margin:0;padding:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e7e5e4;border-radius:24px;overflow:hidden;">
          <div style="padding:28px 28px 18px;border-bottom:1px solid #e7e5e4;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#78716c;">
              ${safePropertyName}
            </p>

            <h1 style="margin:0;font-size:26px;line-height:1.2;color:#0c0a09;">
              Sistema de Reservas
            </h1>
          </div>

          <div style="padding:28px;">
            ${content}
          </div>
        </div>

        <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#78716c;">
          Esta é uma mensagem automática de ${safePropertyName}.
        </p>
      </div>
    </div>
  `;
}

function reservationSummary({
  input,
  settings,
}: {
  input: ReservationEmailInput;
  settings: SystemSettings;
}) {
  return `
    <div style="margin:22px 0;padding:18px;border-radius:18px;background:#f5f5f4;border:1px solid #e7e5e4;">
      <p style="margin:0 0 10px;font-size:14px;color:#57534e;">
        <strong style="color:#0c0a09;">Acomodação:</strong> ${escapeHtml(
          input.unitName
        )}
      </p>

      <p style="margin:0 0 10px;font-size:14px;color:#57534e;">
        <strong style="color:#0c0a09;">Check-in:</strong> ${formatDate(
          input.checkIn
        )}
      </p>

      <p style="margin:0 0 10px;font-size:14px;color:#57534e;">
        <strong style="color:#0c0a09;">Check-out:</strong> ${formatDate(
          input.checkOut
        )}
      </p>

      <p style="margin:0 0 10px;font-size:14px;color:#57534e;">
        <strong style="color:#0c0a09;">Hóspedes:</strong> ${escapeHtml(
          input.guestsCount
        )}
      </p>

      <p style="margin:0 0 10px;font-size:14px;color:#57534e;">
        <strong style="color:#0c0a09;">Noites:</strong> ${escapeHtml(
          input.nights
        )}
      </p>

      <p style="margin:14px 0 0;padding-top:14px;border-top:1px solid #d6d3d1;font-size:18px;color:#0c0a09;">
        <strong>Total:</strong> ${formatMoney(input.total, settings.currency)}
      </p>
    </div>
  `;
}

function contactFooter(settings: SystemSettings) {
  const hasWhatsapp = Boolean(settings.whatsapp);
  const hasEmail = Boolean(settings.contact_email);
  const hasCancellationPolicy = Boolean(settings.cancellation_policy);

  if (!hasWhatsapp && !hasEmail && !hasCancellationPolicy) {
    return "";
  }

  return `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e7e5e4;">
      ${
        hasCancellationPolicy
          ? `
            <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#57534e;">
              <strong style="color:#0c0a09;">Política de cancelamento:</strong><br />
              ${formatMultilineText(settings.cancellation_policy)}
            </p>
          `
          : ""
      }

      ${
        hasWhatsapp || hasEmail
          ? `
            <p style="margin:0;font-size:14px;line-height:1.6;color:#57534e;">
              <strong style="color:#0c0a09;">Contato:</strong><br />
              ${hasWhatsapp ? `WhatsApp: ${escapeHtml(settings.whatsapp)}<br />` : ""}
              ${hasEmail ? `E-mail: ${escapeHtml(settings.contact_email)}` : ""}
            </p>
          `
          : ""
      }
    </div>
  `;
}

async function sendReservationEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  const from = getFromEmail();

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Erro ao enviar e-mail:", error);
  }
}

export async function sendReservationCreatedEmail(input: ReservationEmailInput) {
  if (!input.to) return;

  const settings = await getSystemSettings();

  const propertyName = settings.property_name || defaultSettings.property_name!;
  const subject =
    settings.pending_email_subject || defaultSettings.pending_email_subject!;
  const message =
    settings.pending_email_message || defaultSettings.pending_email_message!;

  await sendReservationEmail({
    to: input.to,
    subject,
    html: baseLayout({
      propertyName,
      content: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">
          Olá, <strong>${escapeHtml(input.guestName)}</strong>.
        </p>

        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">
          ${formatMultilineText(message)}
        </p>

        ${reservationSummary({ input, settings })}

        ${contactFooter(settings)}
      `,
    }),
  });
}

export async function sendReservationConfirmedEmail(
  input: ReservationEmailInput
) {
  if (!input.to) return;

  const settings = await getSystemSettings();

  const propertyName = settings.property_name || defaultSettings.property_name!;
  const subject =
    settings.confirmed_email_subject ||
    defaultSettings.confirmed_email_subject!;
  const message =
    settings.confirmed_email_message ||
    defaultSettings.confirmed_email_message!;

  await sendReservationEmail({
    to: input.to,
    subject,
    html: baseLayout({
      propertyName,
      content: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">
          Olá, <strong>${escapeHtml(input.guestName)}</strong>.
        </p>

        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">
          ${formatMultilineText(message)}
        </p>

        ${reservationSummary({ input, settings })}

        ${contactFooter(settings)}
      `,
    }),
  });
}

export async function sendReservationCancelledEmail(
  input: ReservationEmailInput
) {
  if (!input.to) return;

  const settings = await getSystemSettings();

  const propertyName = settings.property_name || defaultSettings.property_name!;
  const subject =
    settings.cancelled_email_subject ||
    defaultSettings.cancelled_email_subject!;
  const message =
    settings.cancelled_email_message ||
    defaultSettings.cancelled_email_message!;

  await sendReservationEmail({
    to: input.to,
    subject,
    html: baseLayout({
      propertyName,
      content: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">
          Olá, <strong>${escapeHtml(input.guestName)}</strong>.
        </p>

        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#44403c;">
          ${formatMultilineText(message)}
        </p>

        ${reservationSummary({ input, settings })}

        ${contactFooter(settings)}
      `,
    }),
  });
}