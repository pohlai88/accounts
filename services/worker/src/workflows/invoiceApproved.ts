import { z } from "zod";
import { inngest } from "../inngestClient";
import { sendEmail, createServiceClient } from "@aibos/utils";
import { renderPdf } from "@aibos/utils/server";

export const invoiceApprovedEvt = z.object({
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
  idemKey: z.string()
});

export const invoiceApproved = inngest.createFunction(
  { id: "invoice-approved" },
  { event: "accounting.invoice.approved", schema: invoiceApprovedEvt },
  async ({ event, step }) => {
    const html = await step.run("build-html", async () =>
      `<html><body><h1>Invoice ${event.data.invoiceId}</h1></body></html>`
    );

    const pdf = await step.run("render-pdf", async () => renderPdf({ html })) as unknown as Buffer;

    const { url } = await step.run("store-pdf", async () => {
      const supabase = createServiceClient();
      const filePath = `${event.data.tenantId}/invoices/${event.data.invoiceId}.pdf`;

      const { error } = await supabase.storage
        .from("documents")
        .upload(filePath, pdf, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      return {
        url: supabase.storage.from("documents").getPublicUrl(filePath).data.publicUrl,
      };
    });

    if (event.data.customerEmail) {
      await step.run("email", async () =>
        sendEmail({
          to: event.data.customerEmail!,
          subject: `Invoice ${event.data.invoiceId}`,
          html: `<p>Your invoice is ready. <a href="${url}">Download here</a></p>`,
          text: `Your invoice is ready. Download: ${url}`,
        })
      );
    }

    return { url };
  }
);
