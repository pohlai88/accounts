// @ts-nocheck
// API Gateway Types and Interfaces
export interface ApiRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface RouteConfig {
  path: string;
  method: string;
  handler: (req: ApiRequest) => Promise<GatewayResponse>;
  middleware?: Middleware[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  cache?: {
    ttl: number;
    key?: string;
  };
}

export interface Middleware {
  name: string;
  execute: (req: ApiRequest, next: () => Promise<GatewayResponse>) => Promise<GatewayResponse>;
}

export interface GatewayConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimiting: {
    enabled: boolean;
    defaultWindowMs: number;
    defaultMax: number;
  };
  caching: {
    enabled: boolean;
    defaultTtl: number;
  };
  logging: {
    enabled: boolean;
    level: "debug" | "info" | "warn" | "error";
  };
}

export interface RouteMatch {
  route: RouteConfig;
  params: Record<string, string>;
  query: Record<string, string>;
}
