// V1 E2E Test: Row Level Security (RLS) Verification
import { test, expect } from '@playwright/test'

test.describe('Row Level Security (RLS) Verification', () => {
  
  test.describe('Tenant Isolation', () => {
    test('admin should only see their tenant data', async ({ page }) => {
      // Use admin authentication state
      await page.addInitScript(() => {
        // Set up tenant context in localStorage
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/admin/tenants')
      
      // Should see only one tenant (their own)
      const tenantRows = page.locator('[data-testid="tenant-row"]')
      await expect(tenantRows).toHaveCount(1)
      
      // Verify it's the correct tenant
      await expect(tenantRows.first()).toContainText('E2E Test Tenant')
    })

    test('manager should not access other tenant companies', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/companies')
      
      // Should see only their company
      const companyRows = page.locator('[data-testid="company-row"]')
      await expect(companyRows).toHaveCount(1)
      
      // Verify company name
      await expect(companyRows.first()).toContainText('E2E Test Company')
    })

    test('accountant should only see journals from their tenant', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/journals')
      
      // All journals should belong to the test tenant
      const journalRows = page.locator('[data-testid="journal-row"]')
      const count = await journalRows.count()
      
      if (count > 0) {
        // Check each journal row for tenant isolation
        for (let i = 0; i < count; i++) {
          const row = journalRows.nth(i)
          // Journal numbers should start with expected prefix
          await expect(row.locator('[data-testid="journal-number"]')).toContainText('JE-E2E-')
        }
      }
    })
  })

  test.describe('Role-Based Access Control', () => {
    test('viewer role should not see edit buttons', async ({ page }) => {
      // Use viewer authentication state
      await page.addInitScript(() => {
        localStorage.setItem('user_role', 'viewer')
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/journals')
      
      // Should not see create button
      await expect(page.locator('[data-testid="new-journal-button"]')).not.toBeVisible()
      
      // Should not see edit buttons on existing journals
      const editButtons = page.locator('[data-testid="edit-journal-button"]')
      await expect(editButtons).toHaveCount(0)
    })

    test('clerk role should not be able to post journals', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('user_role', 'clerk')
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/journals')
      
      // Can create journals
      await expect(page.locator('[data-testid="new-journal-button"]')).toBeVisible()
      
      // But cannot post them (SoD enforcement)
      await page.click('[data-testid="new-journal-button"]')
      
      // Fill out a balanced journal
      await page.fill('[data-testid="journal-description"]', 'Clerk Test Journal')
      await page.click('[data-testid="add-line-button"]')
      await page.selectOption('[data-testid="line-0-account"]', 'e2e-account-1001')
      await page.fill('[data-testid="line-0-debit"]', '500.00')
      
      await page.click('[data-testid="add-line-button"]')
      await page.selectOption('[data-testid="line-1-account"]', 'e2e-account-4001')
      await page.fill('[data-testid="line-1-credit"]', '500.00')
      
      // Save as draft should work
      await page.click('[data-testid="save-draft-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // But post button should be disabled or require approval
      const postButton = page.locator('[data-testid="post-journal-button"]')
      await expect(postButton).toBeDisabled()
    })

    test('manager role should be able to approve journals', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('user_role', 'manager')
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/journals/pending-approval')
      
      // Should see journals pending approval
      const pendingJournals = page.locator('[data-testid="pending-journal-row"]')
      const count = await pendingJournals.count()
      
      if (count > 0) {
        // Should see approve buttons
        await expect(page.locator('[data-testid="approve-journal-button"]').first()).toBeVisible()
        await expect(page.locator('[data-testid="reject-journal-button"]').first()).toBeVisible()
      }
    })
  })

  test.describe('Data Isolation Verification', () => {
    test('should not be able to access other tenant data via URL manipulation', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      // Try to access a journal with a different tenant ID in URL
      const fakeJournalId = 'other-tenant-journal-123'
      
      const response = await page.goto(`/journals/${fakeJournalId}`)
      
      // Should get 404 or redirect to unauthorized
      expect(response?.status()).toBe(404)
    })

    test('API calls should enforce RLS', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/journals')
      
      // Intercept API calls to verify RLS headers
      await page.route('/api/journals', async route => {
        const request = route.request()
        const headers = request.headers()
        
        // Should have tenant context in headers
        expect(headers['x-tenant-id']).toBeTruthy()
        expect(headers['x-company-id']).toBeTruthy()
        
        await route.continue()
      })
      
      // Trigger an API call
      await page.reload()
    })
  })

  test.describe('Audit Trail RLS Verification', () => {
    test('should only see audit logs for own tenant', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/audit-logs')
      
      // All audit logs should be for the current tenant
      const auditRows = page.locator('[data-testid="audit-log-row"]')
      const count = await auditRows.count()
      
      if (count > 0) {
        // Check first few audit logs
        for (let i = 0; i < Math.min(count, 3); i++) {
          const row = auditRows.nth(i)
          // Should contain tenant-specific data
          await expect(row).toContainText('E2E Test')
        }
      }
    })

    test('should create audit log when posting journal', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
        localStorage.setItem('user_role', 'manager')
      })

      // Create and post a journal
      await page.goto('/journals')
      await page.click('[data-testid="new-journal-button"]')
      
      const journalDescription = `Audit Test Journal ${Date.now()}`
      await page.fill('[data-testid="journal-description"]', journalDescription)
      
      // Add balanced lines
      await page.click('[data-testid="add-line-button"]')
      await page.selectOption('[data-testid="line-0-account"]', 'e2e-account-1001')
      await page.fill('[data-testid="line-0-debit"]', '750.00')
      
      await page.click('[data-testid="add-line-button"]')
      await page.selectOption('[data-testid="line-1-account"]', 'e2e-account-4001')
      await page.fill('[data-testid="line-1-credit"]', '750.00')
      
      // Post the journal
      await page.click('[data-testid="post-journal-button"]')
      await page.click('[data-testid="confirm-post-button"]')
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Check audit trail
      await page.click('[data-testid="audit-trail-tab"]')
      
      // Should see audit entries for journal creation and posting
      await expect(page.locator('[data-testid="audit-entry"]')).toContainText('Journal posted')
      await expect(page.locator('[data-testid="audit-entry"]')).toContainText(journalDescription)
    })
  })

  test.describe('Cross-Tenant Security', () => {
    test('should not leak data between tenants in search results', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/journals')
      
      // Search for journals
      await page.fill('[data-testid="search-input"]', 'E2E')
      await page.press('[data-testid="search-input"]', 'Enter')
      
      // All results should be from current tenant
      const searchResults = page.locator('[data-testid="search-result"]')
      const count = await searchResults.count()
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const result = searchResults.nth(i)
          // Should only show E2E test data (our tenant)
          await expect(result).toContainText('E2E')
        }
      }
    })

    test('should enforce RLS on chart of accounts', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/chart-of-accounts')
      
      // Should only see accounts for current tenant
      const accountRows = page.locator('[data-testid="account-row"]')
      const count = await accountRows.count()
      
      // Should see the test accounts we created
      expect(count).toBeGreaterThan(0)
      
      // Verify account codes match our test data
      await expect(accountRows.first()).toContainText('1000') // Assets control account
    })
  })

  test.describe('Performance with RLS', () => {
    test('RLS queries should complete within performance thresholds', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      // Measure page load time with RLS
      const startTime = Date.now()
      
      await page.goto('/journals')
      await page.waitForLoadState('networkidle')
      
      const endTime = Date.now()
      const loadTime = endTime - startTime
      
      // Should load within 2 seconds even with RLS
      expect(loadTime).toBeLessThan(2000)
      
      console.log(`Journals page with RLS loaded in ${loadTime}ms`)
    })

    test('large dataset queries should remain performant with RLS', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
        localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
      })

      await page.goto('/audit-logs')
      
      // Load audit logs (potentially large dataset)
      const startTime = Date.now()
      
      await page.waitForSelector('[data-testid="audit-log-table"]')
      await page.waitForLoadState('networkidle')
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      // Should complete within 3 seconds
      expect(queryTime).toBeLessThan(3000)
      
      console.log(`Audit logs with RLS loaded in ${queryTime}ms`)
    })
  })
})

// Helper function to verify RLS is working at database level
test.describe('Database RLS Verification', () => {
  test('direct database queries should enforce RLS', async ({ page }) => {
    // This test would make direct API calls to verify RLS
    await page.addInitScript(() => {
      localStorage.setItem('tenant_id', process.env.TEST_TENANT_ID!)
      localStorage.setItem('company_id', process.env.TEST_COMPANY_ID!)
    })

    await page.goto('/journals')
    
    // Make a direct API call and verify response
    const response = await page.request.get('/api/journals', {
      headers: {
        'x-tenant-id': process.env.TEST_TENANT_ID!,
        'x-company-id': process.env.TEST_COMPANY_ID!
      }
    })
    
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    
    // All journals should belong to the test tenant
    if (data.journals && data.journals.length > 0) {
      for (const journal of data.journals) {
        expect(journal.tenantId).toBe(process.env.TEST_TENANT_ID)
      }
    }
  })
})
