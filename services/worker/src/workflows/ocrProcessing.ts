import { inngest } from "../inngestClient";
import { createServiceClient, logger, getV1AuditService, createV1AuditContext } from "@aibos/utils";
// Note: These types will be used when implementing full OCR processing
// import { ProcessOCRReq, ProcessOCRRes, OCRResultsRes } from "@aibos/contracts";

// V1 OCR Processing Workflow with Inngest
// Supports text extraction, table extraction, and structured data extraction

export const ocrProcessing = inngest.createFunction(
  {
    id: "ocr-processing",
    name: "OCR Document Processing",
    retries: 3,
    concurrency: 3, // Limit concurrent OCR processing for resource management
  },
  { event: "ocr/process" },
  async ({ event, step }) => {
    const {
      tenantId,
      attachmentId,
      extractText = true,
      extractTables = true,
      extractMetadata = true,
      documentType = 'general',
      languages = ['en'],
      priority = 'normal'
    } = event.data as any;

    const supabase = createServiceClient();
    const auditService = getV1AuditService();

    // Create audit context for tracking
    const auditContext = createV1AuditContext({
      url: `/ocr/process/${attachmentId}`,
      method: 'POST',
      headers: new globalThis.Headers(),
      ip: 'worker'
    } as any);

    // Step 1: Validate input and fetch attachment
    const attachmentData = await step.run("validate-and-fetch-attachment", async () => {
      if (!tenantId || !attachmentId) {
        throw new Error("Missing required parameters: tenantId, attachmentId");
      }

      logger.info("OCR processing started", {
        tenantId,
        attachmentId,
        documentType,
        extractText,
        extractTables,
        extractMetadata,
        languages,
        priority,
        requestId: event.id,
      });

      // Fetch attachment details from database
      const { data: attachment, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('id', attachmentId)
        .eq('tenant_id', tenantId)
        .single();

      if (error || !attachment) {
        throw new Error(`Attachment not found: ${attachmentId}`);
      }

      // Validate file type for OCR processing
      const supportedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'application/pdf'
      ];

      if (!supportedMimeTypes.includes(attachment.mime_type)) {
        throw new Error(`Unsupported file type for OCR: ${attachment.mime_type}`);
      }

      // Update OCR status to processing
      await supabase
        .from('attachments')
        .update({
          metadata: {
            ...attachment.metadata,
            ocrStatus: 'processing',
            ocrStartedAt: new Date().toISOString()
          }
        })
        .eq('id', attachmentId);

      // Log OCR processing start
      await auditService.logOperation(auditContext, {
        operation: 'ocr_processing_started',
        data: {
          attachmentId,
          filename: attachment.filename,
          mimeType: attachment.mime_type,
          fileSize: attachment.file_size,
          documentType,
          extractText,
          extractTables,
          extractMetadata
        }
      });

      return {
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mime_type,
        fileSize: attachment.file_size,
        storagePath: attachment.storage_path,
        storageUrl: attachment.storage_url,
        category: attachment.category
      };
    });

    // Step 2: Download file for processing
    const fileBuffer = await step.run("download-file", async () => {
      try {
        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('attachments')
          .download(attachmentData.storagePath);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download file: ${downloadError?.message}`);
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());

        logger.info("File downloaded for OCR", {
          attachmentId,
          filename: attachmentData.filename,
          bufferSize: buffer.length
        });

        return buffer;
      } catch (error) {
        logger.error("File download failed", {
          attachmentId,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    // Step 3: Perform OCR processing
    const ocrResults = await step.run("perform-ocr", async () => {
      try {
        const startTime = Date.now();

        // Initialize OCR results
        const results: any = {
          attachmentId,
          status: 'processing',
          confidence: 0
        };

        // Text extraction
        if (extractText) {
          const textResult = await extractTextFromFile(
            Buffer.from(fileBuffer as any),
            attachmentData.mimeType,
            languages
          );
          results.extractedText = textResult.text;
          results.confidence = Math.max(results.confidence || 0, textResult.confidence);
        }

        // Table extraction
        if (extractTables && attachmentData.mimeType === 'application/pdf') {
          const tableResult = await extractTablesFromPDF(Buffer.from(fileBuffer as any));
          results.extractedTables = tableResult.tables;
          results.confidence = Math.max(results.confidence || 0, tableResult.confidence);
        }

        // Structured data extraction based on document type
        if (extractMetadata) {
          const structuredResult = await extractStructuredData(
            Buffer.from(fileBuffer as any),
            attachmentData.mimeType,
            documentType,
            results.extractedText || ''
          );
          results.structuredData = structuredResult.data;
          results.confidence = Math.max(results.confidence || 0, structuredResult.confidence);
        }

        const processingTime = Date.now() - startTime;

        results.status = 'completed';
        results.processedAt = new Date().toISOString();
        results.processingTime = processingTime;

        logger.info("OCR processing completed", {
          attachmentId,
          processingTime,
          confidence: results.confidence,
          hasText: !!results.extractedText,
          hasStructuredData: !!results.structuredData,
          tableCount: results.extractedTables?.length || 0
        });

        return results as any;
      } catch (error) {
        logger.error("OCR processing failed", {
          attachmentId,
          error: error instanceof Error ? error.message : String(error)
        });

        return {
          attachmentId,
          status: 'failed' as const,
          confidence: 0,
          processedAt: new Date().toISOString(),
          processingTime: 0,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    // Step 4: Store OCR results
    const storageResult = await step.run("store-ocr-results", async () => {
      try {
        // Update attachment with OCR results
        const { error: updateError } = await supabase
          .from('attachments')
          .update({
            metadata: {
              ...attachmentData,
              ocrStatus: ocrResults.status,
              ocrData: {
                extractedText: ocrResults.extractedText,
                extractedTables: ocrResults.extractedTables,
                structuredData: ocrResults.structuredData,
                confidence: ocrResults.confidence,
                processedAt: ocrResults.processedAt,
                processingTime: ocrResults.processingTime,
                error: ocrResults.error
              },
              ocrConfidence: ocrResults.confidence
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', attachmentId);

        if (updateError) {
          throw new Error(`Failed to update attachment: ${updateError.message}`);
        }

        // Log OCR completion
        if (ocrResults.status === 'completed') {
          await auditService.logOperation(auditContext, {
            operation: 'ocr_processing_completed',
            data: {
              attachmentId,
              confidence: ocrResults.confidence,
              processingTime: ocrResults.processingTime,
              hasText: !!ocrResults.extractedText,
              hasStructuredData: !!ocrResults.structuredData,
              tableCount: ocrResults.extractedTables?.length || 0
            }
          });
        } else {
          await auditService.logError(auditContext, 'OCR_PROCESSING_ERROR', {
            operation: 'ocr_processing',
            error: ocrResults.error || 'Unknown OCR processing error',
            data: {
              attachmentId,
              processingTime: ocrResults.processingTime
            }
          });
        }

        logger.info("OCR results stored", {
          attachmentId,
          status: ocrResults.status,
          confidence: ocrResults.confidence
        });

        return { success: true, results: ocrResults };
      } catch (error) {
        logger.error("Failed to store OCR results", {
          attachmentId,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    // Step 5: Trigger downstream processing if needed
    await step.run("trigger-downstream-processing", async () => {
      // If OCR was successful and we have structured data, trigger additional workflows
      if (ocrResults.status === 'completed' && ocrResults.structuredData) {
        const structuredData = ocrResults.structuredData;

        // Trigger invoice processing workflow if this looks like an invoice
        if (attachmentData.category === 'invoice' ||
          structuredData.documentType === 'invoice' ||
          (structuredData.invoiceNumber && structuredData.totalAmount)) {

          await inngest.send({
            name: "invoice/ocr-extracted",
            data: {
              attachmentId,
              tenantId,
              ocrData: structuredData,
              confidence: ocrResults.confidence
            }
          });

          logger.info("Triggered invoice processing workflow", {
            attachmentId,
            invoiceNumber: structuredData.invoiceNumber,
            totalAmount: structuredData.totalAmount
          });
        }

        // Trigger receipt processing workflow if this looks like a receipt
        if (attachmentData.category === 'receipt' ||
          structuredData.documentType === 'receipt') {

          await inngest.send({
            name: "receipt/ocr-extracted",
            data: {
              attachmentId,
              tenantId,
              ocrData: structuredData,
              confidence: ocrResults.confidence
            }
          });

          logger.info("Triggered receipt processing workflow", { attachmentId });
        }
      }

      return { triggered: true };
    });

    return {
      success: storageResult.success,
      attachmentId,
      status: ocrResults.status,
      confidence: ocrResults.confidence,
      processingTime: ocrResults.processingTime,
      hasText: !!ocrResults.extractedText,
      hasStructuredData: !!ocrResults.structuredData,
      tableCount: ocrResults.extractedTables?.length || 0,
      error: ocrResults.error
    };
  }
);

// OCR Helper Functions

async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  languages: string[]
): Promise<{ text: string; confidence: number }> {
  // This is a placeholder implementation
  // In production, you would use libraries like:
  // - Tesseract.js for client-side OCR
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Computer Vision
  // - Tesseract with node-tesseract-ocr

  try {
    if (mimeType === 'application/pdf') {
      // For PDFs, you might use pdf-parse or pdf2pic + OCR
      return await extractTextFromPDF(buffer, languages);
    } else if (mimeType.startsWith('image/')) {
      // For images, use OCR directly
      return await extractTextFromImage(buffer, languages);
    }

    throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
  } catch (error) {
    logger.error("Text extraction failed", {
      mimeType,
      error: error instanceof Error ? error.message : String(error)
    });
    return { text: '', confidence: 0 };
  }
}

async function extractTextFromPDF(
  _buffer: Buffer,
  _languages: string[]
): Promise<{ text: string; confidence: number }> {
  // Placeholder implementation
  // In production, use libraries like pdf-parse, pdf2pic + tesseract, or cloud APIs

  try {
    // Simulate PDF text extraction
    const text = `[PDF TEXT EXTRACTION PLACEHOLDER]
This is simulated text extracted from a PDF document.
In production, this would use actual OCR libraries or cloud services.`;

    return { text, confidence: 0.85 };
  } catch {
    return { text: '', confidence: 0 };
  }
}

async function extractTextFromImage(
  _buffer: Buffer,
  _languages: string[]
): Promise<{ text: string; confidence: number }> {
  // Placeholder implementation
  // In production, use Tesseract.js, cloud OCR APIs, or other OCR libraries

  try {
    // Simulate image text extraction
    const text = `[IMAGE TEXT EXTRACTION PLACEHOLDER]
This is simulated text extracted from an image.
In production, this would use actual OCR libraries or cloud services.`;

    return { text, confidence: 0.80 };
  } catch {
    return { text: '', confidence: 0 };
  }
}

async function extractTablesFromPDF(
  _buffer: Buffer
): Promise<{ tables: Array<{ headers: string[]; rows: string[][]; confidence: number }>; confidence: number }> {
  // Placeholder implementation
  // In production, use libraries like tabula-js, camelot-py via API, or cloud services

  try {
    const tables = [
      {
        headers: ['Description', 'Quantity', 'Unit Price', 'Amount'],
        rows: [
          ['Sample Item 1', '2', '$10.00', '$20.00'],
          ['Sample Item 2', '1', '$15.00', '$15.00']
        ],
        confidence: 0.90
      }
    ];

    return { tables, confidence: 0.90 };
  } catch {
    return { tables: [], confidence: 0 };
  }
}

async function extractStructuredData(
  _buffer: Buffer,
  mimeType: string,
  documentType: string,
  extractedText: string
): Promise<{ data: Record<string, unknown>; confidence: number }> {
  // Placeholder implementation for structured data extraction
  // In production, this would use NLP, regex patterns, or ML models

  try {
    const data: Record<string, unknown> = {
      documentType
    };

    // Simple pattern matching for common document types
    if (documentType === 'invoice' || extractedText.toLowerCase().includes('invoice')) {
      // Extract invoice-specific data
      data.documentType = 'invoice';

      // Simulate invoice number extraction
      const invoiceMatch = extractedText.match(/invoice\s*#?\s*(\w+)/i);
      if (invoiceMatch) {
        data.invoiceNumber = invoiceMatch[1];
      }

      // Simulate total amount extraction
      const totalMatch = extractedText.match(/total[:\s]*\$?(\d+\.?\d*)/i);
      if (totalMatch) {
        data.totalAmount = parseFloat(totalMatch[1] || '0');
        data.currency = 'USD'; // Default currency
      }

      // Simulate date extraction
      const dateMatch = extractedText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) {
        data.date = dateMatch[1];
      }

      return { data, confidence: 0.75 };
    }

    if (documentType === 'receipt' || extractedText.toLowerCase().includes('receipt')) {
      data.documentType = 'receipt';

      // Extract receipt-specific data
      const totalMatch = extractedText.match(/total[:\s]*\$?(\d+\.?\d*)/i);
      if (totalMatch) {
        data.totalAmount = parseFloat(totalMatch[1] || '0');
        data.currency = 'USD';
      }

      return { data, confidence: 0.70 };
    }

    // For other document types, return basic metadata
    return {
      data: {
        documentType: 'general',
        textLength: extractedText.length,
        mimeType
      },
      confidence: 0.60
    };

  } catch (error) {
    logger.error("Structured data extraction failed", {
      documentType,
      error: error instanceof Error ? error.message : String(error)
    });
    return { data: {}, confidence: 0 };
  }
}

export default ocrProcessing;
