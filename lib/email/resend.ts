import "server-only";
import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Casa Pé n'Areia <onboarding@resend.dev>"
  );
}