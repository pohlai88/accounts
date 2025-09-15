/* Optional Zod schemas – narrow unknown payloads safely inside workflows */
import { z } from "zod";

export const AttachmentSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
  name: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  contentType: z.string().optional(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Example pattern – replace with your real event contracts
 * Usage in workflow:
 *   const payload = ApprovalRequested.parse(event.data);
 */
export const ApprovalRequested = z.object({
  approverId: z.string(),
  amount: z.number(),
  currency: z.string().length(3),
  entityId: z.string(),
});
export type ApprovalRequested = z.infer<typeof ApprovalRequested>;
