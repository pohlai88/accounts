// OCR Processing API for Attachments
// V1 compliance: Trigger and manage OCR processing with job tracking

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createServiceClient,
  extractV1UserContext,
  getV1AuditService,
  createV1AuditContext
} from '@aibos/utils';
import { ProcessOCRReq, ProcessOCRRes, OCRResultsRes } from '@aibos/contracts';
import { Inngest } from 'inngest';

// Create Inngest client for triggering OCR jobs
const inngest = new Inngest({ id: "web-api" });

// POST /api/attachments/ocr - Trigger OCR processing
export async function POST(request: NextRequest) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);
  const supabase = createServiceClient();

  let body: any;

  try {
    body = await request.json();
    const validatedData = ProcessOCRReq.parse(body);

    if (!userContext.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 401 }
      );
    }

    // Verify attachment exists and user has access
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('id, filename, mime_type, file_size, status, metadata')
      .eq('id', validatedData.attachmentId)
      .eq('tenant_id', validatedData.tenantId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if attachment is suitable for OCR
    const supportedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'application/pdf'
    ];

    if (!supportedMimeTypes.includes(attachment.mime_type)) {
      return NextResponse.json(
        { error: `File type ${attachment.mime_type} is not supported for OCR processing` },
        { status: 400 }
      );
    }

    // Check if OCR is already in progress
    const currentOcrStatus = attachment.metadata?.ocrStatus;
    if (currentOcrStatus === 'processing') {
      return NextResponse.json(
        { error: 'OCR processing is already in progress for this attachment' },
        { status: 409 }
      );
    }

    // Generate job ID for tracking
    const jobId = crypto.randomUUID();

    // Update attachment to mark OCR as queued
    const { error: updateError } = await supabase
      .from('attachments')
      .update({
        metadata: {
          ...attachment.metadata,
          ocrStatus: 'queued',
          ocrJobId: jobId,
          ocrQueuedAt: new Date().toISOString(),
          ocrRequestedBy: userContext.userId
        }
      })
      .eq('id', validatedData.attachmentId);

    if (updateError) {
      await auditService.logError(auditContext, 'OCR_QUEUE_ERROR', {
        operation: 'ocr_processing_queue',
        error: updateError.message,
        data: { attachmentId: validatedData.attachmentId }
      });

      return NextResponse.json(
        { error: 'Failed to queue OCR processing' },
        { status: 500 }
      );
    }

    // Send OCR processing job to Inngest
    try {
      await inngest.send({
        name: "ocr/process",
        data: {
          ...validatedData,
          jobId,
          userId: userContext.userId
        }
      });

      // Estimate completion time based on file size and priority
      const baseProcessingTime = Math.max(30, Math.min(300, attachment.file_size / 1024 / 10)); // 30s to 5min based on file size
      const priorityMultiplier = validatedData.priority === 'high' ? 0.5 :
        validatedData.priority === 'low' ? 2 : 1;
      const estimatedSeconds = baseProcessingTime * priorityMultiplier;

      const estimatedCompletionTime = new Date();
      estimatedCompletionTime.setSeconds(estimatedCompletionTime.getSeconds() + estimatedSeconds);

      // Audit log: OCR processing queued
      await auditService.logOperation(auditContext, {
        operation: 'ocr_processing_queued',
        data: {
          attachmentId: validatedData.attachmentId,
          filename: attachment.filename,
          jobId,
          documentType: validatedData.documentType,
          extractText: validatedData.extractText,
          extractTables: validatedData.extractTables,
          extractMetadata: validatedData.extractMetadata,
          priority: validatedData.priority,
          estimatedCompletionTime: estimatedCompletionTime.toISOString()
        }
      });

      const response: any = {
        success: true,
        jobId,
        status: 'queued',
        estimatedCompletionTime: estimatedCompletionTime.toISOString()
      };

      return NextResponse.json(response);

    } catch (inngestError) {
      // Revert the attachment status if Inngest fails
      await supabase
        .from('attachments')
        .update({
          metadata: {
            ...attachment.metadata,
            ocrStatus: 'failed',
            ocrError: inngestError instanceof Error ? inngestError.message : String(inngestError)
          }
        })
        .eq('id', validatedData.attachmentId);

      await auditService.logError(auditContext, 'OCR_QUEUE_ERROR', {
        operation: 'ocr_processing_queue',
        error: inngestError instanceof Error ? inngestError.message : String(inngestError),
        data: { attachmentId: validatedData.attachmentId, jobId }
      });

      return NextResponse.json(
        { error: 'Failed to queue OCR processing job' },
        { status: 500 }
      );
    }

  } catch (error) {
    await auditService.logError(auditContext, 'OCR_PROCESSING_ERROR', {
      operation: 'ocr_processing_request',
      error: error instanceof Error ? error.message : String(error),
      data: { requestBody: body }
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/attachments/ocr - Get OCR results
export async function GET(request: NextRequest) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);
  const supabase = createServiceClient();

  try {
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get('attachmentId');
    const tenantId = url.searchParams.get('tenantId');
    const jobId = url.searchParams.get('jobId');

    if (!attachmentId || !tenantId) {
      return NextResponse.json(
        { error: 'attachmentId and tenantId are required' },
        { status: 400 }
      );
    }

    if (!userContext.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 401 }
      );
    }

    // Fetch attachment with OCR data
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('id, filename, metadata')
      .eq('id', attachmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    const ocrData = attachment.metadata?.ocrData;
    const ocrStatus = attachment.metadata?.ocrStatus || 'not_started';
    const ocrJobId = attachment.metadata?.ocrJobId;
    const ocrError = attachment.metadata?.ocrError;

    // If jobId is provided, verify it matches
    if (jobId && ocrJobId !== jobId) {
      return NextResponse.json(
        { error: 'Job ID does not match' },
        { status: 404 }
      );
    }

    // Prepare response based on OCR status
    let response: any;

    switch (ocrStatus) {
      case 'completed':
        response = {
          attachmentId,
          status: 'completed',
          confidence: attachment.metadata?.ocrConfidence || 0,
          extractedText: ocrData?.extractedText,
          extractedTables: ocrData?.extractedTables,
          structuredData: ocrData?.structuredData,
          processedAt: ocrData?.processedAt || new Date().toISOString(),
          processingTime: ocrData?.processingTime || 0
        };
        break;

      case 'failed':
        response = {
          attachmentId,
          status: 'failed',
          confidence: 0,
          error: ocrError || 'OCR processing failed',
          processedAt: new Date().toISOString(),
          processingTime: 0
        };
        break;

      case 'processing':
      case 'queued':
        response = {
          attachmentId,
          status: ocrStatus as 'processing',
          confidence: 0
        };
        break;

      default:
        return NextResponse.json(
          { error: 'OCR has not been processed for this attachment' },
          { status: 404 }
        );
    }

    // Audit log: OCR results accessed
    await auditService.logOperation(auditContext, {
      operation: 'ocr_results_accessed',
      data: {
        attachmentId,
        filename: attachment.filename,
        ocrStatus,
        jobId: ocrJobId,
        hasResults: ocrStatus === 'completed'
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    await auditService.logError(auditContext, 'OCR_RESULTS_ERROR', {
      operation: 'ocr_results_get',
      error: error instanceof Error ? error.message : String(error),
      data: { url: request.url }
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/attachments/ocr - Cancel OCR processing
export async function DELETE(request: NextRequest) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);
  const supabase = createServiceClient();

  try {
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get('attachmentId');
    const tenantId = url.searchParams.get('tenantId');
    const jobId = url.searchParams.get('jobId');

    if (!attachmentId || !tenantId) {
      return NextResponse.json(
        { error: 'attachmentId and tenantId are required' },
        { status: 400 }
      );
    }

    if (!userContext.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 401 }
      );
    }

    // Fetch attachment
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('id, filename, metadata')
      .eq('id', attachmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    const ocrStatus = attachment.metadata?.ocrStatus;
    const ocrJobId = attachment.metadata?.ocrJobId;

    // Verify job ID if provided
    if (jobId && ocrJobId !== jobId) {
      return NextResponse.json(
        { error: 'Job ID does not match' },
        { status: 404 }
      );
    }

    // Check if OCR can be cancelled
    if (ocrStatus !== 'queued' && ocrStatus !== 'processing') {
      return NextResponse.json(
        { error: `Cannot cancel OCR in status: ${ocrStatus}` },
        { status: 400 }
      );
    }

    // Update attachment to mark OCR as cancelled
    const { error: updateError } = await supabase
      .from('attachments')
      .update({
        metadata: {
          ...attachment.metadata,
          ocrStatus: 'cancelled',
          ocrCancelledAt: new Date().toISOString(),
          ocrCancelledBy: userContext.userId
        }
      })
      .eq('id', attachmentId);

    if (updateError) {
      await auditService.logError(auditContext, 'OCR_CANCEL_ERROR', {
        operation: 'ocr_processing_cancel',
        error: updateError.message,
        data: { attachmentId, jobId: ocrJobId }
      });

      return NextResponse.json(
        { error: 'Failed to cancel OCR processing' },
        { status: 500 }
      );
    }

    // Note: In a full implementation, you would also cancel the Inngest job
    // This might require additional Inngest API calls or job management

    // Audit log: OCR processing cancelled
    await auditService.logOperation(auditContext, {
      operation: 'ocr_processing_cancelled',
      data: {
        attachmentId,
        filename: attachment.filename,
        jobId: ocrJobId,
        previousStatus: ocrStatus
      }
    });

    return NextResponse.json({
      success: true,
      attachmentId,
      jobId: ocrJobId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

  } catch (error) {
    await auditService.logError(auditContext, 'OCR_CANCEL_ERROR', {
      operation: 'ocr_processing_cancel',
      error: error instanceof Error ? error.message : String(error),
      data: { url: request.url }
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
