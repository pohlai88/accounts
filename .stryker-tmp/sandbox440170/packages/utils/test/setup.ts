// @ts-nocheck
// Test setup for attachment service tests
// V1 compliance: Comprehensive test environment setup

import { vi, beforeEach, afterEach } from "vitest";
import { config } from "dotenv";

// Load environment variables for testing
config({ path: ".env.test" });

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset console methods to avoid test pollution
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks();
});

// Mock global fetch for API tests
global.fetch = vi.fn();

// Mock crypto for consistent hashing in tests
vi.mock("crypto", () => ({
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue("mock-hash-123"),
  }),
}));

// Mock uuid for consistent IDs in tests
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-123"),
}));

// Mock file system operations
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
}));

// Mock path operations
vi.mock("path", () => ({
  join: vi.fn((...args) => args.join("/")),
  resolve: vi.fn((...args) => args.join("/")),
  dirname: vi.fn(),
  basename: vi.fn(),
  extname: vi.fn(),
}));

// Test utilities
export const createMockFile = (name: string, type: string, content: string = "test content") => {
  return new File([content], name, { type });
};

export const createMockBuffer = (size: number = 1024) => {
  return Buffer.alloc(size, "test");
};

export const createMockFormData = (file: File, metadata: Record<string, unknown> = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(metadata).forEach(([key, value]) => {
    formData.append(key, typeof value === "string" ? value : JSON.stringify(value));
  });
  return formData;
};

export const createMockRequest = (
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    params?: Record<string, string>;
  } = {},
) => {
  const {
    method = "GET",
    url = "https://api.example.com/test",
    headers = {},
    body,
    params = {},
  } = options;

  return {
    method,
    url,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
    formData: vi.fn().mockResolvedValue(body),
    params,
  } as unknown;
};

export const createMockResponse = (data: unknown, status: number = 200) => {
  return {
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers({
      "content-type": "application/json",
    }),
  } as unknown;
};

// Mock Supabase client factory
export const createMockSupabaseClient = (overrides: Record<string, unknown> = {}) => {
  return {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ error: null }),
      download: vi.fn().mockResolvedValue({ data: Buffer.from("test"), error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://storage.example.com/file.pdf" },
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
};

// Test data factories
export const createMockAttachment = (overrides: Record<string, unknown> = {}) => {
  return {
    id: "attachment-123",
    tenant_id: "tenant-123",
    company_id: "company-456",
    uploaded_by: "user-789",
    filename: "test.pdf",
    original_filename: "test.pdf",
    mime_type: "application/pdf",
    file_size: 1024,
    file_hash: "mock-hash-123",
    storage_provider: "supabase",
    storage_path: "tenant-123/company-456/invoice/test.pdf",
    storage_url: "https://storage.example.com/test.pdf",
    category: "invoice",
    tags: ["test", "unit"],
    status: "active",
    is_public: false,
    metadata: { testKey: "testValue" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    ...overrides,
  };
};

export const createMockUploadOptions = (overrides: Record<string, unknown> = {}) => {
  return {
    tenantId: "tenant-123",
    companyId: "company-456",
    userId: "user-789",
    category: "invoice",
    tags: ["test", "unit"],
    isPublic: false,
    metadata: { testKey: "testValue" },
    ...overrides,
  };
};

export const createMockSearchOptions = (overrides: Record<string, unknown> = {}) => {
  return {
    tenantId: "tenant-123",
    companyId: "company-456",
    category: "invoice",
    searchTerm: "test",
    tags: ["urgent"],
    page: 1,
    limit: 10,
    sortBy: "created_at",
    sortOrder: "desc",
    ...overrides,
  };
};

// Error simulation utilities
export const simulateError = (errorType: string, message: string = "Test error") => {
  switch (errorType) {
    case "network":
      return new Error(`Network error: ${message}`);
    case "storage":
      return new Error(`Storage error: ${message}`);
    case "database":
      return new Error(`Database error: ${message}`);
    case "validation":
      return new Error(`Validation error: ${message}`);
    case "permission":
      return new Error(`Permission error: ${message}`);
    default:
      return new Error(message);
  }
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<unknown>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

// Memory testing utilities
export const measureMemoryUsage = () => {
  if (process.memoryUsage) {
    return process.memoryUsage();
  }
  return {
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
  };
};

// Test environment validation
export const validateTestEnvironment = () => {
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
    console.warn("Some tests may be skipped or use mocks");
  }

  return missing.length === 0;
};

// Initialize test environment
validateTestEnvironment();
