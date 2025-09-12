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

// Note: renderPdf is NOT exported here to prevent Puppeteer bundling in API routes
// Import from "@aibos/utils/server" when you need PDF functionality

// V1 Axiom Telemetry
export * from "./axiom";
export * from "./middleware";

// Idempotency middleware
export * from "./middleware/idempotency";

// Audit service
export * from "./audit/service";

// V1 Compliance - Audit and Context (avoiding conflicts)
export { AuditService as V1AuditService, getAuditService as getV1AuditService } from "./audit/audit-service";
export type { AuditContext as V1AuditContext, AuditEvent } from "./audit/audit-service";
export {
  createRequestContext as createV1RequestContext,
  extractUserContext as extractV1UserContext,
  createAuditContext as createV1AuditContext,
  validateContext,
  sanitizeContext
} from "./context/request-context";
export type { RequestContext as V1RequestContext, UserContext } from "./context/request-context";

// Export functionality for V1 compliance - Complete implementation
export { 
  ExportFormat, 
  ExportOptions, 
  ExportResult, 
  ReportExportRequest, 
  ExportableData,
  ExcelCellStyle,
  ChartConfig 
} from "./export/types";
export { 
  exportToCsv, 
  exportToXlsx, 
  exportToJsonl, 
  exportToCsvEnhanced,
  createExportService,
  ExportService
} from "./export";
export {
  createExportManagerService,
  ExportManagerService,
  ExportHistory,
  ExportStats,
  cleanupExpiredExportsJob
} from "./export/export-manager";
export {
  createExportScheduleService,
  ExportScheduleService,
  ScheduledExport,
  ScheduleConfig,
  processScheduledExports
} from "./export/export-scheduler";

// Monitoring and performance tracking for V1 compliance
export { performanceMonitor, PerformanceMetrics, APIMetrics, UIMetrics } from "./monitoring/performance-monitor";
export { errorTracker, ErrorContext, ErrorEvent, ErrorSummary } from "./monitoring/error-tracker";

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
