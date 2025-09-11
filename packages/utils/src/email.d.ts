export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    idemKey?: string;
    from?: "system" | "billing" | "support";
}
export interface EmailPort {
    send(p: EmailPayload): Promise<{
        id: string;
    }>;
}
export declare const emailAdapter: EmailPort;
//# sourceMappingURL=email.d.ts.map