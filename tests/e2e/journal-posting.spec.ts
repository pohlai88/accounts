// V1 E2E Test: Journal Posting Flow with Live Supabase RLS
import { test, expect } from "@playwright/test";

// Use authenticated state for accountant role
test.use({ storageState: "./tests/e2e/auth-state-accountant.json" });

test.describe("Journal Posting Flow with RLS", () => {
  test.beforeEach(async ({ page }) => {
    // Set up tenant context for RLS
    await page.addInitScript(() => {
      localStorage.setItem("tenant_id", process.env.TEST_TENANT_ID!);
      localStorage.setItem("company_id", process.env.TEST_COMPANY_ID!);
      localStorage.setItem("user_role", "accountant");
    });

    // Navigate to journals page
    await page.goto("/journals");
    await expect(page).toHaveTitle(/Journals/);
  });

  test("should create and post a balanced journal entry", async ({ page }) => {
    // V1 Core Flow: Create Journal Entry
    await test.step("Create new journal entry", async () => {
      await page.click('[data-testid="new-journal-button"]');
      await expect(page.locator('[data-testid="journal-form"]')).toBeVisible();

      // Fill journal header
      await page.fill('[data-testid="journal-description"]', "E2E Test Journal Entry");
      await page.fill('[data-testid="journal-reference"]', "E2E-REF-001");
      await page.selectOption('[data-testid="journal-currency"]', "MYR");
    });

    // V1 Core Flow: Add Journal Lines
    await test.step("Add balanced journal lines", async () => {
      // Add first line (Debit)
      await page.click('[data-testid="add-line-button"]');
      await page.selectOption('[data-testid="line-0-account"]', "e2e-account-1001"); // Cash at Bank
      await page.fill('[data-testid="line-0-description"]', "Cash received");
      await page.fill('[data-testid="line-0-debit"]', "1000.00");

      // Add second line (Credit)
      await page.click('[data-testid="add-line-button"]');
      await page.selectOption('[data-testid="line-1-account"]', "e2e-account-4001"); // Sales Revenue
      await page.fill('[data-testid="line-1-description"]', "Sales revenue");
      await page.fill('[data-testid="line-1-credit"]', "1000.00");

      // Verify balance indicator
      await expect(page.locator('[data-testid="balance-indicator"]')).toHaveText("Balanced");
      await expect(page.locator('[data-testid="total-debits"]')).toHaveText("1,000.00");
      await expect(page.locator('[data-testid="total-credits"]')).toHaveText("1,000.00");
    });

    // V1 Core Flow: Save Draft
    await test.step("Save journal as draft", async () => {
      await page.click('[data-testid="save-draft-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        "Journal saved as draft",
      );
      await expect(page.locator('[data-testid="journal-status"]')).toHaveText("Draft");
    });

    // V1 Core Flow: Post Journal (Critical Business Logic)
    await test.step("Post journal entry", async () => {
      await page.click('[data-testid="post-journal-button"]');

      // Confirm posting dialog
      await expect(page.locator('[data-testid="post-confirmation-dialog"]')).toBeVisible();
      await page.click('[data-testid="confirm-post-button"]');

      // Verify posting success
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        "Journal posted successfully",
      );
      await expect(page.locator('[data-testid="journal-status"]')).toHaveText("Posted");

      // Verify immutability - edit buttons should be disabled
      await expect(page.locator('[data-testid="edit-journal-button"]')).toBeDisabled();
      await expect(page.locator('[data-testid="delete-journal-button"]')).toBeDisabled();
    });

    // V1 Requirement: Verify Audit Trail
    await test.step("Verify audit trail created", async () => {
      await page.click('[data-testid="audit-trail-tab"]');
      await expect(page.locator('[data-testid="audit-entry"]').first()).toContainText(
        "Journal posted",
      );
      await expect(page.locator('[data-testid="audit-user"]').first()).toContainText(
        "Test Accountant",
      );
    });
  });

  test("should prevent posting unbalanced journal entry", async ({ page }) => {
    // V1 Business Rule: Balanced Entries Only
    await test.step("Create unbalanced journal entry", async () => {
      await page.click('[data-testid="new-journal-button"]');

      // Fill journal header
      await page.fill('[data-testid="journal-description"]', "Unbalanced Test Entry");

      // Add unbalanced lines
      await page.click('[data-testid="add-line-button"]');
      await page.selectOption('[data-testid="line-0-account"]', "e2e-account-1001");
      await page.fill('[data-testid="line-0-debit"]', "1000.00");

      await page.click('[data-testid="add-line-button"]');
      await page.selectOption('[data-testid="line-1-account"]', "e2e-account-4001");
      await page.fill('[data-testid="line-1-credit"]', "500.00"); // Unbalanced!

      // Verify unbalanced indicator
      await expect(page.locator('[data-testid="balance-indicator"]')).toHaveText("Unbalanced");
      await expect(page.locator('[data-testid="balance-difference"]')).toHaveText("500.00");
    });

    await test.step("Attempt to post unbalanced entry", async () => {
      // Post button should be disabled
      await expect(page.locator('[data-testid="post-journal-button"]')).toBeDisabled();

      // Save as draft should still work
      await page.click('[data-testid="save-draft-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        "Journal saved as draft",
      );

      // But posting should still be disabled
      await expect(page.locator('[data-testid="post-journal-button"]')).toBeDisabled();
    });
  });

  test("should enforce segregation of duties", async ({ page }) => {
    // V1 SoD Requirement: Different user must approve
    await test.step("Create journal as accountant", async () => {
      await page.click('[data-testid="new-journal-button"]');

      // Create balanced journal
      await page.fill('[data-testid="journal-description"]', "SoD Test Entry");
      await page.click('[data-testid="add-line-button"]');
      await page.selectOption('[data-testid="line-0-account"]', "e2e-account-1001");
      await page.fill('[data-testid="line-0-debit"]', "500.00");

      await page.click('[data-testid="add-line-button"]');
      await page.selectOption('[data-testid="line-1-account"]', "e2e-account-4001");
      await page.fill('[data-testid="line-1-credit"]', "500.00");

      await page.click('[data-testid="save-draft-button"]');
    });

    await test.step("Submit for approval", async () => {
      await page.click('[data-testid="submit-for-approval-button"]');
      await expect(page.locator('[data-testid="journal-status"]')).toHaveText("Pending Approval");

      // Posting should be disabled for creator
      await expect(page.locator('[data-testid="post-journal-button"]')).toBeDisabled();
    });

    // Note: In a full E2E test, we would switch users here to test approval flow
    // This would require additional setup for user switching
  });

  test("should handle concurrent editing gracefully", async ({ page, context }) => {
    // V1 Concurrency Test
    const page2 = await context.newPage();

    await test.step("Open same journal in two tabs", async () => {
      // Create a journal first
      await page.click('[data-testid="new-journal-button"]');
      await page.fill('[data-testid="journal-description"]', "Concurrency Test");
      await page.click('[data-testid="save-draft-button"]');

      // Get the journal ID from URL
      const journalId = page.url().split("/").pop();

      // Open same journal in second tab
      await page2.goto(`/journals/${journalId}`);
    });

    await test.step("Attempt concurrent modifications", async () => {
      // Modify in first tab
      await page.fill('[data-testid="journal-description"]', "Modified in Tab 1");

      // Modify in second tab
      await page2.fill('[data-testid="journal-description"]', "Modified in Tab 2");

      // Save in first tab
      await page.click('[data-testid="save-draft-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Attempt to save in second tab - should show conflict
      await page2.click('[data-testid="save-draft-button"]');
      await expect(page2.locator('[data-testid="conflict-warning"]')).toContainText(
        "Journal has been modified",
      );
    });

    await page2.close();
  });

  test("should maintain performance under load", async ({ page }) => {
    // V1 Performance Requirement: < 500ms response time
    await test.step("Create journal with many lines", async () => {
      await page.click('[data-testid="new-journal-button"]');
      await page.fill('[data-testid="journal-description"]', "Performance Test - Many Lines");

      const startTime = Date.now();

      // Add 20 lines (10 debits, 10 credits)
      for (let i = 0; i < 20; i++) {
        await page.click('[data-testid="add-line-button"]');
        await page.selectOption(
          `[data-testid="line-${i}-account"]`,
          i % 2 === 0 ? "e2e-account-1001" : "e2e-account-4001",
        );
        await page.fill(`[data-testid="line-${i}-description"]`, `Line ${i + 1}`);

        if (i % 2 === 0) {
          await page.fill(`[data-testid="line-${i}-debit"]`, "100.00");
        } else {
          await page.fill(`[data-testid="line-${i}-credit"]`, "100.00");
        }
      }

      // Save and measure time
      await page.click('[data-testid="save-draft-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // V1 Performance Requirement: Should complete within 5 seconds for UI operations
      expect(duration).toBeLessThan(5000);
      console.log(`Journal with 20 lines created in ${duration}ms`);
    });
  });
});
