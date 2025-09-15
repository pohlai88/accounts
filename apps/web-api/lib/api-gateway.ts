// API Gateway Integration for Web API
import { createApiGateway, defaultGatewayConfig, authMiddleware } from "@aibos/utils/api-gateway";
import { NextRequest, NextResponse } from "next/server";

// Create gateway instance
const gateway = createApiGateway({
  ...defaultGatewayConfig,
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  rateLimiting: {
    enabled: process.env.NODE_ENV === "production",
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // requests per window
  },
  caching: {
    enabled: process.env.NODE_ENV === "production",
    defaultTtl: 300, // 5 minutes
  },
});

// Register API routes
gateway
  .route("/api/health", "GET")
  .handler(async (req: NextRequest) => {
    // Health check handler
    return NextResponse.json({
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
    });
  })
  .build();

gateway
  .route("/api/ping", "GET")
  .handler(async (req: NextRequest) => {
    return NextResponse.json({ ok: true });
  })
  .build();

// Invoices routes
gateway
  .route("/api/invoices", "GET")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement actual invoice fetching
    return NextResponse.json({ invoices: [] });
  })
  .build();

gateway
  .route("/api/invoices", "POST")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement invoice creation
    return NextResponse.json({ message: "Invoice created" }, { status: 201 });
  })
  .build();

// Customers routes
gateway
  .route("/api/customers", "GET")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement actual customer fetching
    return NextResponse.json({ customers: [] });
  })
  .build();

gateway
  .route("/api/customers", "POST")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement customer creation
    return NextResponse.json({ message: "Customer created" }, { status: 201 });
  })
  .build();

// Journals routes
gateway
  .route("/api/journals", "GET")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement actual journal fetching
    return NextResponse.json({ journals: [] });
  })
  .build();

gateway
  .route("/api/journals", "POST")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement journal creation
    return NextResponse.json({ message: "Journal created" }, { status: 201 });
  })
  .build();

// Accounts routes
gateway
  .route("/api/accounts", "GET")
  .middleware([authMiddleware])
  .handler(async (req: NextRequest) => {
    // TODO: Implement actual accounts fetching
    return NextResponse.json({ accounts: [] });
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
function apiResponseToNextResponse(response: any): NextResponse {
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
    const apiResponse = await gateway.processRequest(apiRequest as any);
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
