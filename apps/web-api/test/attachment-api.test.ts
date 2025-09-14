// Attachment API Endpoints Unit Tests
// V1 compliance: Comprehensive test coverage for API endpoints

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { attachmentService } from "@aibos/utils/storage/attachment-service";
import { createClient } from "@supabase/supabase-js";

// Mock dependencies
vi.mock("@aibos/utils/storage/attachment-service");
vi.mock("@supabase/supabase-js");

describe("Attachment API Endpoints - Unit Tests", () => {
  let mockAttachmentService: unknown;
  let mockSupabase: unknown;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock attachment service
    mockAttachmentService = {
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
      deleteFile: vi.fn(),
      searchAttachments: vi.fn(),
      updateMetadata: vi.fn(),
      batchDelete: vi.fn(),
      batchUpdate: vi.fn(),
    };

    // Mock the attachmentService module
    vi.mocked(attachmentService).uploadFile = mockAttachmentService.uploadFile;
    vi.mocked(attachmentService).downloadFile = mockAttachmentService.downloadFile;
    vi.mocked(attachmentService).deleteFile = mockAttachmentService.deleteFile;
    vi.mocked(attachmentService).searchAttachments = mockAttachmentService.searchAttachments;
    vi.mocked(attachmentService).updateMetadata = mockAttachmentService.updateMetadata;
    vi.mocked(attachmentService).batchDelete = mockAttachmentService.batchDelete;
    vi.mocked(attachmentService).batchUpdate = mockAttachmentService.batchUpdate;

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/attachments/upload", () => {
    it("should handle successful file upload", async () => {
      // Arrange
      const mockFile = new File(["test content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("category", "invoice");
      formData.append("tags", JSON.stringify(["urgent", "test"]));

      const mockResult = {
        success: true,
        attachmentId: "attachment-123",
        filename: "test.pdf",
        url: "https://storage.example.com/test.pdf",
      };

      mockAttachmentService.uploadFile.mockResolvedValue(mockResult);

      // Mock security context
      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/upload/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.attachmentId).toBe("attachment-123");
      expect(mockAttachmentService.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        "test.pdf",
        "application/pdf",
        expect.objectContaining({
          tenantId: "tenant-123",
          companyId: "company-456",
          userId: "user-789",
          category: "invoice",
          tags: ["urgent", "test"],
        }),
      );
    });

    it("should handle upload validation errors", async () => {
      // Arrange
      const formData = new FormData();
      // Missing required fields

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/upload/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("File is required");
    });

    it("should handle file size validation", async () => {
      // Arrange
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", largeFile);
      formData.append("category", "invoice");

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/upload/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("exceeds 10MB limit");
    });

    it("should handle file type validation", async () => {
      // Arrange
      const invalidFile = new File(["test"], "test.exe", { type: "application/x-executable" });
      const formData = new FormData();
      formData.append("file", invalidFile);
      formData.append("category", "invoice");

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/upload/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("File type not allowed");
    });

    it("should handle service errors", async () => {
      // Arrange
      const mockFile = new File(["test content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("category", "invoice");

      mockAttachmentService.uploadFile.mockResolvedValue({
        success: false,
        error: "Storage quota exceeded",
      });

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/upload/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Storage quota exceeded");
    });
  });

  describe("GET /api/attachments/[id]", () => {
    it("should retrieve attachment details successfully", async () => {
      // Arrange
      const attachmentId = "attachment-123";
      const mockAttachment = {
        id: attachmentId,
        filename: "test.pdf",
        category: "invoice",
        fileSize: 1024,
        mimeType: "application/pdf",
        createdAt: "2024-01-01T00:00:00Z",
        tags: ["urgent"],
        metadata: { customField: "value" },
      };

      mockSupabase.single.mockResolvedValue({
        data: mockAttachment,
        error: null,
      });

      const mockRequest = {
        params: { id: attachmentId },
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/[id]/route");
      const response = await GET(mockRequest, { params: { id: attachmentId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.attachment).toEqual(mockAttachment);
    });

    it("should handle attachment not found", async () => {
      // Arrange
      const attachmentId = "non-existent-attachment";

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "No rows returned" },
      });

      const mockRequest = {
        params: { id: attachmentId },
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/[id]/route");
      const response = await GET(mockRequest, { params: { id: attachmentId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Attachment not found");
    });
  });

  describe("GET /api/attachments/[id]/download", () => {
    it("should download file successfully", async () => {
      // Arrange
      const attachmentId = "attachment-123";
      const mockFileData = Buffer.from("file content");
      const mockResult = {
        success: true,
        data: mockFileData,
        filename: "test.pdf",
        mimeType: "application/pdf",
      };

      mockAttachmentService.downloadFile.mockResolvedValue(mockResult);

      const mockRequest = {
        params: { id: attachmentId },
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/[id]/download/route");
      const response = await GET(mockRequest, { params: { id: attachmentId } });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
      expect(response.headers.get("content-disposition")).toContain("attachment");
    });

    it("should handle download errors", async () => {
      // Arrange
      const attachmentId = "attachment-123";
      const mockResult = {
        success: false,
        error: "File not found in storage",
      };

      mockAttachmentService.downloadFile.mockResolvedValue(mockResult);

      const mockRequest = {
        params: { id: attachmentId },
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/[id]/download/route");
      const response = await GET(mockRequest, { params: { id: attachmentId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found in storage");
    });
  });

  describe("DELETE /api/attachments/[id]", () => {
    it("should delete attachment successfully", async () => {
      // Arrange
      const attachmentId = "attachment-123";
      const mockResult = {
        success: true,
      };

      mockAttachmentService.deleteFile.mockResolvedValue(mockResult);

      const mockRequest = {
        params: { id: attachmentId },
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { DELETE } = await import("../app/api/attachments/[id]/route");
      const response = await DELETE(mockRequest, { params: { id: attachmentId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(mockAttachmentService.deleteFile).toHaveBeenCalledWith(attachmentId, "user-789");
    });

    it("should handle deletion errors", async () => {
      // Arrange
      const attachmentId = "attachment-123";
      const mockResult = {
        success: false,
        error: "Attachment not found",
      };

      mockAttachmentService.deleteFile.mockResolvedValue(mockResult);

      const mockRequest = {
        params: { id: attachmentId },
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { DELETE } = await import("../app/api/attachments/[id]/route");
      const response = await DELETE(mockRequest, { params: { id: attachmentId } });
      const result = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Attachment not found");
    });
  });

  describe("GET /api/attachments/search", () => {
    it("should search attachments with filters", async () => {
      // Arrange
      const mockSearchResult = {
        success: true,
        attachments: [
          {
            id: "attachment-1",
            filename: "invoice-1.pdf",
            category: "invoice",
            tags: ["urgent"],
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockAttachmentService.searchAttachments.mockResolvedValue(mockSearchResult);

      const mockRequest = {
        url: "https://api.example.com/api/attachments/search?category=invoice&search=invoice&page=1&limit=10",
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/search/route");
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.attachments).toHaveLength(1);
      expect(mockAttachmentService.searchAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant-123",
          companyId: "company-456",
          category: "invoice",
          searchTerm: "invoice",
          page: 1,
          limit: 10,
        }),
      );
    });

    it("should handle search errors", async () => {
      // Arrange
      const mockSearchResult = {
        success: false,
        error: "Database query failed",
      };

      mockAttachmentService.searchAttachments.mockResolvedValue(mockSearchResult);

      const mockRequest = {
        url: "https://api.example.com/api/attachments/search",
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/search/route");
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Database query failed");
    });
  });

  describe("POST /api/attachments/batch", () => {
    it("should perform batch delete successfully", async () => {
      // Arrange
      const batchRequest = {
        operation: "delete",
        attachmentIds: ["attachment-1", "attachment-2"],
      };

      const mockResult = {
        success: true,
        successCount: 2,
        failedCount: 0,
        errors: [],
      };

      mockAttachmentService.batchDelete.mockResolvedValue(mockResult);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(batchRequest),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/batch/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(mockAttachmentService.batchDelete).toHaveBeenCalledWith(
        ["attachment-1", "attachment-2"],
        "user-789",
      );
    });

    it("should handle batch operation errors", async () => {
      // Arrange
      const batchRequest = {
        operation: "delete",
        attachmentIds: ["attachment-1", "attachment-2"],
      };

      const mockResult = {
        success: true,
        successCount: 1,
        failedCount: 1,
        errors: [{ attachmentId: "attachment-2", error: "Not found" }],
      };

      mockAttachmentService.batchDelete.mockResolvedValue(mockResult);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(batchRequest),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/batch/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(207); // Multi-status
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("PUT /api/attachments/metadata", () => {
    it("should update metadata successfully", async () => {
      // Arrange
      const metadataRequest = {
        attachmentId: "attachment-123",
        metadata: { customField: "updatedValue" },
      };

      const mockResult = {
        success: true,
      };

      mockAttachmentService.updateMetadata.mockResolvedValue(mockResult);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(metadataRequest),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { PUT } = await import("../app/api/attachments/metadata/route");
      const response = await PUT(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(mockAttachmentService.updateMetadata).toHaveBeenCalledWith(
        "attachment-123",
        "user-789",
        { customField: "updatedValue" },
      );
    });

    it("should handle metadata update errors", async () => {
      // Arrange
      const metadataRequest = {
        attachmentId: "non-existent-attachment",
        metadata: { customField: "value" },
      };

      const mockResult = {
        success: false,
        error: "Attachment not found",
      };

      mockAttachmentService.updateMetadata.mockResolvedValue(mockResult);

      const mockRequest = {
        json: vi.fn().mockResolvedValue(metadataRequest),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { PUT } = await import("../app/api/attachments/metadata/route");
      const response = await PUT(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Attachment not found");
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle missing authentication", async () => {
      // Arrange
      const mockRequest = {
        headers: new Headers({
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { GET } = await import("../app/api/attachments/search/route");
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should handle malformed request bodies", async () => {
      // Arrange
      const mockRequest = {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/batch/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid request format");
    });

    it("should handle service timeouts", async () => {
      // Arrange
      const mockFile = new File(["test content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("category", "invoice");

      mockAttachmentService.uploadFile.mockImplementation(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error("Service timeout")), 100)),
      );

      const mockRequest = {
        formData: vi.fn().mockResolvedValue(formData),
        headers: new Headers({
          authorization: "Bearer valid-token",
          "x-tenant-id": "tenant-123",
          "x-user-id": "user-789",
        }),
      } as unknown as NextRequest;

      // Act
      const { POST } = await import("../app/api/attachments/upload/route");
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Service timeout");
    });
  });
});
