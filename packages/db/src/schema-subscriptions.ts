import {
    pgTable,
    uuid,
    text,
    timestamp,
    numeric,
    boolean,
    jsonb,
    index,
} from "drizzle-orm/pg-core";

// Subscription Plans
export const subscriptionPlans = pgTable(
    "subscription_plans",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        description: text("description"),
        planType: text("plan_type").notNull().$type<"FREE" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE">(),
        price: numeric("price", { precision: 18, scale: 2 }).notNull().default("0"),
        currency: text("currency").notNull().default("USD"),
        billingCycle: text("billing_cycle").notNull().$type<"MONTHLY" | "YEARLY">(),
        features: jsonb("features").notNull().default({}), // Feature flags and limits
        limits: jsonb("limits").notNull().default({}), // Usage limits
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    table => ({
        planTypeIdx: index("subscription_plans_type_idx").on(table.planType),
        activeIdx: index("subscription_plans_active_idx").on(table.isActive),
    }),
);

// Tenant Subscriptions
export const tenantSubscriptions = pgTable(
    "tenant_subscriptions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id),
        planId: uuid("plan_id")
            .notNull()
            .references(() => subscriptionPlans.id),
        status: text("status").notNull().$type<"ACTIVE" | "CANCELLED" | "EXPIRED" | "SUSPENDED">(),
        startDate: timestamp("start_date", { withTimezone: true }).notNull(),
        endDate: timestamp("end_date", { withTimezone: true }),
        nextBillingDate: timestamp("next_billing_date", { withTimezone: true }),
        autoRenew: boolean("auto_renew").notNull().default(true),
        billingAddress: jsonb("billing_address"),
        paymentMethodId: text("payment_method_id"), // External payment provider ID
        trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
        cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
        cancelledBy: uuid("cancelled_by").references(() => users.id),
        cancellationReason: text("cancellation_reason"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    table => ({
        tenantIdx: index("tenant_subscriptions_tenant_idx").on(table.tenantId),
        planIdx: index("tenant_subscriptions_plan_idx").on(table.planId),
        statusIdx: index("tenant_subscriptions_status_idx").on(table.status),
        nextBillingIdx: index("tenant_subscriptions_next_billing_idx").on(table.nextBillingDate),
    }),
);

// Subscription Invoices
export const subscriptionInvoices = pgTable(
    "subscription_invoices",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        subscriptionId: uuid("subscription_id")
            .notNull()
            .references(() => tenantSubscriptions.id),
        invoiceNumber: text("invoice_number").notNull(),
        amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
        currency: text("currency").notNull().default("USD"),
        taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
        totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull(),
        status: text("status").notNull().$type<"DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED">(),
        dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
        paidAt: timestamp("paid_at", { withTimezone: true }),
        paymentMethodId: text("payment_method_id"),
        externalInvoiceId: text("external_invoice_id"), // External payment provider invoice ID
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    table => ({
        subscriptionIdx: index("subscription_invoices_subscription_idx").on(table.subscriptionId),
        statusIdx: index("subscription_invoices_status_idx").on(table.status),
        dueDateIdx: index("subscription_invoices_due_date_idx").on(table.dueDate),
    }),
);

// Usage Tracking
export const usageMetrics = pgTable(
    "usage_metrics",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id),
        metricType: text("metric_type").notNull(), // "api_calls", "storage_gb", "users", "invoices", etc.
        metricValue: numeric("metric_value", { precision: 18, scale: 2 }).notNull(),
        metricUnit: text("metric_unit").notNull(), // "count", "gb", "mb", "hours", etc.
        recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
        metadata: jsonb("metadata").default({}), // Additional context
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    table => ({
        tenantTypeIdx: index("usage_metrics_tenant_type_idx").on(table.tenantId, table.metricType),
        recordedAtIdx: index("usage_metrics_recorded_at_idx").on(table.recordedAt),
        tenantRecordedIdx: index("usage_metrics_tenant_recorded_idx").on(table.tenantId, table.recordedAt),
    }),
);

// Usage Limits (per tenant/plan)
export const usageLimits = pgTable(
    "usage_limits",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id),
        planId: uuid("plan_id")
            .references(() => subscriptionPlans.id),
        metricType: text("metric_type").notNull(),
        limitValue: numeric("limit_value", { precision: 18, scale: 2 }).notNull(),
        limitUnit: text("limit_unit").notNull(),
        isHardLimit: boolean("is_hard_limit").notNull().default(false), // Hard limit blocks usage, soft limit allows overage
        overagePrice: numeric("overage_price", { precision: 18, scale: 2 }), // Price per unit over limit
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    table => ({
        tenantTypeIdx: index("usage_limits_tenant_type_idx").on(table.tenantId, table.metricType),
        planTypeIdx: index("usage_limits_plan_type_idx").on(table.planId, table.metricType),
        activeIdx: index("usage_limits_active_idx").on(table.isActive),
    }),
);

// Usage Alerts
export const usageAlerts = pgTable(
    "usage_alerts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: uuid("tenant_id")
            .notNull()
            .references(() => tenants.id),
        metricType: text("metric_type").notNull(),
        thresholdPercentage: numeric("threshold_percentage", { precision: 5, scale: 2 }).notNull(), // 80, 90, 100
        alertType: text("alert_type").notNull().$type<"WARNING" | "CRITICAL" | "LIMIT_REACHED">(),
        isActive: boolean("is_active").notNull().default(true),
        lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    table => ({
        tenantTypeIdx: index("usage_alerts_tenant_type_idx").on(table.tenantId, table.metricType),
        activeIdx: index("usage_alerts_active_idx").on(table.isActive),
    }),
);

// Import the tenants and users tables from the main schema
import { tenants, users } from "./schema.js";
