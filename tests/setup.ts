// V1 Testing Setup - Global test configuration
import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// Mock environment variables for testing
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test'
}
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:54321/test'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.RESEND_FROM_EMAIL = 'test@aibos.com'
process.env.AXIOM_TOKEN = 'test-axiom-token'
process.env.AXIOM_ORG_ID = 'test-org'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock ResizeObserver (often needed for UI tests)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock crypto for UUID generation in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Mock Date.now for consistent timestamps in tests
const mockNow = new Date('2024-01-01T00:00:00.000Z').getTime()
vi.spyOn(Date, 'now').mockReturnValue(mockNow)

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Global test utilities
export const createMockTenant = () => ({
  id: 'test-tenant-id',
  name: 'Test Tenant',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const createMockCompany = () => ({
  id: 'test-company-id',
  tenant_id: 'test-tenant-id',
  name: 'Test Company',
  currency: 'MYR',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'accountant' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const createMockJournal = () => ({
  id: 'test-journal-id',
  tenant_id: 'test-tenant-id',
  company_id: 'test-company-id',
  journal_number: 'JE-001',
  description: 'Test Journal Entry',
  reference: 'TEST-REF',
  journal_date: new Date().toISOString().split('T')[0],
  currency: 'MYR',
  status: 'draft' as const,
  created_by: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const createMockJournalLine = () => ({
  id: 'test-line-id',
  journal_id: 'test-journal-id',
  account_id: 'test-account-id',
  description: 'Test Line',
  debit: '100.00',
  credit: '0.00',
  line_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
