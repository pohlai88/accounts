/**
 * Test Utilities
 *
 * Common utilities and helpers for testing across the monorepo.
 * Provides consistent testing patterns and mock data.
 */

import { vi } from "vitest";
import { faker } from "@faker-js/faker";

// Mock data generators
export const mockData = {
  // User and tenant data
  user: () => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: faker.helpers.arrayElement(["admin", "user", "viewer"]),
    tenantId: faker.string.uuid(),
    companyId: faker.string.uuid(),
  }),

  // Accounting data
  invoice: () => ({
    id: faker.string.uuid(),
    number: faker.string.alphanumeric(10),
    customerId: faker.string.uuid(),
    amount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    currency: "MYR",
    status: faker.helpers.arrayElement(["draft", "sent", "paid", "overdue"]),
    issueDate: faker.date.recent().toISOString(),
    dueDate: faker.date.future().toISOString(),
  }),

  // Database data
  account: () => ({
    id: faker.string.uuid(),
    code: faker.string.numeric(4),
    name: faker.company.name(),
    accountType: faker.helpers.arrayElement(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    currency: "MYR",
    isActive: true,
    level: faker.number.int({ min: 1, max: 5 }),
  }),

  // API request data
  apiRequest: () => ({
    method: faker.helpers.arrayElement(["GET", "POST", "PUT", "DELETE"]),
    url: faker.internet.url(),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${faker.string.alphanumeric(32)}`,
    },
    body: faker.datatype.json(),
  }),
};

// Mock functions
export const mockFunctions = {
  // Database mocks
  db: {
    insert: vi.fn().mockResolvedValue({ id: faker.string.uuid() }),
    select: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({ id: faker.string.uuid() }),
    delete: vi.fn().mockResolvedValue({ id: faker.string.uuid() }),
  },

  // API mocks
  api: {
    get: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    post: vi.fn().mockResolvedValue({ data: {}, status: 201 }),
    put: vi.fn().mockResolvedValue({ data: {}, status: 200 }),
    delete: vi.fn().mockResolvedValue({ data: {}, status: 204 }),
  },

  // External service mocks
  external: {
    email: vi.fn().mockResolvedValue({ success: true }),
    webhook: vi.fn().mockResolvedValue({ success: true }),
    payment: vi.fn().mockResolvedValue({ success: true }),
  },
};

// Test helpers
export const testHelpers = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create test context
  createTestContext: (overrides = {}) => ({
    user: mockData.user(),
    tenant: { id: faker.string.uuid(), name: faker.company.name() },
    company: { id: faker.string.uuid(), name: faker.company.name() },
    ...overrides,
  }),

  // Mock Supabase client
  createMockSupabase: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockData.user() }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: { user: mockData.user() }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),

  // Assertion helpers
  expectValidUUID: (value: string) => {
    expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  },

  expectValidDate: (value: string) => {
    expect(new Date(value)).toBeInstanceOf(Date);
    expect(new Date(value).getTime()).not.toBeNaN();
  },

  expectValidCurrency: (value: string) => {
    expect(value).toMatch(/^[A-Z]{3}$/);
  },
};

// Cleanup utilities
export const cleanup = {
  // Clear all mocks
  clearAllMocks: () => {
    vi.clearAllMocks();
  },

  // Reset all mocks
  resetAllMocks: () => {
    vi.resetAllMocks();
  },

  // Restore all mocks
  restoreAllMocks: () => {
    vi.restoreAllMocks();
  },
};
