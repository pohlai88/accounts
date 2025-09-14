import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./schema";
import { tenants } from "./schema";

// User settings for active tenant tracking
export const userSettings = pgTable("user_settings", {
    userId: uuid("user_id").primaryKey().references(() => users.id),
    activeTenantId: uuid("active_tenant_id").references(() => tenants.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    userIdx: index("user_settings_user_idx").on(table.userId),
    activeTenantIdx: index("user_settings_active_tenant_idx").on(table.activeTenantId)
}));

// Tenant invitations table
export const tenantInvitations = pgTable("tenant_invitations", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    email: uuid("email").notNull(),
    role: uuid("role").notNull().default("user"),
    status: uuid("status").notNull().default("pending"), // pending, accepted, expired, cancelled
    invitedBy: uuid("invited_by").notNull().references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantEmailIdx: index("tenant_invitations_tenant_email_idx").on(table.tenantId, table.email),
    statusIdx: index("tenant_invitations_status_idx").on(table.status),
    expiresIdx: index("tenant_invitations_expires_idx").on(table.expiresAt)
}));
