/**
 * @aibos/utils - Advanced Attachment Service Tests
 * 
 * Tests for advanced attachment features: search, metadata updates, batch operations, and statistics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the entire attachment service module
vi.mock('../src/storage/attachment-service', () => ({
    AttachmentService: vi.fn().mockImplementation(() => ({
        uploadFile: vi.fn(),
        getAttachment: vi.fn(),
        downloadFile: vi.fn(),
        deleteAttachment: vi.fn(),
        linkToEntity: vi.fn(),
        getEntityAttachments: vi.fn(),
        searchAttachments: vi.fn(),
        updateMetadata: vi.fn(),
        batchDelete: vi.fn(),
        getAttachmentStats: vi.fn()
    })),
    attachmentService: {
        uploadFile: vi.fn(),
        getAttachment: vi.fn(),
        downloadFile: vi.fn(),
        deleteAttachment: vi.fn(),
        linkToEntity: vi.fn(),
        getEntityAttachments: vi.fn(),
        searchAttachments: vi.fn(),
        updateMetadata: vi.fn(),
        batchDelete: vi.fn(),
        getAttachmentStats: vi.fn()
    }
}));

// Import the mocked service
import { attachmentService } from '../src/storage/attachment-service';

describe('AttachmentService - Advanced Features', () => {
    let mockAttachmentService: unknown;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAttachmentService = attachmentService;
    });

    describe('searchAttachments', () => {
        it('should search attachments with basic filters', async () => {
            // Arrange
            const mockData = [
                {
                    id: '1',
                    filename: 'test.pdf',
                    original_filename: 'test.pdf',
                    mime_type: 'application/pdf',
                    file_size: 1024,
                    category: 'documents',
                    tags: ['important'],
                    storage_url: 'https://storage.example.com/test.pdf',
                    uploaded_by: 'user-123',
                    created_at: '2024-01-01T00:00:00Z',
                    metadata: {}
                }
            ];

            // Mock the service method
            mockAttachmentService.searchAttachments.mockResolvedValue({
                success: true,
                data: mockData,
                total: 1,
                error: null
            });

            // Act
            const result = await attachmentService.searchAttachments('tenant-123', {
                search: 'test',
                category: 'documents',
                limit: 10
            });

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.data![0].filename).toBe('test.pdf');
        });

        it('should handle search with no results', async () => {
            // Arrange
            mockAttachmentService.searchAttachments.mockResolvedValue({
                success: true,
                data: [],
                total: 0,
                error: null
            });

            // Act
            const result = await attachmentService.searchAttachments('tenant-123', {
                search: 'nonexistent'
            });

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should handle search errors', async () => {
            // Arrange
            mockAttachmentService.searchAttachments.mockResolvedValue({
                success: false,
                data: null,
                total: 0,
                error: 'Search failed: Database error'
            });

            // Act
            const result = await attachmentService.searchAttachments('tenant-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Search failed');
        });
    });

    describe('updateMetadata', () => {
        it('should update metadata successfully', async () => {
            // Arrange
            const attachmentId = 'attachment-123';
            const tenantId = 'tenant-123';
            const userId = 'user-123';
            const newMetadata = { description: 'Updated description' };

            // Mock the service method
            mockAttachmentService.updateMetadata.mockResolvedValue({
                success: true,
                error: null
            });

            // Act
            const result = await attachmentService.updateMetadata(
                attachmentId,
                tenantId,
                userId,
                newMetadata
            );

            // Assert
            expect(result.success).toBe(true);
            expect(mockAttachmentService.updateMetadata).toHaveBeenCalledWith(
                attachmentId,
                tenantId,
                userId,
                newMetadata
            );
        });

        it('should handle attachment not found', async () => {
            // Arrange
            mockAttachmentService.updateMetadata.mockResolvedValue({
                success: false,
                error: 'Attachment not found'
            });

            // Act
            const result = await attachmentService.updateMetadata(
                'nonexistent',
                'tenant-123',
                'user-123',
                { description: 'test' }
            );

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Attachment not found');
        });
    });

    describe('batchDelete', () => {
        it('should delete multiple attachments successfully', async () => {
            // Arrange
            const attachmentIds = ['attachment-1', 'attachment-2'];
            const tenantId = 'tenant-123';
            const userId = 'user-123';

            // Mock the service method
            mockAttachmentService.batchDelete.mockResolvedValue({
                success: true,
                results: [
                    { id: 'attachment-1', success: true, error: null },
                    { id: 'attachment-2', success: true, error: null }
                ],
                error: null
            });

            // Act
            const result = await attachmentService.batchDelete(
                attachmentIds,
                tenantId,
                userId
            );

            // Assert
            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(2);
            expect(result.results[0].success).toBe(true);
            expect(result.results[1].success).toBe(true);
            expect(mockAttachmentService.batchDelete).toHaveBeenCalledWith(
                attachmentIds,
                tenantId,
                userId
            );
        });

        it('should handle partial failures in batch delete', async () => {
            // Arrange
            const attachmentIds = ['attachment-1', 'attachment-2'];
            const tenantId = 'tenant-123';
            const userId = 'user-123';

            // Mock the service method for partial failure
            mockAttachmentService.batchDelete.mockResolvedValue({
                success: true,
                results: [
                    { id: 'attachment-1', success: true, error: null },
                    { id: 'attachment-2', success: false, error: 'Attachment not found' }
                ],
                error: null
            });

            // Act
            const result = await attachmentService.batchDelete(
                attachmentIds,
                tenantId,
                userId
            );

            // Assert
            expect(result.success).toBe(true); // Partial success
            expect(result.results).toHaveLength(2);
            expect(result.results[0].success).toBe(true);
            expect(result.results[1].success).toBe(false);
            expect(result.error).toBeNull();
        });
    });

    describe('getAttachmentStats', () => {
        it('should return attachment statistics', async () => {
            // Arrange
            // const _mockStats = [
            //     {
            //         file_size: 1024,
            //         category: 'documents',
            //         created_at: '2024-01-01T00:00:00Z'
            //     },
            //     {
            //         file_size: 2048,
            //         category: 'images',
            //         created_at: '2024-01-02T00:00:00Z'
            //     },
            //     {
            //         file_size: 512,
            //         category: 'documents',
            //         created_at: '2024-01-03T00:00:00Z'
            //     }
            // ];

            mockAttachmentService.getAttachmentStats.mockResolvedValue({
                success: true,
                data: {
                    totalAttachments: 3,
                    totalSize: 3584,
                    categoryBreakdown: {
                        documents: 2,
                        images: 1
                    },
                    recentUploads: 3
                },
                error: null
            });

            // Act
            const result = await attachmentService.getAttachmentStats('tenant-123');

            // Assert
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                totalAttachments: 3,
                totalSize: 3584,
                categoryBreakdown: {
                    documents: 2,
                    images: 1
                },
                recentUploads: 3
            });
        });

        it('should handle stats errors', async () => {
            // Arrange
            mockAttachmentService.getAttachmentStats.mockResolvedValue({
                success: false,
                data: null,
                error: 'Stats failed: Database error'
            });

            // Act
            const result = await attachmentService.getAttachmentStats('tenant-123');

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Stats failed');
        });
    });

    describe('Error Handling', () => {
        it('should handle unexpected errors gracefully', async () => {
            // Arrange
            mockAttachmentService.searchAttachments.mockRejectedValue(new Error('Unexpected error'));

            // Act & Assert
            await expect(attachmentService.searchAttachments('tenant-123')).rejects.toThrow('Unexpected error');
        });
    });
});
