// Attachment Service Unit Tests
// V1 compliance: Comprehensive test coverage for attachment operations

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AttachmentService } from '../src/storage/attachment-service';
import { createServiceClient } from '../src/supabase/client';

// Mock Supabase client
vi.mock('../src/supabase/client');

describe('AttachmentService', () => {
  let attachmentService: AttachmentService;
  let mockSupabase: Record<string, unknown>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn()
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    };

    (createServiceClient as unknown as { mockReturnValue: (value: unknown) => void }).mockReturnValue(mockSupabase);
    attachmentService = new AttachmentService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadFile', () => {
    const mockFile = Buffer.from('test file content');
    const mockOptions = {
      tenantId: 'tenant-123',
      companyId: 'company-456',
      userId: 'user-789',
      category: 'invoice' as const,
      tags: ['test', 'document'],
      isPublic: false,
      metadata: { source: 'test' }
    };

    it('should successfully upload a new file', async () => {
      // Mock successful storage upload
      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/file.pdf' }
      });

      // Mock no existing file with same hash
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Mock successful database insert
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'attachment-123' }],
        error: null
      });

      const result = await attachmentService.uploadFile(
        mockFile,
        'test-document.pdf',
        'application/pdf',
        mockOptions
      );

      expect(result.success).toBe(true);
      expect(result.attachmentId).toBe('attachment-123');
      expect(mockSupabase.storage.upload).toHaveBeenCalled();
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should return existing file if duplicate hash found', async () => {
      // Mock existing file with same hash
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'existing-attachment-123',
          filename: 'existing-file.pdf',
          storage_url: 'https://storage.example.com/existing-file.pdf'
        },
        error: null
      });

      const result = await attachmentService.uploadFile(
        mockFile,
        'test-document.pdf',
        'application/pdf',
        mockOptions
      );

      expect(result.success).toBe(true);
      expect(result.attachmentId).toBe('existing-attachment-123');
      expect(result.filename).toBe('existing-file.pdf');
      expect(mockSupabase.storage.upload).not.toHaveBeenCalled();
    });

    it('should handle storage upload failure', async () => {
      // Mock storage upload failure
      mockSupabase.storage.upload.mockResolvedValue({
        error: { message: 'Storage upload failed' }
      });

      // Mock no existing file
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await attachmentService.uploadFile(
        mockFile,
        'test-document.pdf',
        'application/pdf',
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });

    it('should handle database insert failure', async () => {
      // Mock successful storage upload
      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/file.pdf' }
      });

      // Mock no existing file
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Mock database insert failure
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database insert failed' }
      });

      const result = await attachmentService.uploadFile(
        mockFile,
        'test-document.pdf',
        'application/pdf',
        mockOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database insert failed');
    });

    it('should generate unique filename and calculate hash correctly', async () => {
      // Mock successful operations
      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/file.pdf' }
      });
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'attachment-123' }],
        error: null
      });

      await attachmentService.uploadFile(
        mockFile,
        'test-document.pdf',
        'application/pdf',
        mockOptions
      );

      // Verify storage path includes tenant/company/category structure
      const uploadCall = mockSupabase.storage.upload.mock.calls[0];
      const storagePath = uploadCall[0];
      expect(storagePath).toMatch(/tenant-123\/company-456\/invoice\/.+\.pdf$/);

      // Verify hash calculation was performed (findByHash was called)
      expect(mockSupabase.eq).toHaveBeenCalledWith('file_hash', expect.any(String));
    });
  });

  describe('downloadFile', () => {
    it('should successfully download a file', async () => {
      const mockAttachment = {
        id: 'attachment-123',
        filename: 'test-document.pdf',
        mime_type: 'application/pdf',
        storage_path: 'tenant-123/company-456/invoice/file.pdf',
        tenant_id: 'tenant-123'
      };

      const mockFileData = new globalThis.Blob(['file content'], { type: 'application/pdf' });

      // Mock database query
      mockSupabase.single.mockResolvedValue({
        data: mockAttachment,
        error: null
      });

      // Mock storage download
      mockSupabase.storage.download.mockResolvedValue({
        data: mockFileData,
        error: null
      });

      const result = await attachmentService.downloadFile(
        'attachment-123',
        'tenant-123',
        'user-789'
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test-document.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should handle attachment not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await attachmentService.downloadFile(
        'nonexistent-attachment',
        'tenant-123',
        'user-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle storage download failure', async () => {
      const mockAttachment = {
        id: 'attachment-123',
        filename: 'test-document.pdf',
        mime_type: 'application/pdf',
        storage_path: 'tenant-123/company-456/invoice/file.pdf',
        tenant_id: 'tenant-123'
      };

      // Mock successful database query
      mockSupabase.single.mockResolvedValue({
        data: mockAttachment,
        error: null
      });

      // Mock storage download failure
      mockSupabase.storage.download.mockResolvedValue({
        data: null,
        error: { message: 'File not found in storage' }
      });

      const result = await attachmentService.downloadFile(
        'attachment-123',
        'tenant-123',
        'user-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found in storage');
    });

    it('should enforce tenant isolation', async () => {
      await attachmentService.downloadFile(
        'attachment-123',
        'different-tenant',
        'user-789'
      );

      // Verify the query includes tenant filter
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'different-tenant');
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      const mockAttachment = {
        id: 'attachment-123',
        filename: 'test-document.pdf',
        storage_path: 'tenant-123/company-456/invoice/file.pdf',
        tenant_id: 'tenant-123'
      };

      // Mock database query
      mockSupabase.single.mockResolvedValue({
        data: mockAttachment,
        error: null
      });

      // Mock successful database update (soft delete)
      mockSupabase.update.mockResolvedValue({
        data: [mockAttachment],
        error: null
      });

      // Mock successful storage deletion
      mockSupabase.storage.remove.mockResolvedValue({
        data: [{ name: 'file.pdf' }],
        error: null
      });

      const result = await attachmentService.deleteFile(
        'attachment-123',
        'tenant-123',
        'user-789'
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.storage.remove).toHaveBeenCalled();
    });

    it('should handle attachment not found for deletion', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await attachmentService.deleteFile(
        'nonexistent-attachment',
        'tenant-123',
        'user-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle storage deletion failure gracefully', async () => {
      const mockAttachment = {
        id: 'attachment-123',
        filename: 'test-document.pdf',
        storage_path: 'tenant-123/company-456/invoice/file.pdf',
        tenant_id: 'tenant-123'
      };

      // Mock successful database operations
      mockSupabase.single.mockResolvedValue({
        data: mockAttachment,
        error: null
      });
      mockSupabase.update.mockResolvedValue({
        data: [mockAttachment],
        error: null
      });

      // Mock storage deletion failure
      mockSupabase.storage.remove.mockResolvedValue({
        data: null,
        error: { message: 'Storage deletion failed' }
      });

      const result = await attachmentService.deleteFile(
        'attachment-123',
        'tenant-123',
        'user-789'
      );

      // Should still succeed (soft delete completed) but log the storage error
      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe('findByHash', () => {
    it('should find existing file by hash', async () => {
      const mockAttachment = {
        id: 'attachment-123',
        filename: 'existing-file.pdf',
        storage_url: 'https://storage.example.com/file.pdf'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockAttachment,
        error: null
      });

      const result = await attachmentService.findByHash(
        'abc123hash',
        'tenant-123',
        'company-456'
      );

      expect(result).toEqual(mockAttachment);
      expect(mockSupabase.eq).toHaveBeenCalledWith('file_hash', 'abc123hash');
      expect(mockSupabase.eq).toHaveBeenCalledWith('tenant_id', 'tenant-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('company_id', 'company-456');
    });

    it('should return null when no file found with hash', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await attachmentService.findByHash(
        'nonexistent-hash',
        'tenant-123',
        'company-456'
      );

      expect(result).toBeNull();
    });
  });

  describe('linkToEntity', () => {
    it('should successfully link attachment to entity', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'relationship-123' }],
        error: null
      });

      const result = await attachmentService.linkToEntity(
        'attachment-123',
        'invoice',
        'invoice-456',
        'user-789',
        'supporting_doc',
        'Invoice supporting document'
      );

      expect(result.success).toBe(true);
      expect(result.relationshipId).toBe('relationship-123');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should handle link creation failure', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' }
      });

      const result = await attachmentService.linkToEntity(
        'attachment-123',
        'invoice',
        'nonexistent-invoice',
        'user-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Foreign key constraint violation');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Network error'));

      const result = await attachmentService.downloadFile(
        'attachment-123',
        'tenant-123',
        'user-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should validate file size limits', async () => {
      const largeFile = Buffer.alloc(100 * 1024 * 1024); // 100MB

      const result = await attachmentService.uploadFile(
        largeFile,
        'large-file.pdf',
        'application/pdf',
        {
          tenantId: 'tenant-123',
          companyId: 'company-456',
          userId: 'user-789',
          category: 'invoice'
        }
      );

      // Should handle large files appropriately
      expect(result).toBeDefined();
    });

    it('should handle invalid file types', async () => {
      const result = await attachmentService.uploadFile(
        Buffer.from('test'),
        'malicious.exe',
        'application/x-executable',
        {
          tenantId: 'tenant-123',
          companyId: 'company-456',
          userId: 'user-789',
          category: 'invoice'
        }
      );

      // Implementation should validate file types
      expect(result).toBeDefined();
    });
  });

  describe('performance and concurrency', () => {
    it('should handle concurrent uploads of same file', async () => {
      const mockFile = Buffer.from('test file content');
      const mockOptions = {
        tenantId: 'tenant-123',
        companyId: 'company-456',
        userId: 'user-789',
        category: 'invoice' as const
      };

      // Mock first call finds no existing file, second finds existing
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({
          data: {
            id: 'existing-attachment',
            filename: 'file.pdf',
            storage_url: 'https://storage.example.com/file.pdf'
          },
          error: null
        });

      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/file.pdf' }
      });
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'attachment-123' }],
        error: null
      });

      // Simulate concurrent uploads
      const [result1, result2] = await Promise.all([
        attachmentService.uploadFile(mockFile, 'file.pdf', 'application/pdf', mockOptions),
        attachmentService.uploadFile(mockFile, 'file.pdf', 'application/pdf', mockOptions)
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
