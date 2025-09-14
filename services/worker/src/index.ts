// V1 Inngest Worker - Main Entry Point
import { serve } from "inngest/next";
import { inngest } from "./inngestClient";

// Import all workflow functions
import { fxRateIngestion } from "./workflows/fxRateIngestion";
import { pdfGeneration } from "./workflows/pdfGeneration";
import { emailWorkflow } from "./workflows/emailWorkflow";
import { dlqHandler, dlqRetryHandler } from "./workflows/dlqHandler";
import { invoiceApproved } from "./workflows/invoiceApproved";
import { ocrProcessing } from "./workflows/ocrProcessing";
import {
  documentApprovalWorkflow,
  documentApprovalDecision,
  documentApprovalReminder,
} from "./workflows/documentApproval";
import {
  documentRetentionPolicy,
  documentRetentionMonitor,
  documentLegalHold,
} from "./workflows/documentRetention";
import { fxRateIngestJob, fxRateIngestManual, fxRateStalnessAlert } from "./fx-ingest";

// V1 Inngest Functions Registry
export const inngestFunctions = [
  fxRateIngestion,
  pdfGeneration,
  emailWorkflow,
  dlqHandler,
  dlqRetryHandler,
  invoiceApproved,
  ocrProcessing,
  documentApprovalWorkflow,
  documentApprovalDecision,
  documentApprovalReminder,
  documentRetentionPolicy,
  documentRetentionMonitor,
  documentLegalHold,
  fxRateIngestJob,
  fxRateIngestManual,
  fxRateStalnessAlert,
];

// Export the serve handler for Next.js API routes
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});

// For standalone server deployment
if (process.env.NODE_ENV === "production") {
  console.log(
    "🚀 AIBOS Worker started with functions:",
    inngestFunctions.map(f => f.name),
  );
}
