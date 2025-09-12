// Attachment service for V1 compliance
// Handles file upload, storage, and management with Supabase Storage

import { createServiceClient } from '../supabase/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface AttachmentDbRecord {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  category: string;
  tags: string[];
  storage_url: string;
  uploaded_by: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface AttachmentQueryResult {
  attachments: AttachmentDbRecord;
}

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

      return (data as any[])
        .filter((item: any) => item.attachments)
        .map((item: any) => ({
          id: item.attachments.id,
          filename: item.attachments.filename,
          originalFilename: item.attachments.original_filename,
          mimeType: item.attachments.mime_type,
          fileSize: item.attachments.file_size,
          category: item.attachments.category,
          tags: item.attachments.tags || [],
          storageUrl: item.attachments.storage_url,
          uploadedBy: item.attachments.uploaded_by,
          createdAt: item.attachments.created_at,
          metadata: item.attachments.metadata || {}
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
}

// Export singleton instance
export const attachmentService = new AttachmentService();
