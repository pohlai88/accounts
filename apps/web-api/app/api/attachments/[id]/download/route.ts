// Attachment download API endpoint
// V1 compliance: Secure file download with audit trail

import { NextRequest, NextResponse } from 'next/server';
import {
  attachmentService,
  createV1RequestContext,
  extractV1UserContext,
  getV1AuditService,
  createV1AuditContext
} from '@aibos/utils';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/attachments/[id]/download - Download attachment file
export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestContext = createV1RequestContext(request);
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    const { id } = params;
    const url = new globalThis.URL(request.url);
    const tenantId = url.searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Download file (tenantId is guaranteed to be string after null check)
    const result = await attachmentService.downloadFile(id, tenantId as string, userContext.userId || '');

    if (!result.success) {
      await auditService.logError(auditContext, 'ATTACHMENT_DOWNLOAD_ERROR', {
        operation: 'attachment_download',
        error: result.error || 'Download failed',
        data: { attachmentId: id }
      });

      return NextResponse.json(
        { error: result.error || 'Download failed' },
        { status: 404 }
      );
    }

    // Audit log: Attachment downloaded
    await auditService.logOperation(auditContext, {
      operation: 'attachment_downloaded',
      data: {
        attachmentId: id,
        filename: result.filename,
        fileSize: result.data?.byteLength || 0
      }
    });

    // Return file as response
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': String(result.data?.byteLength || 0),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    await auditService.logError(auditContext, 'ATTACHMENT_DOWNLOAD_EXCEPTION', {
      operation: 'attachment_download',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
