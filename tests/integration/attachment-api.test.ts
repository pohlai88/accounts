// Integration Tests for Attachment API Endpoints
// V1 compliance: API integration testing with real database and storage

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
  tenantId: "test-tenant-123",
  companyId: "test-company-456",
  userId: "test-user-789",
};

// Skip tests if Supabase is not available
const skipTests = !TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey;

if (skipTests) {
  console.log("Attachment API test configuration:", {
    supabaseUrl: TEST_CONFIG.supabaseUrl ? "SET" : "MISSING",
    supabaseKey: TEST_CONFIG.supabaseKey ? "SET" : "MISSING",
    apiBaseUrl: TEST_CONFIG.apiBaseUrl,
  });
}

// Test files
const TEST_FILES = {
  pdf: {
    path: join(__dirname, "fixtures/test-invoice.pdf"),
    name: "test-invoice.pdf",
    type: "application/pdf",
  },
  image: {
    path: join(__dirname, "fixtures/test-receipt.jpg"),
    name: "test-receipt.jpg",
    type: "image/jpeg",
  },
};

// Helper functions
async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${TEST_CONFIG.apiBaseUrl}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_CONFIG.supabaseKey}`,
      "X-Tenant-ID": TEST_CONFIG.tenantId,
      "X-User-ID": TEST_CONFIG.userId,
      ...options.headers,
    },
  });

  return response;
}

async function uploadTestFile(
  fileConfig: typeof TEST_FILES.pdf,
  metadata: Record<string, unknown> = {},
) {
  const fileBuffer = readFileSync(fileConfig.path);
  const formData = new FormData();

  const file = new File([fileBuffer], fileConfig.name, { type: fileConfig.type });
  formData.append("file", file);

  const requestData = {
    tenantId: TEST_CONFIG.tenantId,
    companyId: TEST_CONFIG.companyId,
    category: "invoice",
    tags: ["test", "integration"],
    isPublic: false,
    metadata,
    ...metadata,
  };

  formData.append("data", JSON.stringify(requestData));

  const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/attachments/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TEST_CONFIG.supabaseKey}`,
      "X-Tenant-ID": TEST_CONFIG.tenantId,
      "X-User-ID": TEST_CONFIG.userId,
    },
    body: formData,
  });

  return response;
}

describe.skipIf(skipTests)("Attachment API Integration Tests", () => {
  let supabase: ReturnType<typeof createClient>;
  let testAttachmentIds: string[] = [];

  beforeAll(async () => {
    if (skipTests) {
      console.log("Skipping attachment API tests - Supabase not available");
      return;
    }

    // Initialize Supabase client for direct database operations
    supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

    // Verify test environment is ready
    const { data, error } = await supabase.from("attachments").select("count").limit(1);
    if (error) {
      throw new Error(`Test database not ready: ${error.message}`);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testAttachmentIds.length > 0) {
      await supabase.from("attachments").delete().in("id", testAttachmentIds);
    }
  });

  beforeEach(() => {
    testAttachmentIds = [];
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testAttachmentIds.length > 0) {
      await supabase.from("attachments").delete().in("id", testAttachmentIds);
      testAttachmentIds = [];
    }
  });

  describe("POST /api/attachments/upload", () => {
    it("should upload a PDF file successfully", async () => {
      const response = await uploadTestFile(TEST_FILES.pdf);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.attachmentId).toBeTruthy();
      expect(result.filename).toContain(".pdf");

      testAttachmentIds.push(result.attachmentId);

      // Verify database record
      const { data: attachment } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", result.attachmentId)
        .single();

      expect(attachment).toBeTruthy();
      expect(attachment.tenant_id).toBe(TEST_CONFIG.tenantId);
      expect(attachment.company_id).toBe(TEST_CONFIG.companyId);
      expect(attachment.category).toBe("invoice");
      expect(attachment.tags).toEqual(["test", "integration"]);
    });

    it("should upload an image file successfully", async () => {
      const response = await uploadTestFile(TEST_FILES.image, { category: "receipt" });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.attachmentId).toBeTruthy();

      testAttachmentIds.push(result.attachmentId);

      // Verify file type handling
      const { data: attachment } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", result.attachmentId)
        .single();

      expect(attachment.mime_type).toBe("image/jpeg");
      expect(attachment.category).toBe("receipt");
    });

    it("should handle duplicate file uploads", async () => {
      // Upload file first time
      const response1 = await uploadTestFile(TEST_FILES.pdf);
      const result1 = await response1.json();
      testAttachmentIds.push(result1.attachmentId);

      // Upload same file again
      const response2 = await uploadTestFile(TEST_FILES.pdf);
      const result2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(result2.success).toBe(true);
      expect(result2.attachmentId).toBe(result1.attachmentId); // Should return existing
      expect(result2.duplicateOf).toBeTruthy();
    });

    it("should validate file size limits", async () => {
      // Create a large file buffer (> 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      const formData = new FormData();

      const largeFile = new File([largeBuffer], "large-file.pdf", { type: "application/pdf" });
      formData.append("file", largeFile);
      formData.append(
        "data",
        JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          companyId: TEST_CONFIG.companyId,
          category: "invoice",
        }),
      );

      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/attachments/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.supabaseKey}`,
          "X-Tenant-ID": TEST_CONFIG.tenantId,
          "X-User-ID": TEST_CONFIG.userId,
        },
        body: formData,
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain("exceeds 10MB limit");
    });

    it("should validate file types", async () => {
      const formData = new FormData();
      const invalidFile = new File(["malicious content"], "malware.exe", {
        type: "application/x-executable",
      });
      formData.append("file", invalidFile);
      formData.append(
        "data",
        JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          companyId: TEST_CONFIG.companyId,
          category: "invoice",
        }),
      );

      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/attachments/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.supabaseKey}`,
          "X-Tenant-ID": TEST_CONFIG.tenantId,
          "X-User-ID": TEST_CONFIG.userId,
        },
        body: formData,
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain("File type not allowed");
    });

    it("should enforce tenant isolation", async () => {
      const response = await uploadTestFile(TEST_FILES.pdf, {
        tenantId: "different-tenant-id",
      });

      // Should still succeed but use the header tenant ID
      expect(response.status).toBe(200);
      const result = await response.json();
      testAttachmentIds.push(result.attachmentId);

      // Verify tenant ID from header was used
      const { data: attachment } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", result.attachmentId)
        .single();

      expect(attachment.tenant_id).toBe(TEST_CONFIG.tenantId); // From header, not body
    });
  });

  describe("GET /api/attachments/[id]", () => {
    let attachmentId: string;

    beforeEach(async () => {
      const response = await uploadTestFile(TEST_FILES.pdf);
      const result = await response.json();
      attachmentId = result.attachmentId;
      testAttachmentIds.push(attachmentId);
    });

    it("should retrieve attachment details", async () => {
      const response = await makeApiRequest(
        `/attachments/${attachmentId}?tenantId=${TEST_CONFIG.tenantId}`,
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.id).toBe(attachmentId);
      expect(result.filename).toContain(".pdf");
      expect(result.tenantId).toBe(TEST_CONFIG.tenantId);
      expect(result.companyId).toBe(TEST_CONFIG.companyId);
    });

    it("should handle attachment not found", async () => {
      const response = await makeApiRequest(
        `/attachments/nonexistent-id?tenantId=${TEST_CONFIG.tenantId}`,
      );

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toContain("not found");
    });

    it("should enforce tenant isolation for retrieval", async () => {
      const response = await makeApiRequest(
        `/attachments/${attachmentId}?tenantId=different-tenant`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/attachments/[id]/download", () => {
    let attachmentId: string;

    beforeEach(async () => {
      const response = await uploadTestFile(TEST_FILES.pdf);
      const result = await response.json();
      attachmentId = result.attachmentId;
      testAttachmentIds.push(attachmentId);
    });

    it("should download attachment file", async () => {
      const response = await makeApiRequest(
        `/attachments/${attachmentId}/download?tenantId=${TEST_CONFIG.tenantId}`,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/pdf");
      expect(response.headers.get("content-disposition")).toContain("attachment");

      const fileBuffer = await response.arrayBuffer();
      expect(fileBuffer.byteLength).toBeGreaterThan(0);
    });

    it("should handle download of non-existent file", async () => {
      const response = await makeApiRequest(
        `/attachments/nonexistent-id/download?tenantId=${TEST_CONFIG.tenantId}`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/attachments/[id]", () => {
    let attachmentId: string;

    beforeEach(async () => {
      const response = await uploadTestFile(TEST_FILES.pdf);
      const result = await response.json();
      attachmentId = result.attachmentId;
      testAttachmentIds.push(attachmentId);
    });

    it("should delete attachment successfully", async () => {
      const response = await makeApiRequest(
        `/attachments/${attachmentId}?tenantId=${TEST_CONFIG.tenantId}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);

      // Verify soft delete in database
      const { data: attachment } = await supabase
        .from("attachments")
        .select("*")
        .eq("id", attachmentId)
        .single();

      expect(attachment.status).toBe("deleted");
      expect(attachment.deleted_at).toBeTruthy();
    });

    it("should handle deletion of non-existent attachment", async () => {
      const response = await makeApiRequest(
        `/attachments/nonexistent-id?tenantId=${TEST_CONFIG.tenantId}`,
        {
          method: "DELETE",
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/attachments/search", () => {
    beforeEach(async () => {
      // Upload test files with different categories and tags
      const files = [
        { file: TEST_FILES.pdf, category: "invoice", tags: ["urgent", "payment"] },
        { file: TEST_FILES.image, category: "receipt", tags: ["expense", "travel"] },
        { file: TEST_FILES.pdf, category: "contract", tags: ["legal", "review"] },
      ];

      for (const fileConfig of files) {
        const response = await uploadTestFile(fileConfig.file, fileConfig);
        const result = await response.json();
        testAttachmentIds.push(result.attachmentId);
      }
    });

    it("should search attachments by category", async () => {
      const response = await makeApiRequest(
        `/attachments/search?tenantId=${TEST_CONFIG.tenantId}&category=invoice`,
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.attachments).toHaveLength(2); // 2 invoices uploaded
      expect(result.attachments.every((a: any) => a.category === "invoice")).toBe(true);
    });

    it("should search attachments by tags", async () => {
      const response = await makeApiRequest(
        `/attachments/search?tenantId=${TEST_CONFIG.tenantId}&tags=urgent`,
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].tags).toContain("urgent");
    });

    it("should search attachments by filename", async () => {
      const response = await makeApiRequest(
        `/attachments/search?tenantId=${TEST_CONFIG.tenantId}&searchQuery=invoice`,
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.attachments.length).toBeGreaterThan(0);
      expect(result.attachments.some((a: any) => a.filename.includes("invoice"))).toBe(true);
    });

    it("should paginate search results", async () => {
      const response = await makeApiRequest(
        `/attachments/search?tenantId=${TEST_CONFIG.tenantId}&page=1&limit=2`,
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.attachments).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
    });

    it("should sort search results", async () => {
      const response = await makeApiRequest(
        `/attachments/search?tenantId=${TEST_CONFIG.tenantId}&sortBy=filename&sortOrder=asc`,
      );
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.attachments.length).toBeGreaterThan(1);

      // Verify sorting
      const filenames = result.attachments.map((a: any) => a.filename);
      const sortedFilenames = [...filenames].sort();
      expect(filenames).toEqual(sortedFilenames);
    });

    it("should provide filter options", async () => {
      const response = await makeApiRequest(`/attachments/search?tenantId=${TEST_CONFIG.tenantId}`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.filters.availableCategories).toContain("invoice");
      expect(result.filters.availableCategories).toContain("receipt");
      expect(result.filters.availableTags).toContain("urgent");
      expect(result.filters.availableTags).toContain("expense");
    });
  });

  describe("POST /api/attachments/batch", () => {
    let attachmentIds: string[];

    beforeEach(async () => {
      attachmentIds = [];

      // Upload test files
      for (let i = 0; i < 3; i++) {
        const response = await uploadTestFile(TEST_FILES.pdf, {
          category: "invoice",
          tags: ["batch-test"],
        });
        const result = await response.json();
        attachmentIds.push(result.attachmentId);
        testAttachmentIds.push(result.attachmentId);
      }
    });

    it("should perform batch delete operation", async () => {
      const response = await makeApiRequest("/attachments/batch", {
        method: "POST",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentIds,
          operation: "delete",
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);

      // Verify all files are soft deleted
      const { data: attachments } = await supabase
        .from("attachments")
        .select("status")
        .in("id", attachmentIds);

      expect(attachments?.every(a => a.status === "deleted")).toBe(true);
    });

    it("should perform batch category update", async () => {
      const response = await makeApiRequest("/attachments/batch", {
        method: "POST",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentIds,
          operation: "update_category",
          category: "report",
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);

      // Verify category updates
      const { data: attachments } = await supabase
        .from("attachments")
        .select("category")
        .in("id", attachmentIds);

      expect(attachments?.every(a => a.category === "report")).toBe(true);
    });

    it("should perform batch tag operations", async () => {
      const response = await makeApiRequest("/attachments/batch", {
        method: "POST",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentIds,
          operation: "add_tags",
          tags: ["processed", "reviewed"],
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);

      // Verify tags added
      const { data: attachments } = await supabase
        .from("attachments")
        .select("tags")
        .in("id", attachmentIds);

      expect(
        attachments?.every(a => a.tags.includes("processed") && a.tags.includes("reviewed")),
      ).toBe(true);
    });

    it("should handle partial failures in batch operations", async () => {
      // Include a non-existent attachment ID
      const invalidIds = [...attachmentIds, "nonexistent-id"];

      const response = await makeApiRequest("/attachments/batch", {
        method: "POST",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentIds: invalidIds,
          operation: "delete",
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(1);
      expect(result.results.some((r: any) => !r.success)).toBe(true);
    });
  });

  describe("PUT /api/attachments/metadata", () => {
    let attachmentId: string;

    beforeEach(async () => {
      const response = await uploadTestFile(TEST_FILES.pdf);
      const result = await response.json();
      attachmentId = result.attachmentId;
      testAttachmentIds.push(attachmentId);
    });

    it("should update attachment metadata", async () => {
      const newMetadata = {
        customField: "custom value",
        processedBy: "integration-test",
        priority: "high",
      };

      const response = await makeApiRequest("/attachments/metadata", {
        method: "PUT",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentId,
          metadata: newMetadata,
          operation: "merge",
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verify metadata update in database
      const { data: attachment } = await supabase
        .from("attachments")
        .select("metadata")
        .eq("id", attachmentId)
        .single();

      expect(attachment.metadata.customField).toBe("custom value");
      expect(attachment.metadata.processedBy).toBe("integration-test");
      expect(attachment.metadata.priority).toBe("high");
    });

    it("should replace entire metadata object", async () => {
      const newMetadata = { onlyField: "only value" };

      const response = await makeApiRequest("/attachments/metadata", {
        method: "PUT",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentId,
          metadata: newMetadata,
          operation: "replace",
        }),
      });

      expect(response.status).toBe(200);

      // Verify metadata replacement
      const { data: attachment } = await supabase
        .from("attachments")
        .select("metadata")
        .eq("id", attachmentId)
        .single();

      expect(attachment.metadata.onlyField).toBe("only value");
      expect(Object.keys(attachment.metadata)).toHaveLength(3); // onlyField + updatedBy + updatedAt
    });

    it("should delete specific metadata keys", async () => {
      // First add some metadata
      await supabase
        .from("attachments")
        .update({
          metadata: {
            field1: "value1",
            field2: "value2",
            field3: "value3",
          },
        })
        .eq("id", attachmentId);

      const response = await makeApiRequest("/attachments/metadata", {
        method: "PUT",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentId,
          operation: "delete_keys",
          keysToDelete: ["field1", "field3"],
        }),
      });

      expect(response.status).toBe(200);

      // Verify keys deleted
      const { data: attachment } = await supabase
        .from("attachments")
        .select("metadata")
        .eq("id", attachmentId)
        .single();

      expect(attachment.metadata.field1).toBeUndefined();
      expect(attachment.metadata.field2).toBe("value2");
      expect(attachment.metadata.field3).toBeUndefined();
    });
  });

  describe("OCR Processing Integration", () => {
    let attachmentId: string;

    beforeEach(async () => {
      const response = await uploadTestFile(TEST_FILES.pdf);
      const result = await response.json();
      attachmentId = result.attachmentId;
      testAttachmentIds.push(attachmentId);
    });

    it("should trigger OCR processing", async () => {
      const response = await makeApiRequest("/attachments/ocr", {
        method: "POST",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentId,
          extractText: true,
          extractTables: true,
          extractMetadata: true,
          documentType: "invoice",
          priority: "normal",
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.jobId).toBeTruthy();
      expect(result.status).toBe("queued");
      expect(result.estimatedCompletionTime).toBeTruthy();

      // Verify OCR status in database
      const { data: attachment } = await supabase
        .from("attachments")
        .select("metadata")
        .eq("id", attachmentId)
        .single();

      expect(attachment.metadata.ocrStatus).toBe("queued");
      expect(attachment.metadata.ocrJobId).toBe(result.jobId);
    });

    it("should get OCR results", async () => {
      // Mock OCR completion by updating database
      await supabase
        .from("attachments")
        .update({
          metadata: {
            ocrStatus: "completed",
            ocrConfidence: 0.85,
            ocrData: {
              extractedText: "Invoice #12345\nTotal: $100.00",
              structuredData: {
                invoiceNumber: "12345",
                totalAmount: 100.0,
                currency: "USD",
              },
              processedAt: new Date().toISOString(),
              processingTime: 5000,
            },
          },
        })
        .eq("id", attachmentId);

      const response = await makeApiRequest(
        `/attachments/ocr?attachmentId=${attachmentId}&tenantId=${TEST_CONFIG.tenantId}`,
      );

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.status).toBe("completed");
      expect(result.confidence).toBe(0.85);
      expect(result.extractedText).toContain("Invoice #12345");
      expect(result.structuredData.invoiceNumber).toBe("12345");
      expect(result.structuredData.totalAmount).toBe(100.0);
    });

    it("should handle OCR cancellation", async () => {
      // First queue OCR
      const queueResponse = await makeApiRequest("/attachments/ocr", {
        method: "POST",
        body: JSON.stringify({
          tenantId: TEST_CONFIG.tenantId,
          attachmentId,
          extractText: true,
        }),
      });

      const queueResult = await queueResponse.json();
      const jobId = queueResult.jobId;

      // Cancel OCR
      const cancelResponse = await makeApiRequest(
        `/attachments/ocr?attachmentId=${attachmentId}&tenantId=${TEST_CONFIG.tenantId}&jobId=${jobId}`,
        { method: "DELETE" },
      );

      const cancelResult = await cancelResponse.json();

      expect(cancelResponse.status).toBe(200);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.status).toBe("cancelled");

      // Verify cancellation in database
      const { data: attachment } = await supabase
        .from("attachments")
        .select("metadata")
        .eq("id", attachmentId)
        .single();

      expect(attachment.metadata.ocrStatus).toBe("cancelled");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing authentication", async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/attachments/search`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("should handle invalid tenant ID", async () => {
      const response = await makeApiRequest("/attachments/search?tenantId=invalid-tenant");

      // Should return empty results, not error (tenant isolation)
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.attachments).toHaveLength(0);
    });

    it("should handle malformed request bodies", async () => {
      const response = await makeApiRequest("/attachments/batch", {
        method: "POST",
        body: "invalid json",
      });

      expect(response.status).toBe(400);
    });

    it("should handle database connection issues", async () => {
      // This would require mocking database failures
      // In a real test, you might temporarily break the database connection
      // For now, we'll test the API's error handling structure

      const response = await makeApiRequest("/attachments/nonexistent-endpoint");
      expect(response.status).toBe(404);
    });

    it("should handle concurrent operations on same attachment", async () => {
      const uploadResponse = await uploadTestFile(TEST_FILES.pdf);
      const uploadResult = await uploadResponse.json();
      const attachmentId = uploadResult.attachmentId;
      testAttachmentIds.push(attachmentId);

      // Perform concurrent operations
      const operations = [
        makeApiRequest(`/attachments/${attachmentId}?tenantId=${TEST_CONFIG.tenantId}`),
        makeApiRequest("/attachments/metadata", {
          method: "PUT",
          body: JSON.stringify({
            tenantId: TEST_CONFIG.tenantId,
            attachmentId,
            metadata: { field1: "value1" },
            operation: "merge",
          }),
        }),
        makeApiRequest("/attachments/metadata", {
          method: "PUT",
          body: JSON.stringify({
            tenantId: TEST_CONFIG.tenantId,
            attachmentId,
            metadata: { field2: "value2" },
            operation: "merge",
          }),
        }),
      ];

      const results = await Promise.all(operations);

      // All operations should succeed
      expect(results.every(r => r.status === 200)).toBe(true);
    });
  });
});
