import { Resend } from "resend";
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  idemKey?: string;
  from?: "system" | "billing" | "support";
}
export interface EmailPort {
  send(p: EmailPayload): Promise<{ id: string }>;
}

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROMS = {
  system: process.env.RESEND_FROM_SYSTEM || "system@aibos.com",
  billing: process.env.RESEND_FROM_BILLING || "billing@aibos.com",
  support: process.env.RESEND_FROM_SUPPORT || "support@aibos.com",
};
export const emailAdapter: EmailPort = {
  async send(p) {
    const from = FROMS[p.from ?? "system"];
    const headers = p.idemKey ? { "X-Idempotency-Key": p.idemKey } : undefined;
    const to =
      process.env.NODE_ENV === "production"
        ? p.to
        : process.env.DEV_FALLBACK_EMAIL || "test@example.com";

    if (!resend) {
      console.warn("Resend API key not configured, email not sent:", { to, subject: p.subject });
      return { id: "mock-email-id-" + Date.now() };
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: p.subject,
      html: p.html,
      headers,
    });
    if (error) { throw error; }
    return { id: data!.id };
  },
};
