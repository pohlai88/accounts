// Attachment upload API endpoint
// V1 compliance: File upload/storage/management with audit trail

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  attachmentService,
  extractV1UserContext,
  getV1AuditService,
  createV1AuditContext
} from '@aibos/utils';

// Request validation schema
const UploadRequestSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  category: z.string().min(1).max(50),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  relationshipType: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const requestDataStr = formData.get('data') as string;

    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const file = fileEntry as globalThis.File;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    if (!requestDataStr) {
      return NextResponse.json(
        { error: 'No request data provided' },
        { status: 400 }
      );
    }

    // Parse and validate request data
    const requestData = JSON.parse(requestDataStr);
    const validatedData = UploadRequestSchema.parse(requestData);

    // Validate file
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    if (!userContext.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 401 }
      );
    }

    // Audit log: Upload initiated
    await auditService.logOperation(auditContext, {
      operation: 'attachment_upload_initiated',
      data: {
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category: validatedData.category,
        tenantId: validatedData.tenantId,
        companyId: validatedData.companyId
      }
    });

    // Upload file
    const uploadResult = await attachmentService.uploadFile(
      fileBuffer,
      file.name,
      file.type,
      {
        tenantId: validatedData.tenantId,
        companyId: validatedData.companyId,
        userId: userContext.userId,
        category: validatedData.category,
        tags: validatedData.tags,
        isPublic: validatedData.isPublic,
        metadata: validatedData.metadata
      }
    );

    if (!uploadResult.success) {
      // Audit log: Upload failed
      await auditService.logError(auditContext, 'ATTACHMENT_UPLOAD_ERROR', {
        operation: 'attachment_upload',
        error: uploadResult.error || 'Upload failed',
        data: {
          filename: file.name,
          category: validatedData.category
        }
      });

      return NextResponse.json(
        { error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Link to entity if specified
    if (validatedData.entityType && validatedData.entityId && uploadResult.attachmentId) {
      const linkResult = await attachmentService.linkToEntity(
        uploadResult.attachmentId,
        validatedData.entityType,
        validatedData.entityId,
        validatedData.relationshipType || 'attachment',
        userContext.userId,
        validatedData.description,
        validatedData.isRequired || false
      );

      if (!linkResult.success) {
        // Log warning but don't fail the upload
        await auditService.logError(auditContext, 'ATTACHMENT_LINK_ERROR', {
          operation: 'attachment_link',
          error: linkResult.error || 'Link failed',
          data: {
            attachmentId: uploadResult.attachmentId,
            entityType: validatedData.entityType,
            entityId: validatedData.entityId
          }
        });
      }
    }

    // Audit log: Upload completed successfully
    await auditService.logOperation(auditContext, {
      operation: 'attachment_upload_completed',
      data: {
        attachmentId: uploadResult.attachmentId,
        filename: uploadResult.filename,
        originalFilename: file.name,
        fileSize: file.size,
        category: validatedData.category,
        url: uploadResult.url
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      attachmentId: uploadResult.attachmentId,
      filename: uploadResult.filename,
      originalFilename: file.name,
      url: uploadResult.url,
      fileSize: file.size,
      mimeType: file.type,
      category: validatedData.category
    });

  } catch (error) {
    // Audit log: Upload error
    await auditService.logError(auditContext, 'ATTACHMENT_UPLOAD_EXCEPTION', {
      operation: 'attachment_upload',
      error: error instanceof Error ? error.message : 'Unknown upload error'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
