// @ts-nocheck
// Attachment management API endpoints
// V1 compliance: Get, download, and delete attachments with audit trail

import { NextRequest, NextResponse } from "next/server";
import {
  attachmentService,
  extractV1UserContext,
  getV1AuditService,
  createV1AuditContext,
} from "@aibos/utils";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/attachments/[id] - Get attachment info
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    const { id } = params;
    const url = new globalThis.URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    // Get attachment info
    const attachment = await attachmentService.getAttachment(id, tenantId);

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Audit log: Attachment viewed
    await auditService.logOperation(auditContext, {
      operation: "attachment_viewed",
      data: {
        attachmentId: id,
        filename: attachment.filename,
        category: attachment.category,
      },
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        filename: attachment.originalFilename,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        category: attachment.category,
        tags: attachment.tags,
        uploadedBy: attachment.uploadedBy,
        createdAt: attachment.createdAt,
        metadata: attachment.metadata,
      },
    });
  } catch (error) {
    await auditService.logError(auditContext, "ATTACHMENT_GET_EXCEPTION", {
      operation: "attachment_get",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/attachments/[id] - Delete attachment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    const { id } = params;
    const url = new globalThis.URL(request.url);
    const tenantId = url.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    if (!userContext.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 401 });
    }

    // Delete attachment
    const result = await attachmentService.deleteAttachment(id, tenantId, userContext.userId);

    if (!result.success) {
      await auditService.logError(auditContext, "ATTACHMENT_DELETE_ERROR", {
        operation: "attachment_delete",
        error: result.error || "Delete failed",
        data: { attachmentId: id },
      });

      return NextResponse.json({ error: result.error || "Delete failed" }, { status: 500 });
    }

    // Audit log: Attachment deleted
    await auditService.logOperation(auditContext, {
      operation: "attachment_deleted",
      data: {
        attachmentId: id,
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    await auditService.logError(auditContext, "ATTACHMENT_DELETE_EXCEPTION", {
      operation: "attachment_delete",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
