import { z } from "zod";

export const JournalLine = z.object({
  accountId: z.string().uuid(),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  description: z.string().max(200).optional(),
  reference: z.string().max(100).optional()
});

export const PostJournalReq = z.object({
  journalNumber: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  journalDate: z.string().datetime(), // ISO 8601
  currency: z.string().length(3), // ISO 4217
  lines: z.array(JournalLine).min(2).max(100), // Must have at least 2 lines for double-entry
  idempotencyKey: z.string().uuid()
});

export const PostJournalRes = z.object({
  id: z.string().uuid(),
  journalNumber: z.string(),
  status: z.enum(['draft', 'posted', 'pending_approval']),
  postedAt: z.string().datetime().nullable(),
  requiresApproval: z.boolean(),
  approverRoles: z.array(z.string()).optional(),
  totalDebit: z.number(),
  totalCredit: z.number()
});

export const PostingErrorRes = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  })
});

// Create Journal (Draft) - separate from posting
export const CreateJournalReq = z.object({
  journalNumber: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  journalDate: z.string().datetime(),
  currency: z.string().length(3),
  lines: z.array(JournalLine).min(1).max(100)
});

export const CreateJournalRes = z.object({
  id: z.string().uuid(),
  journalNumber: z.string(),
  status: z.literal('draft'),
  createdAt: z.string().datetime()
});

export type TPostJournalReq = z.infer<typeof PostJournalReq>;
export type TPostJournalRes = z.infer<typeof PostJournalRes>;
export type TPostingErrorRes = z.infer<typeof PostingErrorRes>;
export type TCreateJournalReq = z.infer<typeof CreateJournalReq>;
export type TCreateJournalRes = z.infer<typeof CreateJournalRes>;
