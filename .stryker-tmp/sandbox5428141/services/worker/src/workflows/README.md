# Workflows — Background Processing Workflows

> **TL;DR**: Inngest-powered background processing workflows for FX rate ingestion, document
> processing, email workflows, and system automation.  
> **Owner**: @aibos/worker-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- FX rate ingestion and processing
- Document approval workflows
- Document retention management
- Email workflow automation
- Invoice approval processing
- OCR processing workflows
- PDF generation workflows
- Dead letter queue handling

**Does NOT**:

- Handle business logic (delegated to @aibos/accounting)
- Manage data operations (delegated to @aibos/db)
- Process authentication (delegated to @aibos/auth)
- Generate reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web-api, @aibos/accounting, external workflow systems

## 2) Quick Links

- **FX Rate Ingestion**: `fxRateIngestion.ts`
- **Document Approval**: `documentApproval.ts`
- **Document Retention**: `documentRetention.ts`
- **Email Workflow**: `emailWorkflow.ts`
- **Invoice Approved**: `invoiceApproved.ts`
- **OCR Processing**: `ocrProcessing.ts`
- **PDF Generation**: `pdfGeneration.ts`
- **DLQ Handler**: `dlqHandler.ts`

## 3) Getting Started

```typescript
import {
  fxRateIngestion,
  documentApproval,
  documentRetention,
  emailWorkflow,
  invoiceApproved,
  ocrProcessing,
  pdfGeneration,
  dlqHandler,
} from "@aibos/worker/workflows";

// Trigger FX rate ingestion
await inngest.send({
  name: "fx/rates.ingest",
  data: {
    currencyPairs: ["USD/MYR", "EUR/MYR"],
    source: "primary",
  },
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- Inngest for workflow orchestration
- @aibos/utils for utility functions
- @aibos/accounting for business logic
- @aibos/db for data operations
- External APIs for FX rates and services

**Dependents**:

- @aibos/web-api for workflow triggers
- @aibos/accounting for business logic integration
- External systems for workflow automation

**Build Order**: Depends on @aibos/utils, @aibos/accounting, @aibos/db

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/worker dev
pnpm --filter @aibos/worker test
```

**Testing**:

```bash
pnpm --filter @aibos/worker test src/workflows/
```

**Linting**:

```bash
pnpm --filter @aibos/worker lint src/workflows/
```

**Type Checking**:

```bash
pnpm --filter @aibos/worker typecheck
```

## 6) API Surface

**Exports**:

### FX Rate Ingestion (`fxRateIngestion.ts`)

- `fxRateIngestion` - FX rate ingestion workflow
- Event: `fx/rates.ingest`
- Retries: 3
- Timeout: 5 minutes

### Document Approval (`documentApproval.ts`)

- `documentApproval` - Document approval workflow
- Event: `document/approval.requested`
- Retries: 2
- Timeout: 10 minutes

### Document Retention (`documentRetention.ts`)

- `documentRetention` - Document retention workflow
- Event: `document/retention.process`
- Retries: 1
- Timeout: 30 minutes

### Email Workflow (`emailWorkflow.ts`)

- `emailWorkflow` - Email workflow automation
- Event: `email/send`
- Retries: 3
- Timeout: 2 minutes

### Invoice Approved (`invoiceApproved.ts`)

- `invoiceApproved` - Invoice approval processing
- Event: `invoice/approved`
- Retries: 2
- Timeout: 5 minutes

### OCR Processing (`ocrProcessing.ts`)

- `ocrProcessing` - OCR processing workflow
- Event: `document/ocr.process`
- Retries: 2
- Timeout: 15 minutes

### PDF Generation (`pdfGeneration.ts`)

- `pdfGeneration` - PDF generation workflow
- Event: `document/pdf.generate`
- Retries: 2
- Timeout: 10 minutes

### DLQ Handler (`dlqHandler.ts`)

- `dlqHandler` - Dead letter queue handler
- Event: `inngest/function.failed`
- Retries: 1
- Timeout: 5 minutes

**Public Types**:

- `WorkflowEvent` - Workflow event interface
- `WorkflowStep` - Workflow step interface
- `WorkflowResult` - Workflow result interface
- `WorkflowError` - Workflow error interface

## 7) Performance & Monitoring

**Bundle Size**: ~50KB minified  
**Performance Budget**: <5s for workflow execution, <1s for step execution  
**Monitoring**: Inngest telemetry and custom monitoring

## 8) Security & Compliance

**Permissions**:

- Workflow execution requires proper authentication
- Document processing requires authorization
- Email sending requires security clearance

**Data Handling**:

- All workflow data validated and sanitized
- Secure document processing
- Audit trail for workflow operations

**Compliance**:

- V1 compliance for workflow operations
- SoD enforcement for workflow execution
- Security audit compliance

## 9) Usage Examples

### FX Rate Ingestion

```typescript
import { fxRateIngestion } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger FX rate ingestion
async function triggerFxRateIngestion() {
  await inngest.send({
    name: "fx/rates.ingest",
    data: {
      currencyPairs: ["USD/MYR", "EUR/MYR", "GBP/MYR"],
      source: "primary",
    },
  });
}

// Handle FX rate ingestion result
fxRateIngestion.onSuccess(result => {
  console.log("FX rates ingested successfully:", result);
});

fxRateIngestion.onFailure(error => {
  console.error("FX rate ingestion failed:", error);
});
```

### Document Approval

```typescript
import { documentApproval } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger document approval
async function triggerDocumentApproval(documentId: string, approverId: string) {
  await inngest.send({
    name: "document/approval.requested",
    data: {
      documentId,
      approverId,
      documentType: "invoice",
      priority: "high",
    },
  });
}

// Handle document approval result
documentApproval.onSuccess(result => {
  console.log("Document approved:", result);
});

documentApproval.onFailure(error => {
  console.error("Document approval failed:", error);
});
```

### Email Workflow

```typescript
import { emailWorkflow } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger email workflow
async function triggerEmailWorkflow(recipient: string, template: string, data: any) {
  await inngest.send({
    name: "email/send",
    data: {
      recipient,
      template,
      data,
      priority: "normal",
    },
  });
}

// Handle email workflow result
emailWorkflow.onSuccess(result => {
  console.log("Email sent successfully:", result);
});

emailWorkflow.onFailure(error => {
  console.error("Email sending failed:", error);
});
```

### OCR Processing

```typescript
import { ocrProcessing } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger OCR processing
async function triggerOcrProcessing(documentId: string, fileUrl: string) {
  await inngest.send({
    name: "document/ocr.process",
    data: {
      documentId,
      fileUrl,
      documentType: "invoice",
      language: "en",
    },
  });
}

// Handle OCR processing result
ocrProcessing.onSuccess(result => {
  console.log("OCR processing completed:", result);
});

ocrProcessing.onFailure(error => {
  console.error("OCR processing failed:", error);
});
```

### PDF Generation

```typescript
import { pdfGeneration } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger PDF generation
async function triggerPdfGeneration(documentId: string, template: string, data: any) {
  await inngest.send({
    name: "document/pdf.generate",
    data: {
      documentId,
      template,
      data,
      format: "A4",
      orientation: "portrait",
    },
  });
}

// Handle PDF generation result
pdfGeneration.onSuccess(result => {
  console.log("PDF generated successfully:", result);
});

pdfGeneration.onFailure(error => {
  console.error("PDF generation failed:", error);
});
```

### Document Retention

```typescript
import { documentRetention } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger document retention
async function triggerDocumentRetention(tenantId: string, retentionPolicy: string) {
  await inngest.send({
    name: "document/retention.process",
    data: {
      tenantId,
      retentionPolicy,
      documentTypes: ["invoice", "bill", "receipt"],
      action: "archive",
    },
  });
}

// Handle document retention result
documentRetention.onSuccess(result => {
  console.log("Document retention completed:", result);
});

documentRetention.onFailure(error => {
  console.error("Document retention failed:", error);
});
```

### Invoice Approval

```typescript
import { invoiceApproved } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Trigger invoice approval
async function triggerInvoiceApproval(invoiceId: string, approverId: string) {
  await inngest.send({
    name: "invoice/approved",
    data: {
      invoiceId,
      approverId,
      approvalLevel: "manager",
      comments: "Approved for payment",
    },
  });
}

// Handle invoice approval result
invoiceApproved.onSuccess(result => {
  console.log("Invoice approval processed:", result);
});

invoiceApproved.onFailure(error => {
  console.error("Invoice approval failed:", error);
});
```

### Dead Letter Queue Handler

```typescript
import { dlqHandler } from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// DLQ handler automatically processes failed workflows
dlqHandler.onFailure(error => {
  console.error("DLQ handler failed:", error);
  // Send alert to monitoring system
  sendAlert({
    type: "workflow_failure",
    message: "DLQ handler failed",
    error: error.message,
  });
});

// Manual DLQ processing
async function processDLQ() {
  const failedWorkflows = await inngest.getFailedWorkflows();

  for (const workflow of failedWorkflows) {
    try {
      await dlqHandler.process(workflow);
    } catch (error) {
      console.error("Failed to process DLQ item:", error);
    }
  }
}
```

### Advanced Workflow Orchestration

```typescript
import {
  fxRateIngestion,
  documentApproval,
  emailWorkflow,
  pdfGeneration,
} from "@aibos/worker/workflows";
import { inngest } from "@aibos/worker/inngestClient";

// Complex workflow orchestration
async function processInvoiceWorkflow(invoiceId: string) {
  try {
    // Step 1: Generate PDF
    await inngest.send({
      name: "document/pdf.generate",
      data: {
        documentId: invoiceId,
        template: "invoice",
        data: { invoiceId },
      },
    });

    // Step 2: Send for approval
    await inngest.send({
      name: "document/approval.requested",
      data: {
        documentId: invoiceId,
        approverId: "manager-123",
        documentType: "invoice",
      },
    });

    // Step 3: Send email notification
    await inngest.send({
      name: "email/send",
      data: {
        recipient: "manager@company.com",
        template: "invoice-approval",
        data: { invoiceId },
      },
    });

    console.log("Invoice workflow triggered successfully");
  } catch (error) {
    console.error("Failed to trigger invoice workflow:", error);
    throw error;
  }
}

// Workflow monitoring
function setupWorkflowMonitoring() {
  // Monitor all workflows
  const workflows = [fxRateIngestion, documentApproval, emailWorkflow, pdfGeneration];

  workflows.forEach(workflow => {
    workflow.onSuccess(result => {
      console.log(`Workflow ${workflow.id} succeeded:`, result);
    });

    workflow.onFailure(error => {
      console.error(`Workflow ${workflow.id} failed:`, error);
      // Send alert
      sendAlert({
        type: "workflow_failure",
        workflow: workflow.id,
        error: error.message,
      });
    });
  });
}
```

## 10) Troubleshooting

**Common Issues**:

- **Workflow Not Triggering**: Check event name and data format
- **Workflow Failing**: Check error logs and retry configuration
- **Timeout Issues**: Check step timeout configuration
- **Memory Issues**: Check workflow memory usage and optimization

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_WORKFLOWS = "true";
```

**Logs**: Check Inngest dashboard and application logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex workflow logic

**Testing**:

- Test all workflow functions
- Test error handling and retries
- Test workflow orchestration
- Test performance and timeouts

**Review Process**:

- All workflow functions must be validated
- Error handling must be comprehensive
- Performance must be optimized
- Security must be verified

---

## 📚 **Additional Resources**

- [Worker Package README](../../README.md)
- [Services README](../../README.md)
- [Accounting Package](../../../packages/accounting/README.md)
- [Utils Package](../../../packages/utils/README.md)
- [Web API Package](../../../apps/web-api/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
