// @ts-nocheck
// Batch Attachment Operations API
// V1 compliance: Bulk operations for attachments with audit logging

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createServiceClient,
  extractV1UserContext,
  getV1AuditService,
  createV1AuditContext,
} from "@aibos/utils";
import { BatchAttachmentOperationReq } from "@aibos/contracts";

// POST /api/attachments/batch - Batch operations on attachments
export async function POST(request: NextRequest) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);
  const supabase = createServiceClient();

  let body: unknown;

  try {
    body = await request.json();
    const validatedData = BatchAttachmentOperationReq.parse(body);

    if (!userContext.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 401 });
    }

    // Audit log: Batch operation initiated
    await auditService.logOperation(auditContext, {
      operation: "attachment_batch_operation_initiated",
      data: {
        tenantId: validatedData.tenantId,
        operation: validatedData.operation,
        attachmentCount: validatedData.attachmentIds.length,
        attachmentIds: validatedData.attachmentIds,
      },
    });

    // Fetch all attachments to validate ownership and current state
    const { data: attachments, error: fetchError } = await supabase
      .from("attachments")
      .select("id, filename, status, category, tags, metadata")
      .eq("tenant_id", validatedData.tenantId)
      .in("id", validatedData.attachmentIds);

    if (fetchError) {
      await auditService.logError(auditContext, "ATTACHMENT_BATCH_FETCH_ERROR", {
        operation: "attachment_batch_operation",
        error: fetchError.message,
        data: { attachmentIds: validatedData.attachmentIds },
      });

      return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 });
    }

    if (!attachments || attachments.length === 0) {
      return NextResponse.json({ error: "No attachments found" }, { status: 404 });
    }

    // Validate that all requested attachments exist
    const foundIds = new Set(attachments.map(a => a.id));
    const missingIds = validatedData.attachmentIds.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: "Some attachments not found",
          missingIds,
        },
        { status: 404 },
      );
    }

    const results = [];
    const now = new Date().toISOString();

    // Process each attachment based on operation type
    for (const attachment of attachments) {
      try {
        let updateData: Record<string, unknown> = {};
        let success = false;
        let error: string | undefined;

        switch (validatedData.operation) {
          case "delete":
            // Soft delete
            updateData = {
              status: "deleted",
              deleted_at: now,
              metadata: {
                ...attachment.metadata,
                deletedBy: userContext.userId,
                deletedAt: now,
                deletionReason: "batch_operation",
              },
            };
            success = true;
            break;

          case "archive":
            if (attachment.status === "deleted") {
              error = "Cannot archive deleted attachment";
            } else {
              updateData = {
                status: "archived",
                metadata: {
                  ...attachment.metadata,
                  archivedBy: userContext.userId,
                  archivedAt: now,
                  archivalReason: "batch_operation",
                },
              };
              success = true;
            }
            break;

          case "restore":
            if (attachment.status === "deleted" || attachment.status === "archived") {
              updateData = {
                status: "active",
                deleted_at: null,
                metadata: {
                  ...attachment.metadata,
                  restoredBy: userContext.userId,
                  restoredAt: now,
                  restorationReason: "batch_operation",
                },
              };
              success = true;
            } else {
              error = "Attachment is not deleted or archived";
            }
            break;

          case "update_category":
            if (!validatedData.category) {
              error = "Category is required for update_category operation";
            } else {
              updateData = {
                category: validatedData.category,
                metadata: {
                  ...attachment.metadata,
                  categoryUpdatedBy: userContext.userId,
                  categoryUpdatedAt: now,
                  previousCategory: attachment.category,
                },
              };
              success = true;
            }
            break;

          case "add_tags":
            if (!validatedData.tags || validatedData.tags.length === 0) {
              error = "Tags are required for add_tags operation";
            } else {
              const currentTags = attachment.tags || [];
              const newTags = [...new Set([...currentTags, ...validatedData.tags])];
              updateData = {
                tags: newTags,
                metadata: {
                  ...attachment.metadata,
                  tagsUpdatedBy: userContext.userId,
                  tagsUpdatedAt: now,
                  addedTags: validatedData.tags,
                },
              };
              success = true;
            }
            break;

          case "remove_tags":
            if (!validatedData.tags || validatedData.tags.length === 0) {
              error = "Tags are required for remove_tags operation";
            } else {
              const currentTags = attachment.tags || [];
              const newTags = currentTags.filter(
                (tag: string) => !validatedData.tags!.includes(tag),
              );
              updateData = {
                tags: newTags,
                metadata: {
                  ...attachment.metadata,
                  tagsUpdatedBy: userContext.userId,
                  tagsUpdatedAt: now,
                  removedTags: validatedData.tags,
                },
              };
              success = true;
            }
            break;

          default:
            error = `Unknown operation: ${validatedData.operation}`;
        }

        if (success && Object.keys(updateData).length > 0) {
          // Apply the update
          const { error: updateError } = await supabase
            .from("attachments")
            .update(updateData)
            .eq("id", attachment.id);

          if (updateError) {
            success = false;
            error = updateError.message;
          }
        }

        results.push({
          attachmentId: attachment.id,
          filename: attachment.filename,
          success,
          error,
          operation: validatedData.operation,
        });

        // Log individual operation result
        if (success) {
          await auditService.logOperation(auditContext, {
            operation: `attachment_${validatedData.operation}_success`,
            data: {
              attachmentId: attachment.id,
              filename: attachment.filename,
              operation: validatedData.operation,
              updateData,
            },
          });
        } else {
          await auditService.logError(auditContext, "ATTACHMENT_BATCH_OPERATION_ERROR", {
            operation: `attachment_${validatedData.operation}`,
            error: error || "Unknown error",
            data: {
              attachmentId: attachment.id,
              filename: attachment.filename,
            },
          });
        }
      } catch (operationError) {
        const errorMessage =
          operationError instanceof Error ? operationError.message : String(operationError);

        results.push({
          attachmentId: attachment.id,
          filename: attachment.filename,
          success: false,
          error: errorMessage,
          operation: validatedData.operation,
        });

        await auditService.logError(auditContext, "ATTACHMENT_BATCH_OPERATION_ERROR", {
          operation: `attachment_${validatedData.operation}`,
          error: errorMessage,
          data: {
            attachmentId: attachment.id,
            filename: attachment.filename,
          },
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    // Audit log: Batch operation completed
    await auditService.logOperation(auditContext, {
      operation: "attachment_batch_operation_completed",
      data: {
        tenantId: validatedData.tenantId,
        operation: validatedData.operation,
        totalCount: results.length,
        successCount,
        failureCount,
        results: results.map(r => ({
          attachmentId: r.attachmentId,
          success: r.success,
          error: r.error,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      operation: validatedData.operation,
      totalCount: results.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    await auditService.logError(auditContext, "ATTACHMENT_BATCH_OPERATION_ERROR", {
      operation: "attachment_batch_operation",
      error: error instanceof Error ? error.message : String(error),
      data: { requestBody: body },
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/attachments/batch/status - Check batch operation status
export async function GET(request: NextRequest) {
  const userContext = extractV1UserContext(request);
  const auditService = getV1AuditService();
  const auditContext = createV1AuditContext(request);

  try {
    const url = new URL(request.url);
    const batchId = url.searchParams.get("batchId");
    const tenantId = url.searchParams.get("tenantId");

    if (!batchId || !tenantId) {
      return NextResponse.json({ error: "batchId and tenantId are required" }, { status: 400 });
    }

    if (!userContext.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 401 });
    }

    // For now, return a placeholder response
    // In a full implementation, you would track batch operations in a separate table
    const response = {
      batchId,
      tenantId,
      status: "completed",
      operation: "unknown",
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      results: [],
    };

    await auditService.logOperation(auditContext, {
      operation: "attachment_batch_status_checked",
      data: { batchId, tenantId },
    });

    return NextResponse.json(response);
  } catch (error) {
    await auditService.logError(auditContext, "ATTACHMENT_BATCH_STATUS_ERROR", {
      operation: "attachment_batch_status",
      error: error instanceof Error ? error.message : String(error),
      data: { url: request.url },
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
