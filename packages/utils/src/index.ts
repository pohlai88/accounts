export * from "./types";
export * from "./logger";
export * from "./email";
export * from "./storage";

// Supabase clients with explicit naming to avoid conflicts
export { createClient as createServerClient, createServiceClient } from "./supabase/server";
export { createClient as createBrowserClient } from "./supabase/client";
export { createClient as createMiddlewareClient } from "./supabase/middleware";

// PDF utilities (server-only, not for Edge Runtime)
export type { PDFOptions } from "./pdf";

// Re-export server utilities for worker access
export { renderPdf } from "./server";

// V1 Axiom Telemetry
export * from "./axiom";
export * from "./middleware";

// Idempotency middleware
export * from "./middleware/idempotency";

// Audit service
export * from "./audit/service";

// Import functions for convenience exports
import { makeLogger } from "./logger";
import { emailAdapter } from "./email";

// Create convenience exports for worker
export const logger = makeLogger("jobs");

// Create sendEmail function from emailAdapter
export const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: unknown[];
  from?: string;
  replyTo?: string;
}) => {
  return emailAdapter.send({
    to: params.to,
    subject: params.subject,
    html: params.html,
    idemKey: undefined,
    from: "system"
  });
};
