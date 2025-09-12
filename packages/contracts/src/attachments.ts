import { z } from "zod";

// V1 Compliance: Complete Attachment System Contracts
// Supports file upload, document management, OCR, approval workflows, and retention

// ============================================================================
// CORE ATTACHMENT SCHEMAS
// ============================================================================

// Attachment Categories
export const AttachmentCategory = z.enum([
  'invoice',
  'receipt', 
  'contract',
  'report',
  'statement',
  'tax_document',
  'bank_document',
  'legal_document',
  'correspondence',
  'other'
]);

// Attachment Status
export const AttachmentStatus = z.enum([
  'active',
  'archived', 
  'deleted',
  'processing',
  'failed'
]);

// Relationship Types
export const RelationshipType = z.enum([
  'attachment',
  'supporting_doc',
  'approval_doc',
  'backup_doc',
  'reference_doc'
]);

// Entity Types for polymorphic relationships
export const EntityType = z.enum([
  'invoice',
  'bill', 
  'journal',
  'customer',
  'supplier',
  'payment',
  'bank_transaction',
  'tax_return',
  'report'
]);

// ============================================================================
// UPLOAD & BASIC OPERATIONS
// ============================================================================

// File Upload Request
export const UploadAttachmentReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  category: AttachmentCategory,
  tags: z.array(z.string().min(1).max(50)).optional().default([]),
  isPublic: z.boolean().optional().default(false),
  metadata: z.record(z.unknown()).optional().default({}),
  
  // Optional entity linking
  entityType: EntityType.optional(),
  entityId: z.string().uuid().optional(),
  relationshipType: RelationshipType.optional().default('attachment'),
  isRequired: z.boolean().optional().default(false),
  description: z.string().max(500).optional()
});

// File Upload Response
export const UploadAttachmentRes = z.object({
  success: z.boolean(),
  attachmentId: z.string().uuid().optional(),
  filename: z.string().optional(),
  url: z.string().url().optional(),
  error: z.string().optional(),
  duplicateOf: z.string().uuid().optional() // If file already exists
});

// Get Attachment Request
export const GetAttachmentReq = z.object({
  tenantId: z.string().uuid(),
  attachmentId: z.string().uuid()
});

// Attachment Details Response
export const AttachmentDetailsRes = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  uploadedBy: z.string().uuid(),
  uploadedByName: z.string().optional(),
  
  // File metadata
  filename: z.string(),
  originalFilename: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  fileHash: z.string(),
  
  // Storage information
  storageProvider: z.string(),
  storagePath: z.string(),
  storageUrl: z.string().url().optional(),
  
  // Categorization
  category: AttachmentCategory,
  tags: z.array(z.string()),
  
  // Status and metadata
  status: AttachmentStatus,
  isPublic: z.boolean(),
  metadata: z.record(z.unknown()),
  
  // OCR and processing
  ocrStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'not_applicable']).optional(),
  ocrData: z.record(z.unknown()).optional(),
  ocrConfidence: z.number().min(0).max(1).optional(),
  
  // Approval workflow
  approvalStatus: z.enum(['not_required', 'pending', 'approved', 'rejected']).optional(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  
  // Retention
  retentionPolicy: z.string().optional(),
  retentionUntil: z.string().datetime().optional(),
  
  // Relationships
  relationships: z.array(z.object({
    entityType: EntityType,
    entityId: z.string().uuid(),
    relationshipType: RelationshipType,
    description: z.string().optional(),
    isRequired: z.boolean()
  })),
  
  // Audit fields
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().optional()
});

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

// List Attachments Request
export const ListAttachmentsReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  
  // Filtering
  category: AttachmentCategory.optional(),
  status: AttachmentStatus.optional(),
  tags: z.array(z.string()).optional(),
  uploadedBy: z.string().uuid().optional(),
  
  // Entity filtering
  entityType: EntityType.optional(),
  entityId: z.string().uuid().optional(),
  
  // Date filtering
  uploadedAfter: z.string().datetime().optional(),
  uploadedBefore: z.string().datetime().optional(),
  
  // Search
  searchQuery: z.string().max(200).optional(),
  searchInContent: z.boolean().optional().default(false), // OCR content search
  
  // Pagination
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  
  // Sorting
  sortBy: z.enum(['created_at', 'updated_at', 'filename', 'file_size', 'category']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// List Attachments Response
export const ListAttachmentsRes = z.object({
  attachments: z.array(AttachmentDetailsRes),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }),
  filters: z.object({
    appliedFilters: z.record(z.unknown()),
    availableCategories: z.array(AttachmentCategory),
    availableTags: z.array(z.string())
  })
});

// Update Attachment Metadata Request
export const UpdateAttachmentReq = z.object({
  tenantId: z.string().uuid(),
  attachmentId: z.string().uuid(),
  
  // Updatable fields
  category: AttachmentCategory.optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: AttachmentStatus.optional()
});

// Batch Operations Request
export const BatchAttachmentOperationReq = z.object({
  tenantId: z.string().uuid(),
  attachmentIds: z.array(z.string().uuid()).min(1).max(50),
  operation: z.enum(['delete', 'archive', 'restore', 'update_category', 'add_tags', 'remove_tags']),
  
  // Operation-specific data
  category: AttachmentCategory.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

// ============================================================================
// OCR PROCESSING
// ============================================================================

// OCR Processing Request
export const ProcessOCRReq = z.object({
  tenantId: z.string().uuid(),
  attachmentId: z.string().uuid(),
  
  // Processing options
  extractText: z.boolean().optional().default(true),
  extractTables: z.boolean().optional().default(true),
  extractMetadata: z.boolean().optional().default(true),
  
  // Document type hints for better extraction
  documentType: z.enum(['invoice', 'receipt', 'bank_statement', 'contract', 'general']).optional(),
  
  // Language hints
  languages: z.array(z.string().length(2)).optional().default(['en']), // ISO 639-1 codes
  
  // Processing priority
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal')
});

// OCR Processing Response
export const ProcessOCRRes = z.object({
  success: z.boolean(),
  jobId: z.string().uuid().optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  estimatedCompletionTime: z.string().datetime().optional(),
  error: z.string().optional()
});

// OCR Results
export const OCRResultsRes = z.object({
  attachmentId: z.string().uuid(),
  status: z.enum(['completed', 'failed', 'processing']),
  confidence: z.number().min(0).max(1),
  
  // Extracted content
  extractedText: z.string().optional(),
  extractedTables: z.array(z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
    confidence: z.number().min(0).max(1)
  })).optional(),
  
  // Structured data (for invoices, receipts, etc.)
  structuredData: z.object({
    documentType: z.string().optional(),
    vendor: z.string().optional(),
    customer: z.string().optional(),
    invoiceNumber: z.string().optional(),
    date: z.string().date().optional(),
    dueDate: z.string().date().optional(),
    totalAmount: z.number().optional(),
    currency: z.string().length(3).optional(),
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number().optional(),
      unitPrice: z.number().optional(),
      amount: z.number().optional()
    })).optional()
  }).optional(),
  
  // Processing metadata
  processedAt: z.string().datetime(),
  processingTime: z.number(), // milliseconds
  error: z.string().optional()
});

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

// Document Approval Request
export const DocumentApprovalReq = z.object({
  tenantId: z.string().uuid(),
  attachmentId: z.string().uuid(),
  
  // Approval workflow
  workflowType: z.enum(['single_approver', 'multi_stage', 'parallel_approval']).optional().default('single_approver'),
  approvers: z.array(z.object({
    userId: z.string().uuid(),
    role: z.string(),
    stage: z.number().int().min(1).optional().default(1),
    isRequired: z.boolean().optional().default(true)
  })).min(1),
  
  // Approval settings
  requireAllApprovers: z.boolean().optional().default(false),
  allowSelfApproval: z.boolean().optional().default(false),
  autoApproveThreshold: z.number().optional(), // Auto-approve if OCR confidence above threshold
  
  // Notification settings
  notifyOnSubmission: z.boolean().optional().default(true),
  notifyOnApproval: z.boolean().optional().default(true),
  reminderInterval: z.number().int().min(1).max(168).optional().default(24), // hours
  
  // Additional context
  comments: z.string().max(1000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  dueDate: z.string().datetime().optional()
});

// Submit Approval Decision Request
export const ApprovalDecisionReq = z.object({
  tenantId: z.string().uuid(),
  attachmentId: z.string().uuid(),
  
  // Decision
  decision: z.enum(['approve', 'reject', 'request_changes']),
  comments: z.string().max(1000).optional(),
  
  // Conditional approval
  conditions: z.array(z.string()).optional(),
  
  // Delegation
  delegateTo: z.string().uuid().optional(),
  delegationReason: z.string().max(500).optional()
});

// Approval Status Response
export const ApprovalStatusRes = z.object({
  attachmentId: z.string().uuid(),
  workflowStatus: z.enum(['not_started', 'in_progress', 'completed', 'rejected', 'cancelled']),
  
  // Current state
  currentStage: z.number().int().optional(),
  totalStages: z.number().int(),
  
  // Approvers
  approvers: z.array(z.object({
    userId: z.string().uuid(),
    userName: z.string(),
    role: z.string(),
    stage: z.number().int(),
    status: z.enum(['pending', 'approved', 'rejected', 'delegated']),
    decision: z.string().optional(),
    comments: z.string().optional(),
    decidedAt: z.string().datetime().optional(),
    delegatedTo: z.string().uuid().optional()
  })),
  
  // Timeline
  submittedAt: z.string().datetime(),
  submittedBy: z.string().uuid(),
  completedAt: z.string().datetime().optional(),
  
  // Metadata
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  dueDate: z.string().datetime().optional(),
  overdue: z.boolean()
});

// ============================================================================
// RETENTION & COMPLIANCE
// ============================================================================

// Document Retention Policy
export const RetentionPolicyReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  
  // Policy definition
  policyName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  
  // Retention rules
  retentionPeriod: z.number().int().min(1), // days
  category: AttachmentCategory.optional(), // Apply to specific category
  entityType: EntityType.optional(), // Apply to specific entity type
  
  // Actions
  actionAfterRetention: z.enum(['archive', 'delete', 'review']).default('archive'),
  notifyBeforeExpiry: z.number().int().min(1).max(365).optional().default(30), // days
  
  // Legal holds
  legalHoldOverride: z.boolean().optional().default(false),
  complianceNotes: z.string().max(1000).optional(),
  
  // Effective dates
  effectiveFrom: z.string().datetime(),
  effectiveUntil: z.string().datetime().optional()
});

// Apply Retention Policy Request
export const ApplyRetentionPolicyReq = z.object({
  tenantId: z.string().uuid(),
  policyId: z.string().uuid(),
  attachmentIds: z.array(z.string().uuid()).optional(), // If not provided, applies to all matching documents
  
  // Override options
  customRetentionUntil: z.string().datetime().optional(),
  reason: z.string().max(500).optional()
});

// Retention Status Response
export const RetentionStatusRes = z.object({
  attachmentId: z.string().uuid(),
  
  // Current retention status
  hasRetentionPolicy: z.boolean(),
  policyName: z.string().optional(),
  retentionUntil: z.string().datetime().optional(),
  daysUntilExpiry: z.number().int().optional(),
  
  // Legal holds
  onLegalHold: z.boolean(),
  legalHoldReason: z.string().optional(),
  legalHoldUntil: z.string().datetime().optional(),
  
  // Compliance
  complianceStatus: z.enum(['compliant', 'expiring_soon', 'expired', 'on_hold']),
  nextAction: z.enum(['none', 'archive', 'delete', 'review']).optional(),
  nextActionDate: z.string().datetime().optional()
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type TUploadAttachmentReq = z.infer<typeof UploadAttachmentReq>;
export type TUploadAttachmentRes = z.infer<typeof UploadAttachmentRes>;
export type TGetAttachmentReq = z.infer<typeof GetAttachmentReq>;
export type TAttachmentDetailsRes = z.infer<typeof AttachmentDetailsRes>;
export type TListAttachmentsReq = z.infer<typeof ListAttachmentsReq>;
export type TListAttachmentsRes = z.infer<typeof ListAttachmentsRes>;
export type TUpdateAttachmentReq = z.infer<typeof UpdateAttachmentReq>;
export type TBatchAttachmentOperationReq = z.infer<typeof BatchAttachmentOperationReq>;
export type TProcessOCRReq = z.infer<typeof ProcessOCRReq>;
export type TProcessOCRRes = z.infer<typeof ProcessOCRRes>;
export type TOCRResultsRes = z.infer<typeof OCRResultsRes>;
export type TDocumentApprovalReq = z.infer<typeof DocumentApprovalReq>;
export type TApprovalDecisionReq = z.infer<typeof ApprovalDecisionReq>;
export type TApprovalStatusRes = z.infer<typeof ApprovalStatusRes>;
export type TRetentionPolicyReq = z.infer<typeof RetentionPolicyReq>;
export type TApplyRetentionPolicyReq = z.infer<typeof ApplyRetentionPolicyReq>;
export type TRetentionStatusRes = z.infer<typeof RetentionStatusRes>;

// Enum exports for convenience
export type TAttachmentCategory = z.infer<typeof AttachmentCategory>;
export type TAttachmentStatus = z.infer<typeof AttachmentStatus>;
export type TRelationshipType = z.infer<typeof RelationshipType>;
export type TEntityType = z.infer<typeof EntityType>;
