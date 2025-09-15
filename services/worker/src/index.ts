// V1 Inngest Worker - Main Entry Point
import { serve } from "inngest/next";
import { inngest } from "./inngestClient.js";

// Import all workflow functions
import { fxRateIngestion } from "./workflows/fxRateIngestion.js";
import { pdfGeneration } from "./workflows/pdfGeneration.js";
import { emailWorkflow } from "./workflows/emailWorkflow.js";
import { dlqHandler, dlqRetryHandler } from "./workflows/dlqHandler.js";
import { invoiceApproved } from "./workflows/invoiceApproved.js";
import { ocrProcessing } from "./workflows/ocrProcessing.js";
import {
  documentApprovalWorkflow,
  documentApprovalDecision,
  documentApprovalReminder,
} from "./workflows/documentApproval.js";
import {
  documentRetentionPolicy,
  documentRetentionMonitor,
  documentLegalHold,
} from "./workflows/documentRetention.js";
import { fxRateIngestJob, fxRateIngestManual, fxRateStalnessAlert } from "./fx-ingest.js";

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
  inngestFunctions.map((f) => (f as { name: string }).name),
  );
}
