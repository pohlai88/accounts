// E2E Tests for Complete Attachment System
// V1 compliance: End-to-end testing of file upload, OCR, approval, and retention workflows

import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

// Test data and utilities
const TEST_FILES = {
  pdf: {
    path: join(__dirname, "fixtures/test-invoice.pdf"),
    name: "test-invoice.pdf",
    type: "application/pdf",
    category: "invoice",
  },
  image: {
    path: join(__dirname, "fixtures/test-receipt.jpg"),
    name: "test-receipt.jpg",
    type: "image/jpeg",
    category: "receipt",
  },
  document: {
    path: join(__dirname, "fixtures/test-contract.docx"),
    name: "test-contract.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "contract",
  },
};

const TEST_USER = {
  email: "test@example.com",
  password: "test123",
  tenantId: "test-tenant-123",
  companyId: "test-company-456",
};

// Helper functions
async function loginUser(page: Page) {
  await page.goto("/login");
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL("/dashboard");
}

async function navigateToDocuments(page: Page) {
  await page.click('[data-testid="documents-nav"]');
  await page.waitForURL("/documents");
}

async function uploadFile(page: Page, fileConfig: typeof TEST_FILES.pdf) {
  // Open file upload dialog
  await page.click('[data-testid="upload-button"]');

  // Upload file using file input
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(fileConfig.path);

  // Set file metadata
  await page.selectOption('[data-testid="category-select"]', fileConfig.category);
  await page.fill('[data-testid="tags-input"]', "test,e2e,automated");

  // Submit upload
  await page.click('[data-testid="upload-submit"]');

  // Wait for upload completion
  await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });

  // Get uploaded file ID from success message
  const fileId = await page.getAttribute('[data-testid="upload-success"]', "data-file-id");
  return fileId;
}

test.describe("Attachment System E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await navigateToDocuments(page);
  });

  test.describe("File Upload and Management", () => {
    test("should upload PDF file successfully", async ({ page }) => {
      const fileId = await uploadFile(page, TEST_FILES.pdf);

      expect(fileId).toBeTruthy();

      // Verify file appears in document list
      await page.waitForSelector(`[data-testid="document-${fileId}"]`);
      const documentItem = page.locator(`[data-testid="document-${fileId}"]`);

      await expect(documentItem).toContainText(TEST_FILES.pdf.name);
      await expect(documentItem).toContainText("invoice");
      await expect(documentItem).toContainText("test");
    });

    test("should upload image file successfully", async ({ page }) => {
      const fileId = await uploadFile(page, TEST_FILES.image);

      expect(fileId).toBeTruthy();

      // Verify file appears in document list
      const documentItem = page.locator(`[data-testid="document-${fileId}"]`);
      await expect(documentItem).toContainText(TEST_FILES.image.name);
      await expect(documentItem).toContainText("receipt");
    });

    test("should handle drag and drop upload", async ({ page }) => {
      // Create a file buffer for drag and drop
      const fileBuffer = readFileSync(TEST_FILES.pdf.path);

      // Simulate drag and drop
      const dropZone = page.locator('[data-testid="drop-zone"]');
      await dropZone.dispatchEvent("dragenter", {
        dataTransfer: {
          files: [
            {
              name: TEST_FILES.pdf.name,
              type: TEST_FILES.pdf.type,
              size: fileBuffer.length,
            },
          ],
        },
      });

      await dropZone.dispatchEvent("drop", {
        dataTransfer: {
          files: [
            {
              name: TEST_FILES.pdf.name,
              type: TEST_FILES.pdf.type,
              size: fileBuffer.length,
              arrayBuffer: () => Promise.resolve(fileBuffer.buffer),
            },
          ],
        },
      });

      // Verify upload progress
      await page.waitForSelector('[data-testid="upload-progress"]');
      await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });
    });

    test("should validate file size limits", async ({ page }) => {
      // Try to upload a file that's too large (mock)
      await page.click('[data-testid="upload-button"]');

      // Mock large file upload
      await page.evaluate(() => {
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
        const largeFile = new File(["x".repeat(20 * 1024 * 1024)], "large-file.pdf", {
          type: "application/pdf",
        });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(largeFile);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Verify error message
      await expect(page.locator('[data-testid="upload-error"]')).toContainText(
        "exceeds 10MB limit",
      );
    });

    test("should validate file types", async ({ page }) => {
      await page.click('[data-testid="upload-button"]');

      // Mock unsupported file type
      await page.evaluate(() => {
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
        const unsupportedFile = new File(["test"], "malicious.exe", {
          type: "application/x-executable",
        });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(unsupportedFile);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Verify error message
      await expect(page.locator('[data-testid="upload-error"]')).toContainText(
        "File type not supported",
      );
    });
  });

  test.describe("Document Search and Filtering", () => {
    test.beforeEach(async ({ page }) => {
      // Upload test files for search testing
      await uploadFile(page, TEST_FILES.pdf);
      await uploadFile(page, TEST_FILES.image);
      await uploadFile(page, TEST_FILES.document);
    });

    test("should search documents by filename", async ({ page }) => {
      // Search for specific file
      await page.fill('[data-testid="search-input"]', "invoice");
      await page.press('[data-testid="search-input"]', "Enter");

      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]');

      // Verify only invoice documents are shown
      const results = page.locator('[data-testid^="document-"]');
      await expect(results).toHaveCount(1);
      await expect(results.first()).toContainText("test-invoice.pdf");
    });

    test("should filter documents by category", async ({ page }) => {
      // Filter by invoice category
      await page.selectOption('[data-testid="category-filter"]', "invoice");

      // Wait for filter to apply
      await page.waitForSelector('[data-testid="filter-results"]');

      // Verify only invoice documents are shown
      const results = page.locator('[data-testid^="document-"]');
      await expect(results).toHaveCount(1);
      await expect(results.first()).toContainText("invoice");
    });

    test("should filter documents by tags", async ({ page }) => {
      // Filter by tag
      await page.click('[data-testid="tags-filter"]');
      await page.click('[data-testid="tag-test"]');

      // Wait for filter to apply
      await page.waitForSelector('[data-testid="filter-results"]');

      // Verify all test documents are shown
      const results = page.locator('[data-testid^="document-"]');
      await expect(results).toHaveCount(3);
    });

    test("should sort documents by different criteria", async ({ page }) => {
      // Sort by filename A-Z
      await page.selectOption('[data-testid="sort-select"]', "filename-asc");

      // Wait for sort to apply
      await page.waitForTimeout(1000);

      // Verify sort order
      const firstDocument = page.locator('[data-testid^="document-"]').first();
      await expect(firstDocument).toContainText("test-contract.docx");

      // Sort by filename Z-A
      await page.selectOption('[data-testid="sort-select"]', "filename-desc");
      await page.waitForTimeout(1000);

      const firstDocumentDesc = page.locator('[data-testid^="document-"]').first();
      await expect(firstDocumentDesc).toContainText("test-receipt.jpg");
    });

    test("should paginate search results", async ({ page }) => {
      // Mock many documents for pagination testing
      await page.evaluate(() => {
        // Add mock documents to trigger pagination
        for (let i = 0; i < 25; i++) {
          const mockDoc = document.createElement("div");
          mockDoc.setAttribute("data-testid", `document-mock-${i}`);
          mockDoc.textContent = `Mock Document ${i}`;
          document.querySelector('[data-testid="document-list"]')?.appendChild(mockDoc);
        }
      });

      // Verify pagination controls appear
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
      await expect(page.locator('[data-testid="next-page"]')).toBeVisible();

      // Navigate to next page
      await page.click('[data-testid="next-page"]');
      await page.waitForSelector('[data-testid="page-2-active"]');
    });
  });

  test.describe("Document Preview and Download", () => {
    let fileId: string;

    test.beforeEach(async ({ page }) => {
      fileId = await uploadFile(page, TEST_FILES.pdf);
    });

    test("should preview PDF document", async ({ page }) => {
      // Click on document to open preview
      await page.click(`[data-testid="document-${fileId}"]`);

      // Wait for preview modal
      await page.waitForSelector('[data-testid="document-preview"]');

      // Verify preview content
      await expect(page.locator('[data-testid="preview-filename"]')).toContainText(
        TEST_FILES.pdf.name,
      );
      await expect(page.locator('[data-testid="preview-iframe"]')).toBeVisible();

      // Close preview
      await page.click('[data-testid="preview-close"]');
      await expect(page.locator('[data-testid="document-preview"]')).not.toBeVisible();
    });

    test("should download document", async ({ page }) => {
      // Set up download handler
      const downloadPromise = page.waitForEvent("download");

      // Click download button
      await page.click(`[data-testid="download-${fileId}"]`);

      // Wait for download to start
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toBe(TEST_FILES.pdf.name);
    });

    test("should show document metadata", async ({ page }) => {
      // Click on document info
      await page.click(`[data-testid="info-${fileId}"]`);

      // Wait for metadata panel
      await page.waitForSelector('[data-testid="document-metadata"]');

      // Verify metadata fields
      await expect(page.locator('[data-testid="metadata-filename"]')).toContainText(
        TEST_FILES.pdf.name,
      );
      await expect(page.locator('[data-testid="metadata-category"]')).toContainText("invoice");
      await expect(page.locator('[data-testid="metadata-size"]')).toBeVisible();
      await expect(page.locator('[data-testid="metadata-uploaded"]')).toBeVisible();
    });
  });

  test.describe("OCR Processing Workflow", () => {
    let fileId: string;

    test.beforeEach(async ({ page }) => {
      fileId = await uploadFile(page, TEST_FILES.pdf);
    });

    test("should trigger OCR processing", async ({ page }) => {
      // Click OCR button
      await page.click(`[data-testid="ocr-${fileId}"]`);

      // Wait for OCR modal
      await page.waitForSelector('[data-testid="ocr-modal"]');

      // Configure OCR options
      await page.check('[data-testid="extract-text"]');
      await page.check('[data-testid="extract-tables"]');
      await page.selectOption('[data-testid="document-type"]', "invoice");

      // Start OCR processing
      await page.click('[data-testid="start-ocr"]');

      // Verify processing started
      await expect(page.locator('[data-testid="ocr-status"]')).toContainText("Processing");

      // Wait for completion (with timeout)
      await page.waitForSelector('[data-testid="ocr-completed"]', { timeout: 60000 });

      // Verify OCR results
      await expect(page.locator('[data-testid="ocr-confidence"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-text"]')).toBeVisible();
    });

    test("should display OCR results", async ({ page }) => {
      // Mock OCR completion
      await page.evaluate(fileId => {
        // Simulate OCR completion
        window.dispatchEvent(
          new CustomEvent("ocr-completed", {
            detail: {
              attachmentId: fileId,
              confidence: 0.85,
              extractedText: "Invoice #12345\nTotal: $100.00",
              structuredData: {
                invoiceNumber: "12345",
                totalAmount: 100.0,
                currency: "USD",
              },
            },
          }),
        );
      }, fileId);

      // Verify OCR results display
      await page.waitForSelector('[data-testid="ocr-results"]');
      await expect(page.locator('[data-testid="ocr-confidence"]')).toContainText("85%");
      await expect(page.locator('[data-testid="extracted-text"]')).toContainText("Invoice #12345");
      await expect(page.locator('[data-testid="structured-data"]')).toContainText("12345");
    });

    test("should handle OCR errors", async ({ page }) => {
      // Mock OCR failure
      await page.evaluate(fileId => {
        window.dispatchEvent(
          new CustomEvent("ocr-failed", {
            detail: {
              attachmentId: fileId,
              error: "File format not supported for OCR",
            },
          }),
        );
      }, fileId);

      // Verify error display
      await page.waitForSelector('[data-testid="ocr-error"]');
      await expect(page.locator('[data-testid="ocr-error"]')).toContainText(
        "File format not supported",
      );
    });
  });

  test.describe("Document Approval Workflow", () => {
    let fileId: string;

    test.beforeEach(async ({ page }) => {
      fileId = await uploadFile(page, TEST_FILES.pdf);
    });

    test("should start approval workflow", async ({ page }) => {
      // Click approve button
      await page.click(`[data-testid="approve-${fileId}"]`);

      // Wait for approval modal
      await page.waitForSelector('[data-testid="approval-modal"]');

      // Configure approval workflow
      await page.selectOption('[data-testid="workflow-type"]', "single_approver");
      await page.fill('[data-testid="approver-email"]', "approver@example.com");
      await page.fill('[data-testid="approval-comments"]', "Please review this invoice");

      // Start approval workflow
      await page.click('[data-testid="start-approval"]');

      // Verify workflow started
      await expect(page.locator('[data-testid="approval-status"]')).toContainText(
        "Pending Approval",
      );

      // Verify notification sent
      await expect(page.locator('[data-testid="approval-notification"]')).toContainText(
        "Approval request sent",
      );
    });

    test("should handle approval decision", async ({ page }) => {
      // Mock approval decision
      await page.evaluate(fileId => {
        window.dispatchEvent(
          new CustomEvent("approval-decision", {
            detail: {
              attachmentId: fileId,
              decision: "approved",
              approver: "approver@example.com",
              comments: "Invoice approved for payment",
            },
          }),
        );
      }, fileId);

      // Verify approval status update
      await page.waitForSelector('[data-testid="approval-approved"]');
      await expect(page.locator('[data-testid="approval-status"]')).toContainText("Approved");
      await expect(page.locator('[data-testid="approval-comments"]')).toContainText(
        "approved for payment",
      );
    });

    test("should handle approval rejection", async ({ page }) => {
      // Mock approval rejection
      await page.evaluate(fileId => {
        window.dispatchEvent(
          new CustomEvent("approval-decision", {
            detail: {
              attachmentId: fileId,
              decision: "rejected",
              approver: "approver@example.com",
              comments: "Invoice amount exceeds budget",
            },
          }),
        );
      }, fileId);

      // Verify rejection status
      await page.waitForSelector('[data-testid="approval-rejected"]');
      await expect(page.locator('[data-testid="approval-status"]')).toContainText("Rejected");
      await expect(page.locator('[data-testid="rejection-reason"]')).toContainText(
        "exceeds budget",
      );
    });
  });

  test.describe("Batch Operations", () => {
    let fileIds: string[];

    test.beforeEach(async ({ page }) => {
      // Upload multiple files for batch testing
      fileIds = [];
      fileIds.push(await uploadFile(page, TEST_FILES.pdf));
      fileIds.push(await uploadFile(page, TEST_FILES.image));
      fileIds.push(await uploadFile(page, TEST_FILES.document));
    });

    test("should select multiple documents", async ({ page }) => {
      // Enable bulk selection mode
      await page.click('[data-testid="bulk-select-toggle"]');

      // Select multiple documents
      for (const fileId of fileIds) {
        await page.check(`[data-testid="select-${fileId}"]`);
      }

      // Verify selection count
      await expect(page.locator('[data-testid="selection-count"]')).toContainText(
        "3 documents selected",
      );

      // Verify bulk actions are available
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    });

    test("should perform bulk delete operation", async ({ page }) => {
      // Select documents and delete
      await page.click('[data-testid="bulk-select-toggle"]');

      for (const fileId of fileIds) {
        await page.check(`[data-testid="select-${fileId}"]`);
      }

      // Click bulk delete
      await page.click('[data-testid="bulk-delete"]');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');

      // Verify deletion success
      await page.waitForSelector('[data-testid="bulk-delete-success"]');
      await expect(page.locator('[data-testid="bulk-delete-success"]')).toContainText(
        "3 documents deleted",
      );
    });

    test("should perform bulk category update", async ({ page }) => {
      // Select documents and update category
      await page.click('[data-testid="bulk-select-toggle"]');

      for (const fileId of fileIds) {
        await page.check(`[data-testid="select-${fileId}"]`);
      }

      // Click bulk update category
      await page.click('[data-testid="bulk-update-category"]');
      await page.selectOption('[data-testid="new-category"]', "report");
      await page.click('[data-testid="confirm-update"]');

      // Verify update success
      await page.waitForSelector('[data-testid="bulk-update-success"]');

      // Verify category changes
      for (const fileId of fileIds) {
        await expect(page.locator(`[data-testid="document-${fileId}"]`)).toContainText("report");
      }
    });

    test("should perform bulk tag operations", async ({ page }) => {
      // Select documents and add tags
      await page.click('[data-testid="bulk-select-toggle"]');

      for (const fileId of fileIds) {
        await page.check(`[data-testid="select-${fileId}"]`);
      }

      // Add tags to selected documents
      await page.click('[data-testid="bulk-add-tags"]');
      await page.fill('[data-testid="new-tags"]', "bulk-processed,reviewed");
      await page.click('[data-testid="confirm-add-tags"]');

      // Verify tags added
      await page.waitForSelector('[data-testid="bulk-tags-success"]');

      for (const fileId of fileIds) {
        const documentItem = page.locator(`[data-testid="document-${fileId}"]`);
        await expect(documentItem).toContainText("bulk-processed");
        await expect(documentItem).toContainText("reviewed");
      }
    });
  });

  test.describe("Document Retention and Compliance", () => {
    let fileId: string;

    test.beforeEach(async ({ page }) => {
      fileId = await uploadFile(page, TEST_FILES.pdf);
    });

    test("should display retention information", async ({ page }) => {
      // Click on document info to see retention details
      await page.click(`[data-testid="info-${fileId}"]`);

      // Wait for metadata panel
      await page.waitForSelector('[data-testid="document-metadata"]');

      // Verify retention information
      await expect(page.locator('[data-testid="retention-policy"]')).toBeVisible();
      await expect(page.locator('[data-testid="retention-until"]')).toBeVisible();
    });

    test("should handle legal hold", async ({ page }) => {
      // Apply legal hold
      await page.click(`[data-testid="legal-hold-${fileId}"]`);

      // Fill legal hold form
      await page.fill('[data-testid="legal-case"]', "Case #2024-001");
      await page.fill('[data-testid="hold-reason"]', "Litigation hold for contract dispute");
      await page.click('[data-testid="apply-hold"]');

      // Verify legal hold applied
      await expect(page.locator('[data-testid="legal-hold-status"]')).toContainText(
        "On Legal Hold",
      );
      await expect(page.locator('[data-testid="hold-indicator"]')).toBeVisible();
    });

    test("should show retention warnings", async ({ page }) => {
      // Mock document approaching retention expiry
      await page.evaluate(fileId => {
        window.dispatchEvent(
          new CustomEvent("retention-warning", {
            detail: {
              attachmentId: fileId,
              daysUntilExpiry: 7,
              action: "archive",
            },
          }),
        );
      }, fileId);

      // Verify retention warning
      await page.waitForSelector('[data-testid="retention-warning"]');
      await expect(page.locator('[data-testid="retention-warning"]')).toContainText("7 days");
      await expect(page.locator('[data-testid="retention-action"]')).toContainText("archive");
    });
  });

  test.describe("Performance and Reliability", () => {
    test("should handle large file uploads", async ({ page }) => {
      // Mock large file upload
      await page.evaluate(() => {
        const largeFile = new File(["x".repeat(5 * 1024 * 1024)], "large-document.pdf", {
          type: "application/pdf",
        });

        // Simulate file selection
        const fileInput = document.querySelector('[data-testid="file-input"]') as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(largeFile);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Verify upload progress tracking
      await page.waitForSelector('[data-testid="upload-progress"]');
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-percentage"]')).toBeVisible();
    });

    test("should handle network interruptions gracefully", async ({ page }) => {
      // Simulate network failure during upload
      await page.route("**/api/attachments/upload", route => {
        route.abort("failed");
      });

      const fileId = await uploadFile(page, TEST_FILES.pdf).catch(() => null);

      // Verify error handling
      await expect(page.locator('[data-testid="upload-error"]')).toContainText("Upload failed");
      await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
    });

    test("should maintain responsive UI during operations", async ({ page }) => {
      // Start multiple operations simultaneously
      const fileId = await uploadFile(page, TEST_FILES.pdf);

      // Trigger OCR and approval simultaneously
      await Promise.all([
        page.click(`[data-testid="ocr-${fileId}"]`),
        page.click(`[data-testid="approve-${fileId}"]`),
      ]);

      // Verify UI remains responsive
      await expect(page.locator('[data-testid="search-input"]')).toBeEnabled();
      await expect(page.locator('[data-testid="upload-button"]')).toBeEnabled();
    });
  });

  test.describe("Accessibility and Usability", () => {
    test("should be keyboard navigable", async ({ page }) => {
      // Navigate using keyboard
      await page.keyboard.press("Tab"); // Focus on first interactive element
      await page.keyboard.press("Tab"); // Move to next element

      // Verify focus indicators
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Check for ARIA labels on key elements
      await expect(page.locator('[data-testid="upload-button"]')).toHaveAttribute("aria-label");
      await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute("aria-label");
      await expect(page.locator('[data-testid="document-list"]')).toHaveAttribute("role", "list");
    });

    test("should support screen readers", async ({ page }) => {
      // Verify screen reader announcements
      const uploadButton = page.locator('[data-testid="upload-button"]');
      await expect(uploadButton).toHaveAttribute("aria-describedby");

      const searchInput = page.locator('[data-testid="search-input"]');
      await expect(searchInput).toHaveAttribute("aria-label", /search/i);
    });

    test("should work on mobile viewports", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify mobile-friendly layout
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-list"]')).toHaveCSS(
        "flex-direction",
        "column",
      );
    });
  });
});
