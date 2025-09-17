// @ts-nocheck
import { inngest } from "../inngestClient.js";
import { sendEmail, logger } from "@aibos/utils";

// V1 Email Workflow with Resend integration
export const emailWorkflow = inngest.createFunction(
  {
    id: "email-workflow",
    name: "Email Workflow",
    retries: 3,
  },
  { event: "email/send" },
  async ({ event, step }: WorkflowArgs) => {
    const {
      to,
      subject,
      template,
      data,
      tenantId,
      companyId,
      priority = "normal",
      attachments = [],
    } = event.data;

    // Step 1: Validate email parameters
    const validatedParams = await step.run("validate-email-params", async () => {
      if (!to || !subject || !template) {
        throw new Error("Missing required email parameters: to, subject, template");
      }

      if (!isValidEmail(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }

      logger.info("Email workflow started", {
        to,
        subject,
        template,
        tenantId,
        companyId,
        priority,
        attachmentCount: attachments.length,
        requestId: event.id,
      });

      return { to, subject, template, data, attachments, priority };
    });

    // Step 2: Generate email content from template
    const emailContent = await step.run("generate-email-content", async () => {
      try {
        const { html, text } = await generateEmailTemplate(
          validatedParams.template,
          validatedParams.data,
        );

        logger.info("Email content generated", {
          template: validatedParams.template,
          htmlLength: html.length,
          textLength: text.length,
        });

        return { html, text };
      } catch (error) {
        logger.error("Email template generation failed", {
          template: validatedParams.template,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    // Step 3: Process attachments if any
    const processedAttachments = await step.run("process-attachments", async () => {
      if (validatedParams.attachments.length === 0) {
        return [];
      }

      const processed: unknown[] = [];

      for (const attachment of validatedParams.attachments) {
        try {
          // If attachment is a file path, fetch from storage
          if (attachment.filePath) {
            const fileContent = await fetchFileFromStorage(attachment.filePath);
            processed.push({
              filename: attachment.filename,
              content: fileContent,
              contentType: attachment.contentType,
            });
          } else if (attachment.content) {
            // Direct content attachment
            processed.push(attachment);
          }
        } catch (error) {
          logger.error("Failed to process attachment", {
            filename: attachment.filename,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue with other attachments
        }
      }

      logger.info("Attachments processed", {
        requested: validatedParams.attachments.length,
        processed: processed.length,
      });

      return processed;
    });

    // Step 4: Send email with retries
    const emailResult = await step.run("send-email", async () => {
      try {
        const result = await sendEmail({
          to: validatedParams.to,
          subject: validatedParams.subject,
          html: emailContent.html,
          text: emailContent.text,
          attachments: processedAttachments,
          from: getFromAddress(validatedParams.template),
          replyTo: getReplyToAddress(tenantId, companyId),
        });

        logger.info("Email sent successfully", {
          to: validatedParams.to,
          subject: validatedParams.subject,
          messageId: result.id,
        });

        return result;
      } catch (error) {
        logger.error("Email sending failed", {
          to: validatedParams.to,
          subject: validatedParams.subject,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    // Step 5: Log email activity
    await step.run("log-email-activity", async () => {
      // Store email activity in audit log
      logger.info("Email activity logged", {
        to: validatedParams.to,
        subject: validatedParams.subject,
        template: validatedParams.template,
        messageId: emailResult.id,
        tenantId,
        companyId,
        sentAt: new Date().toISOString(),
      });
    });

    // Step 6: Send completion notification
    await step.run("notify-completion", async () => {
      await inngest.send({
        name: "email/sent",
        data: {
          to: validatedParams.to,
          subject: validatedParams.subject,
          template: validatedParams.template,
          messageId: emailResult.id,
          tenantId,
          companyId,
          sentAt: new Date().toISOString(),
        },
      });
    });

    return {
      success: true,
      messageId: emailResult.id,
      to: validatedParams.to,
      subject: validatedParams.subject,
    };
  },
);

// Email template generator
async function generateEmailTemplate(
  template: string,
  data: any,
): Promise<{ html: string; text: string }> {
  switch (template) {
    case "invoice_created":
      return generateInvoiceCreatedTemplate(data);
    case "invoice_approved":
      return generateInvoiceApprovedTemplate(data);
    case "payment_received":
      return generatePaymentReceivedTemplate(data);
    case "journal_posted":
      return generateJournalPostedTemplate(data);
    case "system_notification":
      return generateSystemNotificationTemplate(data);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

function generateInvoiceCreatedTemplate(data: any): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
        .content { padding: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Invoice Created</h2>
        </div>
        <div class="content">
          <p>Dear ${data.customerName || "Customer"},</p>
          <p>A new invoice has been created for your account:</p>
          <ul>
            <li><strong>Invoice Number:</strong> ${data.invoiceNumber}</li>
            <li><strong>Amount:</strong> ${data.currency} ${data.amount}</li>
            <li><strong>Due Date:</strong> ${data.dueDate}</li>
          </ul>
          <p>Please review the attached invoice and process payment by the due date.</p>
          <p>Thank you for your business!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from ${data.companyName || "AIBOS"}.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Invoice Created

Dear ${data.customerName || "Customer"},

A new invoice has been created for your account:

Invoice Number: ${data.invoiceNumber}
Amount: ${data.currency} ${data.amount}
Due Date: ${data.dueDate}

Please review the attached invoice and process payment by the due date.

Thank you for your business!

---
This is an automated message from ${data.companyName || "AIBOS"}.
  `;

  return { html, text };
}

function generateInvoiceApprovedTemplate(data: any): { html: string; text: string } {
  const html = `
    <html><body>
      <h2>Invoice Approved</h2>
      <p>Invoice ${data.invoiceNumber} has been approved and is ready for processing.</p>
      <p>Amount: ${data.currency} ${data.amount}</p>
    </body></html>
  `;

  const text = `Invoice Approved\n\nInvoice ${data.invoiceNumber} has been approved and is ready for processing.\nAmount: ${data.currency} ${data.amount}`;

  return { html, text };
}

function generatePaymentReceivedTemplate(data: any): { html: string; text: string } {
  const html = `
    <html><body>
      <h2>Payment Received</h2>
      <p>Payment of ${data.currency} ${data.amount} has been received for invoice ${data.invoiceNumber}.</p>
      <p>Thank you for your payment!</p>
    </body></html>
  `;

  const text = `Payment Received\n\nPayment of ${data.currency} ${data.amount} has been received for invoice ${data.invoiceNumber}.\nThank you for your payment!`;

  return { html, text };
}

function generateJournalPostedTemplate(data: any): { html: string; text: string } {
  const html = `
    <html><body>
      <h2>Journal Entry Posted</h2>
      <p>Journal entry ${data.journalNumber} has been posted successfully.</p>
      <p>Total Amount: ${data.currency} ${data.totalAmount}</p>
    </body></html>
  `;

  const text = `Journal Entry Posted\n\nJournal entry ${data.journalNumber} has been posted successfully.\nTotal Amount: ${data.currency} ${data.totalAmount}`;

  return { html, text };
}

function generateSystemNotificationTemplate(data: any): { html: string; text: string } {
  const html = `
    <html><body>
      <h2>${data.title || "System Notification"}</h2>
      <p>${data.message}</p>
    </body></html>
  `;

  const text = `${data.title || "System Notification"}\n\n${data.message}`;

  return { html, text };
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getFromAddress(template: string): string {
  const fromAddresses: Record<string, string> = {
    invoice_created: process.env.RESEND_FROM_EMAIL || "invoices@aibos.com",
    invoice_approved: process.env.RESEND_FROM_EMAIL || "invoices@aibos.com",
    payment_received: process.env.RESEND_FROM_EMAIL || "payments@aibos.com",
    journal_posted: process.env.RESEND_FROM_EMAIL || "accounting@aibos.com",
    system_notification: process.env.RESEND_FROM_EMAIL || "system@aibos.com",
  };

  return fromAddresses[template] || process.env.RESEND_FROM_EMAIL || "noreply@aibos.com";
}

function getReplyToAddress(_tenantId: string, _companyId: string): string {
  // In production, this could be tenant-specific
  return process.env.RESEND_FROM_EMAIL || "support@aibos.com";
}

async function fetchFileFromStorage(_filePath: string): Promise<Buffer> {
  // Implementation to fetch file from Supabase Storage
  // This would use the Supabase client to download the file
  throw new Error("File storage fetch not implemented yet");
}
