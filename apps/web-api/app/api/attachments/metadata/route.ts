// Attachment Metadata Management API
// V1 compliance: Advanced metadata operations with validation and audit logging

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
    createServiceClient,
    extractV1UserContext,
    getV1AuditService,
    createV1AuditContext
} from '@aibos/utils';
import { UpdateAttachmentReq } from '@aibos/contracts';

// Metadata update schema
const MetadataUpdateSchema = z.object({
    tenantId: z.string().uuid(),
    attachmentId: z.string().uuid(),
    metadata: z.record(z.string(), z.unknown()),
    operation: z.enum(['merge', 'replace', 'delete_keys']).optional().default('merge'),
    keysToDelete: z.array(z.string()).optional()
});

// PUT /api/attachments/metadata - Update attachment metadata
export async function PUT(request: NextRequest) {
    const userContext = extractV1UserContext(request);
    const auditService = getV1AuditService();
    const auditContext = createV1AuditContext(request);
    const supabase = createServiceClient();

    let body: any;

    try {
        body = await request.json();
        const validatedData = MetadataUpdateSchema.parse(body);

        if (!userContext.userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 401 }
            );
        }

        // Fetch current attachment
        const { data: attachment, error: fetchError } = await supabase
            .from('attachments')
            .select('*')
            .eq('id', validatedData.attachmentId)
            .eq('tenant_id', validatedData.tenantId)
            .single();

        if (fetchError || !attachment) {
            return NextResponse.json(
                { error: 'Attachment not found' },
                { status: 404 }
            );
        }

        // Prepare metadata update based on operation
        let newMetadata: Record<string, unknown>;
        const currentMetadata = attachment.metadata || {};

        switch (validatedData.operation) {
            case 'merge':
                // Merge new metadata with existing
                newMetadata = {
                    ...currentMetadata,
                    ...validatedData.metadata,
                    updatedBy: userContext.userId,
                    updatedAt: new Date().toISOString()
                };
                break;

            case 'replace':
                // Replace entire metadata object
                newMetadata = {
                    ...validatedData.metadata,
                    updatedBy: userContext.userId,
                    updatedAt: new Date().toISOString()
                };
                break;

            case 'delete_keys':
                // Delete specific keys from metadata
                newMetadata = { ...currentMetadata };
                if (validatedData.keysToDelete) {
                    for (const key of validatedData.keysToDelete) {
                        delete newMetadata[key];
                    }
                }
                newMetadata.updatedBy = userContext.userId;
                newMetadata.updatedAt = new Date().toISOString();
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid operation' },
                    { status: 400 }
                );
        }

        // Update attachment metadata
        const { error: updateError } = await supabase
            .from('attachments')
            .update({
                metadata: newMetadata,
                updated_at: new Date().toISOString()
            })
            .eq('id', validatedData.attachmentId);

        if (updateError) {
            await auditService.logError(auditContext, 'ATTACHMENT_METADATA_UPDATE_ERROR', {
                operation: 'attachment_metadata_update',
                error: updateError.message,
                data: {
                    attachmentId: validatedData.attachmentId,
                    operation: validatedData.operation
                }
            });

            return NextResponse.json(
                { error: 'Failed to update metadata' },
                { status: 500 }
            );
        }

        // Audit log: Metadata updated
        await auditService.logOperation(auditContext, {
            operation: 'attachment_metadata_updated',
            data: {
                attachmentId: validatedData.attachmentId,
                filename: attachment.filename,
                operation: validatedData.operation,
                metadataKeys: Object.keys(validatedData.metadata),
                keysToDelete: validatedData.keysToDelete
            }
        });

        return NextResponse.json({
            success: true,
            attachmentId: validatedData.attachmentId,
            operation: validatedData.operation,
            metadata: newMetadata
        });

    } catch (error) {
        await auditService.logError(auditContext, 'ATTACHMENT_METADATA_UPDATE_ERROR', {
            operation: 'attachment_metadata_update',
            error: error instanceof Error ? error.message : String(error),
            data: { requestBody: body }
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request parameters', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/attachments/metadata - Get attachment metadata
export async function GET(request: NextRequest) {
    const userContext = extractV1UserContext(request);
    const auditService = getV1AuditService();
    const auditContext = createV1AuditContext(request);
    const supabase = createServiceClient();

    try {
        const url = new URL(request.url);
        const attachmentId = url.searchParams.get('attachmentId');
        const tenantId = url.searchParams.get('tenantId');
        const keys = url.searchParams.get('keys')?.split(',');

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

        // Fetch attachment metadata
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

        let metadata = attachment.metadata || {};

        // Filter metadata by specific keys if requested
        if (keys && keys.length > 0) {
            const filteredMetadata: Record<string, unknown> = {};
            for (const key of keys) {
                if (key in metadata) {
                    filteredMetadata[key] = metadata[key];
                }
            }
            metadata = filteredMetadata;
        }

        // Audit log: Metadata accessed
        await auditService.logOperation(auditContext, {
            operation: 'attachment_metadata_accessed',
            data: {
                attachmentId,
                filename: attachment.filename,
                requestedKeys: keys,
                metadataKeys: Object.keys(metadata)
            }
        });

        return NextResponse.json({
            attachmentId,
            filename: attachment.filename,
            metadata,
            keys: Object.keys(metadata)
        });

    } catch (error) {
        await auditService.logError(auditContext, 'ATTACHMENT_METADATA_GET_ERROR', {
            operation: 'attachment_metadata_get',
            error: error instanceof Error ? error.message : String(error),
            data: { url: request.url }
        });

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/attachments/metadata/bulk - Bulk metadata operations
export async function POST(request: NextRequest) {
    const userContext = extractV1UserContext(request);
    const auditService = getV1AuditService();
    const auditContext = createV1AuditContext(request);
    const supabase = createServiceClient();

    let body: any;

    try {
        body = await request.json();

        const BulkMetadataSchema = z.object({
            tenantId: z.string().uuid(),
            operations: z.array(z.object({
                attachmentId: z.string().uuid(),
                operation: z.enum(['merge', 'replace', 'delete_keys']),
                metadata: z.record(z.string(), z.unknown()).optional(),
                keysToDelete: z.array(z.string()).optional()
            })).min(1).max(50) // Limit bulk operations
        });

        const validatedData = BulkMetadataSchema.parse(body);

        if (!userContext.userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 401 }
            );
        }

        // Fetch all attachments
        const attachmentIds = validatedData.operations.map(op => op.attachmentId);
        const { data: attachments, error: fetchError } = await supabase
            .from('attachments')
            .select('id, filename, metadata')
            .eq('tenant_id', validatedData.tenantId)
            .in('id', attachmentIds);

        if (fetchError) {
            return NextResponse.json(
                { error: 'Failed to fetch attachments' },
                { status: 500 }
            );
        }

        const attachmentMap = new Map(attachments?.map(a => [a.id, a]) || []);
        const results = [];

        // Process each operation
        for (const operation of validatedData.operations) {
            const attachment = attachmentMap.get(operation.attachmentId);

            if (!attachment) {
                results.push({
                    attachmentId: operation.attachmentId,
                    success: false,
                    error: 'Attachment not found'
                });
                continue;
            }

            try {
                // Prepare metadata update
                let newMetadata: Record<string, unknown>;
                const currentMetadata = attachment.metadata || {};

                switch (operation.operation) {
                    case 'merge':
                        newMetadata = {
                            ...currentMetadata,
                            ...(operation.metadata || {}),
                            updatedBy: userContext.userId,
                            updatedAt: new Date().toISOString()
                        };
                        break;

                    case 'replace':
                        newMetadata = {
                            ...(operation.metadata || {}),
                            updatedBy: userContext.userId,
                            updatedAt: new Date().toISOString()
                        };
                        break;

                    case 'delete_keys':
                        newMetadata = { ...currentMetadata };
                        if (operation.keysToDelete) {
                            for (const key of operation.keysToDelete) {
                                delete newMetadata[key];
                            }
                        }
                        newMetadata.updatedBy = userContext.userId;
                        newMetadata.updatedAt = new Date().toISOString();
                        break;

                    default:
                        throw new Error(`Invalid operation: ${operation.operation}`);
                }

                // Update attachment
                const { error: updateError } = await supabase
                    .from('attachments')
                    .update({
                        metadata: newMetadata,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', operation.attachmentId);

                if (updateError) {
                    throw new Error(updateError.message);
                }

                results.push({
                    attachmentId: operation.attachmentId,
                    filename: attachment.filename,
                    success: true,
                    operation: operation.operation,
                    metadata: newMetadata
                });

                // Audit log individual operation
                await auditService.logOperation(auditContext, {
                    operation: 'attachment_metadata_bulk_updated',
                    data: {
                        attachmentId: operation.attachmentId,
                        filename: attachment.filename,
                        operation: operation.operation,
                        metadataKeys: Object.keys(operation.metadata || {}),
                        keysToDelete: operation.keysToDelete
                    }
                });

            } catch (operationError) {
                const errorMessage = operationError instanceof Error ? operationError.message : String(operationError);

                results.push({
                    attachmentId: operation.attachmentId,
                    filename: attachment.filename,
                    success: false,
                    error: errorMessage,
                    operation: operation.operation
                });

                await auditService.logError(auditContext, 'ATTACHMENT_METADATA_BULK_ERROR', {
                    operation: 'attachment_metadata_bulk_update',
                    error: errorMessage,
                    data: {
                        attachmentId: operation.attachmentId,
                        operation: operation.operation
                    }
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        // Audit log: Bulk operation completed
        await auditService.logOperation(auditContext, {
            operation: 'attachment_metadata_bulk_completed',
            data: {
                tenantId: validatedData.tenantId,
                totalCount: results.length,
                successCount,
                failureCount
            }
        });

        return NextResponse.json({
            success: true,
            totalCount: results.length,
            successCount,
            failureCount,
            results
        });

    } catch (error) {
        await auditService.logError(auditContext, 'ATTACHMENT_METADATA_BULK_ERROR', {
            operation: 'attachment_metadata_bulk',
            error: error instanceof Error ? error.message : String(error),
            data: { requestBody: body }
        });

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request parameters', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
