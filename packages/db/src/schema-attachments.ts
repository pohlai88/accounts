// Attachment system schema for V1 compliance
// Supports file upload/storage/management with audit trail

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants, companies, users } from "./schema";

// Attachments table
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),

  // File metadata
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileHash: varchar("file_hash", { length: 64 }).notNull(), // SHA-256 hash for deduplication

  // Storage information
  storageProvider: varchar("storage_provider", { length: 50 }).notNull().default("supabase"),
  storagePath: text("storage_path").notNull(),
  storageUrl: text("storage_url"),

  // Categorization
  category: varchar("category", { length: 50 }).notNull(), // 'invoice', 'receipt', 'contract', 'report', etc.
  tags: jsonb("tags").$type<string[]>().default([]),

  // Status and metadata
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active', 'archived', 'deleted'
  isPublic: boolean("is_public").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  // Audit fields
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Attachment relationships - links attachments to various entities
export const attachmentRelationships = pgTable("attachment_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  attachmentId: uuid("attachment_id")
    .notNull()
    .references(() => attachments.id, { onDelete: "cascade" }),

  // Entity reference (polymorphic)
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'invoice', 'bill', 'journal', 'customer', etc.
  entityId: uuid("entity_id").notNull(),

  // Relationship metadata
  relationshipType: varchar("relationship_type", { length: 50 }).notNull().default("attachment"), // 'attachment', 'supporting_doc', 'approval_doc'
  description: text("description"),
  isRequired: boolean("is_required").notNull().default(false),

  // Audit fields
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
});

// Attachment access log for audit trail
export const attachmentAccessLog = pgTable("attachment_access_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  attachmentId: uuid("attachment_id")
    .notNull()
    .references(() => attachments.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),

  // Access details
  action: varchar("action", { length: 50 }).notNull(), // 'view', 'download', 'share', 'delete'
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  // Context
  accessedAt: timestamp("accessed_at").notNull().defaultNow(),
  sessionId: varchar("session_id", { length: 100 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

// Relations
export const attachmentsRelations = relations(attachments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [attachments.tenantId],
    references: [tenants.id],
  }),
  company: one(companies, {
    fields: [attachments.companyId],
    references: [companies.id],
  }),
  uploadedByUser: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
  relationships: many(attachmentRelationships),
  accessLogs: many(attachmentAccessLog),
}));

export const attachmentRelationshipsRelations = relations(attachmentRelationships, ({ one }) => ({
  attachment: one(attachments, {
    fields: [attachmentRelationships.attachmentId],
    references: [attachments.id],
  }),
  createdByUser: one(users, {
    fields: [attachmentRelationships.createdBy],
    references: [users.id],
  }),
}));

export const attachmentAccessLogRelations = relations(attachmentAccessLog, ({ one }) => ({
  attachment: one(attachments, {
    fields: [attachmentAccessLog.attachmentId],
    references: [attachments.id],
  }),
  user: one(users, {
    fields: [attachmentAccessLog.userId],
    references: [users.id],
  }),
}));

// Types for TypeScript
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type AttachmentRelationship = typeof attachmentRelationships.$inferSelect;
export type NewAttachmentRelationship = typeof attachmentRelationships.$inferInsert;
export type AttachmentAccessLog = typeof attachmentAccessLog.$inferSelect;
export type NewAttachmentAccessLog = typeof attachmentAccessLog.$inferInsert;
