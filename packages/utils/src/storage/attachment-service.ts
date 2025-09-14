// Attachment service for V1 compliance
// Handles file upload, storage, and management with Supabase Storage

import { createServiceClient } from '../supabase/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// interface AttachmentDbRecord {
//   id: string;
//   filename: string;
//   original_filename: string;
//   mime_type: string;
//   file_size: number;
//   category: string;
//   tags: string[];
//   storage_url: string;
//   uploaded_by: string;
//   created_at: string;
//   metadata: Record<string, unknown>;
// }

// Note: This interface will be used when implementing full attachment queries
// interface AttachmentQueryResult {
//   attachments: AttachmentDbRecord;
// }

export interface UploadOptions {
  tenantId: string;
  companyId: string;
  userId: string;
  category: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  success: boolean;
  attachmentId?: string;
  filename?: string;
  url?: string;
  error?: string;
}

export interface AttachmentInfo {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  category: string;
  tags: string[];
  storageUrl: string;
  uploadedBy: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export class AttachmentService {
  private supabase = createServiceClient();
  private bucketName = 'attachments';

  /**
   * Upload a file and create attachment record
   */
  async uploadFile(
    file: Buffer | ArrayBuffer,
    originalFilename: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Generate unique filename and calculate hash
      const fileExtension = originalFilename.split('.').pop() || '';
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const fileBuffer = file instanceof ArrayBuffer ? Buffer.from(file) : file;
      const fileHash = crypto.createHash('sha256').update(fileBuffer instanceof ArrayBuffer ? Buffer.from(fileBuffer) : fileBuffer).digest('hex');

      // Check for duplicate files
      const existingFile = await this.findByHash(fileHash, options.tenantId, options.companyId);
      if (existingFile) {
        return {
          success: true,
          attachmentId: existingFile.id,
          filename: existingFile.filename,
          url: existingFile.storageUrl
        };
      }

      // Create storage path
      const storagePath = `${options.tenantId}/${options.companyId}/${options.category}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`
        };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      // Create attachment record in database
      const { data: attachmentData, error: dbError } = await this.supabase
        .from('attachments')
        .insert({
          tenant_id: options.tenantId,
          company_id: options.companyId,
          uploaded_by: options.userId,
          filename: uniqueFilename,
          original_filename: originalFilename,
          mime_type: mimeType,
          file_size: fileBuffer.byteLength,
          file_hash: fileHash,
          storage_provider: 'supabase',
          storage_path: storagePath,
          storage_url: urlData.publicUrl,
          category: options.category,
          tags: options.tags || [],
          is_public: options.isPublic || false,
          metadata: options.metadata || {},
          status: 'active'
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from(this.bucketName).remove([storagePath]);
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        };
      }

      return {
        success: true,
        attachmentId: attachmentData.id,
        filename: uniqueFilename,
        url: urlData.publicUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Get attachment information
   */
  async getAttachment(attachmentId: string, tenantId: string): Promise<AttachmentInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*')
        .eq('id', attachmentId)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        filename: data.filename,
        originalFilename: data.original_filename,
        mimeType: data.mime_type,
        fileSize: data.file_size,
        category: data.category,
        tags: data.tags || [],
        storageUrl: data.storage_url,
        uploadedBy: data.uploaded_by,
        createdAt: data.created_at,
        metadata: data.metadata || {}
      };

    } catch (error) {
      console.error('Error getting attachment:', error);
      return null;
    }
  }

  /**
   * Download attachment file
   */
  async downloadFile(attachmentId: string, tenantId: string, userId: string): Promise<{
    success: boolean;
    data?: ArrayBuffer;
    filename?: string;
    mimeType?: string;
    error?: string;
  }> {
    try {
      // Get attachment info
      const attachment = await this.getAttachment(attachmentId, tenantId);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Log access
      await this.logAccess(attachmentId, userId, 'download');

      // Download from storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(attachment.storageUrl.split('/').pop() || '');

      if (error) {
        return { success: false, error: `Download failed: ${error.message}` };
      }

      return {
        success: true,
        data: await data.arrayBuffer(),
        filename: attachment.originalFilename,
        mimeType: attachment.mimeType
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string, tenantId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get attachment info
      const attachment = await this.getAttachment(attachmentId, tenantId);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Mark as deleted in database (soft delete)
      const { error: dbError } = await this.supabase
        .from('attachments')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attachmentId)
        .eq('tenant_id', tenantId);

      if (dbError) {
        return { success: false, error: `Database error: ${dbError.message}` };
      }

      // Log access
      await this.logAccess(attachmentId, userId, 'delete');

      // Note: We don't immediately delete from storage to allow for recovery
      // A background job should clean up deleted files after a retention period

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Link attachment to an entity
   */
  async linkToEntity(
    attachmentId: string,
    entityType: string,
    entityId: string,
    relationshipType: string = 'attachment',
    userId: string,
    description?: string,
    isRequired: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('attachment_relationships')
        .insert({
          attachment_id: attachmentId,
          entity_type: entityType,
          entity_id: entityId,
          relationship_type: relationshipType,
          description,
          is_required: isRequired,
          created_by: userId
        });

      if (error) {
        return { success: false, error: `Link failed: ${error.message}` };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Link failed'
      };
    }
  }

  /**
   * Get attachments for an entity
   */
  async getEntityAttachments(
    entityType: string,
    entityId: string,
    tenantId: string
  ): Promise<AttachmentInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('attachment_relationships')
        .select(`
          attachment_id,
          relationship_type,
          description,
          attachments (
            id,
            filename,
            original_filename,
            mime_type,
            file_size,
            category,
            tags,
            storage_url,
            uploaded_by,
            created_at,
            metadata
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('attachments.tenant_id', tenantId)
        .eq('attachments.status', 'active');

      if (error || !data) {
        return [];
      }

      return (data as Array<{
        attachment_id: unknown;
        relationship_type: unknown;
        description: unknown;
        attachments: Array<{
          id: unknown;
          filename: unknown;
          original_filename: unknown;
          mime_type: unknown;
          file_size: unknown;
          category: unknown;
          tags: unknown;
          storage_url: unknown;
          uploaded_by: unknown;
          created_at: unknown;
          metadata: unknown;
        }>;
      }>)
        .filter((item) => item.attachments && Array.isArray(item.attachments))
        .flatMap((item) => item.attachments)
        .map((attachment) => ({
          id: String(attachment.id),
          filename: String(attachment.filename),
          originalFilename: String(attachment.original_filename),
          mimeType: String(attachment.mime_type),
          fileSize: Number(attachment.file_size),
          category: String(attachment.category),
          tags: Array.isArray(attachment.tags) ? attachment.tags.map(String) : [],
          storageUrl: String(attachment.storage_url),
          uploadedBy: String(attachment.uploaded_by),
          createdAt: String(attachment.created_at),
          metadata: attachment.metadata && typeof attachment.metadata === 'object' ? attachment.metadata as Record<string, unknown> : {}
        }));

    } catch (error) {
      console.error('Error getting entity attachments:', error);
      return [];
    }
  }

  /**
   * Find attachment by file hash (for deduplication)
   */
  private async findByHash(
    fileHash: string,
    tenantId: string,
    companyId: string
  ): Promise<AttachmentInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('attachments')
        .select('*')
        .eq('file_hash', fileHash)
        .eq('tenant_id', tenantId)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        filename: data.filename,
        originalFilename: data.original_filename,
        mimeType: data.mime_type,
        fileSize: data.file_size,
        category: data.category,
        tags: data.tags || [],
        storageUrl: data.storage_url,
        uploadedBy: data.uploaded_by,
        createdAt: data.created_at,
        metadata: data.metadata || {}
      };

    } catch {
      return null;
    }
  }

  /**
   * Log attachment access for audit trail
   */
  private async logAccess(
    attachmentId: string,
    userId: string,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase
        .from('attachment_access_log')
        .insert({
          attachment_id: attachmentId,
          user_id: userId,
          action,
          accessed_at: new Date().toISOString(),
          metadata: metadata || {}
        });
    } catch (error) {
      // Log access errors but don't fail the main operation
      console.error('Error logging attachment access:', error);
    }
  }

  /**
   * Search attachments with filters
   */
  async searchAttachments(
    tenantId: string,
    filters: {
      search?: string;
      category?: string;
      tags?: string[];
      mimeType?: string;
      uploadedBy?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    success: boolean;
    data?: AttachmentInfo[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = this.supabase
        .from('attachments')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      // Apply filters
      if (filters.search) {
        query = query.or(`original_filename.ilike.%${filters.search}%,filename.ilike.%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.mimeType) {
        query = query.eq('mime_type', filters.mimeType);
      }
      if (filters.uploadedBy) {
        query = query.eq('uploaded_by', filters.uploadedBy);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: `Search failed: ${error.message}` };
      }

      const attachments = (data || []).map((item) => ({
        id: item.id,
        filename: item.filename,
        originalFilename: item.original_filename,
        mimeType: item.mime_type,
        fileSize: item.file_size,
        category: item.category,
        tags: item.tags || [],
        storageUrl: item.storage_url,
        uploadedBy: item.uploaded_by,
        createdAt: item.created_at,
        metadata: item.metadata || {}
      }));

      return {
        success: true,
        data: attachments,
        total: count || 0
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Update attachment metadata
   */
  async updateMetadata(
    attachmentId: string,
    tenantId: string,
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify attachment exists and user has access
      const attachment = await this.getAttachment(attachmentId, tenantId);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Update metadata
      const { error } = await this.supabase
        .from('attachments')
        .update({
          metadata: { ...attachment.metadata, ...metadata },
          updated_at: new Date().toISOString()
        })
        .eq('id', attachmentId)
        .eq('tenant_id', tenantId);

      if (error) {
        return { success: false, error: `Update failed: ${error.message}` };
      }

      // Log access
      await this.logAccess(attachmentId, userId, 'update_metadata', { metadata });

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Batch delete multiple attachments
   */
  async batchDelete(
    attachmentIds: string[],
    tenantId: string,
    userId: string
  ): Promise<{
    success: boolean;
    results: Array<{ id: string; success: boolean; error?: string }>;
    error?: string;
  }> {
    try {
      const results: Array<{ id: string; success: boolean; error?: string }> = [];

      // Process each attachment
      for (const attachmentId of attachmentIds) {
        try {
          const result = await this.deleteAttachment(attachmentId, tenantId, userId);
          results.push({
            id: attachmentId,
            success: result.success,
            error: result.error
          });
        } catch (error) {
          results.push({
            id: attachmentId,
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: successCount > 0,
        results,
        error: successCount < totalCount ? `${successCount}/${totalCount} deletions successful` : undefined
      };

    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Batch delete failed'
      };
    }
  }

  /**
   * Get attachment statistics for a tenant
   */
  async getAttachmentStats(tenantId: string): Promise<{
    success: boolean;
    data?: {
      totalAttachments: number;
      totalSize: number;
      categories: Record<string, number>;
      recentUploads: number;
    };
    error?: string;
  }> {
    try {
      // Get total count and size
      const { data: stats, error: statsError } = await this.supabase
        .from('attachments')
        .select('file_size, category, created_at')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      if (statsError) {
        return { success: false, error: `Stats failed: ${statsError.message}` };
      }

      const totalAttachments = stats.length;
      const totalSize = stats.reduce((sum, item) => sum + (item.file_size || 0), 0);

      // Count by category
      const categories: Record<string, number> = {};
      stats.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
      });

      // Count recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUploads = stats.filter(item =>
        new Date(item.created_at) > sevenDaysAgo
      ).length;

      return {
        success: true,
        data: {
          totalAttachments,
          totalSize,
          categories,
          recentUploads
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stats failed'
      };
    }
  }
}

// Export singleton instance
export const attachmentService = new AttachmentService();
