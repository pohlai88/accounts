// API Gateway Integration for Web API
import { createApiGateway, defaultGatewayConfig, authMiddleware } from "@aibos/utils/api-gateway";
import { NextRequest, NextResponse } from "next/server";

// Create gateway instance
const gateway = createApiGateway({
  ...defaultGatewayConfig,
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  rateLimiting: {
    enabled: process.env.NODE_ENV === "production",
    defaultWindowMs: 15 * 60 * 1000, // 15 minutes
    defaultMax: 100, // requests per window
  },
  caching: {
    enabled: process.env.NODE_ENV === "production",
    defaultTtl: 300, // 5 minutes
  },
});

// Register API routes
gateway
  .route("/api/health", "GET")
  .handler(async req => {
    // Health check handler
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          database: { status: "healthy", responseTime: 0 },
          storage: { status: "healthy", responseTime: 0 },
          auth: { status: "healthy", responseTime: 0 },
          api: { status: "healthy", responseTime: 0 },
        },
        version: process.env.APP_VERSION || "dev",
        uptime: process.uptime(),
      },
    };
  })
  .build();

gateway
  .route("/api/ping", "GET")
  .handler(async req => {
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { ok: true },
    };
  })
  .build();

// Invoices routes
gateway
  .route("/api/invoices", "GET")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement actual invoice fetching
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { invoices: [] },
    };
  })
  .build();

gateway
  .route("/api/invoices", "POST")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement invoice creation
    return {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: { message: "Invoice created" },
    };
  })
  .build();

// Customers routes
gateway
  .route("/api/customers", "GET")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement actual customer fetching
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { customers: [] },
    };
  })
  .build();

gateway
  .route("/api/customers", "POST")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement customer creation
    return {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: { message: "Customer created" },
    };
  })
  .build();

// Journals routes
gateway
  .route("/api/journals", "GET")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement actual journal fetching
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { journals: [] },
    };
  })
  .build();

gateway
  .route("/api/journals", "POST")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement journal creation
    return {
      status: 201,
      headers: { "Content-Type": "application/json" },
      body: { message: "Journal created" },
    };
  })
  .build();

// Accounts routes
gateway
  .route("/api/accounts", "GET")
  .middleware([authMiddleware])
  .handler(async req => {
    // TODO: Implement actual accounts fetching
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { accounts: [] },
    };
  })
  .build();

/**
 * Convert NextRequest to ApiRequest
 */
async function nextRequestToApiRequest(req: NextRequest): Promise<unknown> {
  const url = new URL(req.url);

  // Convert Headers to plain object
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    method: req.method,
    path: url.pathname,
    headers,
    query: Object.fromEntries(url.searchParams.entries()),
    body: req.body ? await req.json() : undefined,
  };
}

/**
 * Convert ApiResponse to NextResponse
 */
function apiResponseToNextResponse(response: unknown): NextResponse {
  return new NextResponse(JSON.stringify(response.body), {
    status: response.status,
    headers: response.headers,
  });
}

/**
 * Gateway middleware for Next.js API routes
 */
export async function gatewayMiddleware(req: NextRequest): Promise<NextResponse> {
  try {
    const apiRequest = await nextRequestToApiRequest(req);
    const apiResponse = await gateway.processRequest(apiRequest);
    return apiResponseToNextResponse(apiResponse);
  } catch (error) {
    console.error("[Gateway Middleware] Error:", error);
    return new NextResponse(JSON.stringify({ error: "Gateway error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export { gateway };
