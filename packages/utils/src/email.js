import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const FROMS = {
    system: process.env.RESEND_FROM_SYSTEM,
    billing: process.env.RESEND_FROM_BILLING,
    support: process.env.RESEND_FROM_SUPPORT
};
export const emailAdapter = {
    async send(p) {
        const from = FROMS[p.from ?? "system"];
        const headers = p.idemKey ? { "X-Idempotency-Key": p.idemKey } : undefined;
        const to = process.env.NODE_ENV === "production" ? p.to : process.env.DEV_FALLBACK_EMAIL;
        const { data, error } = await resend.emails.send({ from, to, subject: p.subject, html: p.html, headers });
        if (error)
            throw error;
        return { id: data.id };
    }
};
//# sourceMappingURL=email.js.map