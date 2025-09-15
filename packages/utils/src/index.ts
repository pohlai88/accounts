/**
 * @aibos/utils - Unified Export Structure
 *
 * Single source of truth for all utility functions
 * Organized by domain with clear naming conventions
 */

// Imports for local usage and re-exports
import { makeLogger } from "./logger.js";
import { emailAdapter } from "./email.js";

// CORE UTILITIES
export * from "./types.js";
export * from "./type-guards.js";
export * from "./result.js";
export * from "./error-utils.js";
export * from "./env.js";
export * from "./pick.js";
export * from "./httpClient.js";
export * from "./logger-utils.js";
export * from "./guards.js";
export * from "./dict.js";
export * from "./reduce.js";

// Logging utilities
export { makeLogger } from "./logger.js";
export const utilsLogger = makeLogger("app");

// Email utilities
export * from "./email.js";

// Storage utilities
export * from "./storage.js";
export { attachmentService } from "./storage.js";

// MIDDLEWARE UTILITIES
export * from "./middleware.js";
export * from "./middleware/idempotency.js";

// SUPABASE CLIENTS
export { createClient as createServerClient, createServiceClient } from "./supabase/server.js";
export { createClient as createBrowserClient } from "./supabase/client.js";
export { createClient as createMiddlewareClient } from "./supabase/middleware.js";

// PDF UTILITIES
export type { PDFOptions } from "./pdf.js";

// TELEMETRY & MONITORING
export * from "./axiom.js";
export {
  performanceMonitor as utilsPerformanceMonitor,
  PerformanceMetrics as UtilsPerformanceMetrics,
  APIMetrics as UtilsAPIMetrics,
  UIMetrics as UtilsUIMetrics
} from "./monitoring/performance-monitor.js";
export {
  errorTracker as utilsErrorTracker,
  ErrorContext as UtilsErrorContext,
  ErrorEvent as UtilsErrorEvent,
  ErrorSummary as UtilsErrorSummary
} from "./monitoring/error-tracker.js";

// AUDIT & COMPLIANCE
export { AuditService as V1AuditService, getAuditService as getV1AuditService } from "./audit/audit-service.js";
// Audit types are now available from @aibos/utils/types (SSOT)

// CONTEXT HANDLING
export {
  createRequestContext as createV1RequestContext,
  extractUserContext as extractV1UserContext,
  createAuditContext as createV1AuditContext,
  validateContext,
  sanitizeContext
} from "./context/request-context.js";
export type { UserContext } from "./context/request-context.js";

// EXPORT TYPES & SERVICES
export {
  ExportFormat,
  ExportOptions,
  ExportResult,
  ReportExportRequest,
  ExportableData,
  ExcelCellStyle,
  ChartConfig
} from "./export/types.js";
export {
  exportToCsv,
  exportToXlsx,
  exportToJsonl,
  exportToCsvEnhanced,
  createExportService,
  ExportService
} from "./export/index.js";
export {
  createExportManagerService,
  ExportManagerService,
  ExportHistory,
  ExportStats,
  cleanupExpiredExportsJob
} from "./export/export-manager.js";
export {
  createExportScheduleService,
  ExportScheduleService,
  ScheduledExport,
  ScheduleConfig,
  processScheduledExports
} from "./export/export-scheduler.js";

// AUTH UTILITIES
export * from "./auth/enhanced-context.js";
export * from "./auth/react-hooks.js";
export { getEnhancedUserContext, assertPermission, checkPermission, checkFeature } from "./auth/enhanced-context.js";

// API CLIENT AND STATE MANAGEMENT
export * from "./api-client.js";
export * from "./state-management.js";
export * from "./server-api-client.js";
export * from "./api-gateway/index.js";
export * from "./cache/index.js";

// CONVENIENCE EXPORTS
export { createRequestContext, extractUserContext, createAuditContext } from "./context/request-context.js";
export { getAuditService } from "./audit/service.js";

// LOGGING
export const logger = makeLogger("jobs");
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
    from: "system",
  });
};
