/**
 * @aibos - Master Export Registry
 *
 * Single source of truth for all package exports
 * Organized by domain with hierarchical namespacing
 *
 * Usage:
 * - Import specific functionality: import { Button } from "@aibos/ui"
 * - Import from master registry: import { Button } from "@aibos"
 * - Import with namespacing: import { utilsLogger } from "@aibos/utils"
 */

// ============================================================================
// CORE PACKAGES
// ============================================================================

// Database and data layer
export * from "./db";

// Authentication and authorization
export * from "./auth";

// Accounting and financial operations
export * from "./accounting";

// ============================================================================
// UI & PRESENTATION
// ============================================================================

// User interface components
export * from "./ui";

// Design tokens and theming
export * from "./tokens";

// ============================================================================
// INFRASTRUCTURE & UTILITIES
// ============================================================================

// Core utilities and helpers
export * from "./utils";

// Caching and performance
export * from "./cache";

// Monitoring and observability
export * from "./monitoring";

// Security and compliance
export * from "./security";

// Real-time communication
export * from "./realtime";

// ============================================================================
// API & INTEGRATION
// ============================================================================

// API contracts and types
export * from "./contracts";

// API gateway functionality
export * from "./api-gateway";

// ============================================================================
// DEPLOYMENT & OPERATIONS
// ============================================================================

// Deployment and infrastructure
export * from "./deployment";

// ============================================================================
// NAMESPACED EXPORTS
// ============================================================================

// Re-export key functionality with clear namespacing to avoid conflicts

// Logging utilities (namespaced)
export { utilsLogger, makeLogger } from "./utils";
export { logger as monitoringLogger } from "./monitoring";

// Cache utilities (namespaced)
export { CacheService as UtilsCacheService } from "./utils";
export { CacheService as CacheService } from "./cache";

// Performance monitoring (namespaced)
export { utilsPerformanceMonitor, utilsErrorTracker } from "./utils";
export { MetricsCollector, HealthChecker } from "./monitoring";

// Auth utilities (namespaced)
export { canPerformAction, isFeatureEnabled } from "./auth";
export { AuthProvider } from "./ui";

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Common patterns and utilities
export const aibos = {
    // Version information
    version: "2.0.0",

    // Package information
    packages: {
        db: "@aibos/db",
        auth: "@aibos/auth",
        accounting: "@aibos/accounting",
        ui: "@aibos/ui",
        tokens: "@aibos/tokens",
        utils: "@aibos/utils",
        cache: "@aibos/cache",
        monitoring: "@aibos/monitoring",
        security: "@aibos/security",
        realtime: "@aibos/realtime",
        contracts: "@aibos/contracts",
        "api-gateway": "@aibos/api-gateway",
        deployment: "@aibos/deployment",
    },

    // Quick access to common functionality
    logger: {
        utils: () => import("@aibos/utils").then(m => m.utilsLogger),
        monitoring: () => import("@aibos/monitoring").then(m => m.logger),
    },

    // Cache access
    cache: {
        utils: () => import("@aibos/utils").then(m => m.CacheService),
        redis: () => import("@aibos/cache").then(m => m.CacheService),
    },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export commonly used types
export type { UserContext } from "./utils";
export type { AuditContext as V1AuditContext } from "./utils";
export type { PerformanceMetrics } from "./monitoring";
export type { CacheOptions } from "./cache";
export type { GovernancePack } from "./auth";
