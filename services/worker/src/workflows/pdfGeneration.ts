import { inngest } from "../inngestClient";
import { createServiceClient, logger } from "@aibos/utils";
import { renderPdf } from "@aibos/utils/server";

// V1 PDF Generation with Puppeteer pool and health checks
export const pdfGeneration = inngest.createFunction(
  {
    id: "pdf-generation",
    name: "PDF Generation",
    retries: 3,
    concurrency: 5, // Limit concurrent PDF generation
  },
  { event: "pdf/generate" },
  async ({ event, step }) => {
    const {
      templateType,
      data,
      tenantId,
      companyId,
      entityId,
      entityType
    } = event.data;

    // Step 1: Validate input and prepare template
    const templateData = await step.run("prepare-template", async () => {
      if (!templateType || !data || !tenantId || !companyId) {
        throw new Error("Missing required PDF generation parameters");
      }

      logger.info("PDF generation started", {
        templateType,
        tenantId,
        companyId,
        entityId,
        entityType,
        requestId: event.id,
      });

      // Generate HTML template based on type
      const html = await generateTemplate(templateType, data);

      return {
        html,
        templateType,
        metadata: {
          tenantId,
          companyId,
          entityId,
          entityType,
          generatedAt: new Date().toISOString(),
        },
      };
    });

    // Step 2: Generate PDF with retries and timeout
    const pdfBuffer = await step.run("generate-pdf", async () => {
      try {
        const startTime = Date.now();

        // V1 requirement: 45s timeout cap
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("PDF generation timeout (45s)")), 45000);
        });

        const pdfPromise = renderPdf({
          html: templateData.html,
          margin: {
            top: "20mm",
            right: "15mm",
            bottom: "20mm",
            left: "15mm",
          },
          headerHtml: generateHeader(templateData.metadata),
          footerHtml: generateFooter(templateData.metadata),
        });

        const pdf = await Promise.race([pdfPromise, timeoutPromise]) as Buffer;

        if (!Buffer.isBuffer(pdf)) {
          throw new Error("PDF generation did not return a Buffer");
        }

        const duration = Date.now() - startTime;

        logger.info("PDF generated successfully", {
          templateType: templateData.templateType,
          duration,
          sizeKB: Math.round(pdf.length / 1024),
        });

        return pdf;
      } catch (error) {
        logger.error("PDF generation failed", {
          templateType: templateData.templateType,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    // Step 3: Store PDF in Supabase Storage
    const storageResult = await step.run("store-pdf", async () => {
      const supabase = createServiceClient();

      const fileName = `${templateData.templateType}-${entityId}-${Date.now()}.pdf`;
      const filePath = `${tenantId}/${companyId}/pdfs/${fileName}`;

      try {
        const { error } = await supabase.storage
          .from("documents")
          .upload(filePath, pdfBuffer as unknown as Buffer, {
            contentType: "application/pdf",
            upsert: false,
          });

        if (error) {
          throw new Error(`Storage upload failed: ${error.message}`);
        }

        logger.info("PDF stored successfully", {
          filePath,
          fileName,
          sizeKB: Math.round((pdfBuffer as unknown as Buffer).length / 1024),
        });

        return {
          filePath,
          fileName,
          publicUrl: supabase.storage.from("documents").getPublicUrl(filePath).data.publicUrl,
        };
      } catch (error) {
        logger.error("PDF storage failed", {
          filePath,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    // Step 4: Update entity with PDF reference
    await step.run("update-entity-reference", async () => {
      if (!entityId || !entityType) return;

      const supabase = createServiceClient();

      try {
        // Store PDF reference in attachments table
        const { error } = await supabase
          .from("attachments")
          .insert({
            tenant_id: tenantId,
            company_id: companyId,
            entity_type: entityType,
            entity_id: entityId,
            file_name: storageResult.fileName,
            file_path: storageResult.filePath,
            file_type: "application/pdf",
            file_size: (pdfBuffer as unknown as Buffer).length,
            created_by: null, // System generated
          });

        if (error) {
          logger.error("Failed to create attachment record", {
            error: error.message,
          });
        }
      } catch (error) {
        logger.error("Database error creating attachment", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Step 5: Send completion notification
    await step.run("notify-completion", async () => {
      await inngest.send({
        name: "pdf/generated",
        data: {
          templateType: templateData.templateType,
          filePath: storageResult.filePath,
          fileName: storageResult.fileName,
          publicUrl: storageResult.publicUrl,
          tenantId,
          companyId,
          entityId,
          entityType,
          sizeKB: Math.round((pdfBuffer as unknown as Buffer).length / 1024),
        },
      });
    });

    return {
      success: true,
      filePath: storageResult.filePath,
      fileName: storageResult.fileName,
      publicUrl: storageResult.publicUrl,
      sizeKB: Math.round((pdfBuffer as unknown as Buffer).length / 1024),
    };
  }
);

// Template generators
async function generateTemplate(templateType: string, data: any): Promise<string> {
  switch (templateType) {
    case "invoice":
      return generateInvoiceTemplate(data);
    case "journal":
      return generateJournalTemplate(data);
    case "balance_sheet":
      return generateBalanceSheetTemplate(data);
    case "profit_loss":
      return generateProfitLossTemplate(data);
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

function generateInvoiceTemplate(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #333; }
        .invoice-details { margin: 20px 0; }
        .line-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .line-items th, .line-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .line-items th { background-color: #f2f2f2; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">INVOICE</div>
        <div>Invoice #: ${data.invoiceNumber}</div>
        <div>Date: ${data.date}</div>
      </div>
      
      <div class="invoice-details">
        <div><strong>Bill To:</strong></div>
        <div>${data.customer?.name || 'N/A'}</div>
        <div>${data.customer?.address || ''}</div>
      </div>

      <table class="line-items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.lineItems?.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${item.rate}</td>
              <td>${item.amount}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No items</td></tr>'}
        </tbody>
      </table>

      <div class="total">
        Total: ${data.currency} ${data.total || '0.00'}
      </div>
    </body>
    </html>
  `;
}

function generateJournalTemplate(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Journal Entry ${data.journalNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .journal-title { font-size: 24px; font-weight: bold; color: #333; }
        .journal-lines { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .journal-lines th, .journal-lines td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .journal-lines th { background-color: #f2f2f2; }
        .totals { margin-top: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="journal-title">JOURNAL ENTRY</div>
        <div>Journal #: ${data.journalNumber}</div>
        <div>Date: ${data.date}</div>
        <div>Description: ${data.description || ''}</div>
      </div>

      <table class="journal-lines">
        <thead>
          <tr>
            <th>Account</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          ${data.lines?.map((line: any) => `
            <tr>
              <td>${line.accountName}</td>
              <td>${line.description || ''}</td>
              <td>${line.debit > 0 ? line.debit : ''}</td>
              <td>${line.credit > 0 ? line.credit : ''}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No lines</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <div>Total Debits: ${data.totalDebit || '0.00'}</div>
        <div>Total Credits: ${data.totalCredit || '0.00'}</div>
      </div>
    </body>
    </html>
  `;
}

function generateBalanceSheetTemplate(_data: any): string {
  return `<html><body><h1>Balance Sheet</h1><p>Generated: ${new Date().toISOString()}</p></body></html>`;
}

function generateProfitLossTemplate(_data: any): string {
  return `<html><body><h1>Profit & Loss</h1><p>Generated: ${new Date().toISOString()}</p></body></html>`;
}

function generateHeader(metadata: any): string {
  return `
    <div style="font-size: 10px; text-align: center; margin: 10px;">
      ${metadata.companyName || 'Company Name'} | Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}
    </div>
  `;
}

function generateFooter(_metadata: any): string {
  return `
    <div style="font-size: 10px; text-align: center; margin: 10px;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Confidential
    </div>
  `;
}
