// Idempotency Types and Interfaces
export interface IdempotencyConfig {
  ttl: number; // TTL in seconds
  keyPrefix: string;
  storage: "redis" | "memory" | "database";
  retryAfter: number; // seconds to wait before retry
}

export interface IdempotencyKey {
  key: string;
  userId: string;
  tenantId: string;
  operation: string;
  status: "pending" | "completed" | "failed";
  requestHash: string;
  response?: unknown;
  error?: string;
  createdAt: number;
  expiresAt: number;
  retryCount: number;
  maxRetries: number;
}

export interface IdempotencyOperationResult<T = unknown> {
  isNew: boolean;
  key: string;
  status: "pending" | "completed" | "failed";
  response?: T;
  error?: string;
  retryAfter?: number;
}

export interface IdempotencyStorage {
  get(key: string): Promise<IdempotencyKey | null>;
  set(key: string, value: IdempotencyKey): Promise<boolean>;
  update(key: string, updates: Partial<IdempotencyKey>): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  cleanup(): Promise<number>; // returns number of cleaned up keys
}

export interface IdempotencyOptions {
  ttl?: number;
  maxRetries?: number;
  retryAfter?: number;
  operation?: string;
}
