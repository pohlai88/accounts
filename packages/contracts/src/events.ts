import { z } from "zod";
export const InvoiceApprovedEvt = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
  idemKey: z.string(),
});
export type TInvoiceApprovedEvt = z.infer<typeof InvoiceApprovedEvt>;
