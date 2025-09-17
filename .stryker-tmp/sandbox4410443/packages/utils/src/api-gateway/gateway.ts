// @ts-nocheck
// API Gateway Core
import { ApiRequest, GatewayResponse, GatewayConfig, RouteConfig, Middleware } from "./types.js";
import { ApiRouter, createRoute, RouteBuilder } from "./router.js";
import {
  corsMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware,
  rateLimitMiddleware,
} from "./middleware.js";

export class ApiGateway {
  private router: ApiRouter;
  private config: GatewayConfig;
  private globalMiddleware: Middleware[] = [];

  constructor(config: GatewayConfig) {
    this.config = config;
    this.router = new ApiRouter();
    this.setupGlobalMiddleware();
  }

  /**
   * Setup global middleware
   */
  private setupGlobalMiddleware(): void {
    this.globalMiddleware = [errorHandlingMiddleware, loggingMiddleware, corsMiddleware];

    if (this.config.rateLimiting.enabled) {
      this.globalMiddleware.push(
        rateLimitMiddleware(
          this.config.rateLimiting.defaultWindowMs,
          this.config.rateLimiting.defaultMax,
        ),
      );
    }
  }

  /**
   * Register a route
   */
  route(path: string, method: string): RouteBuilder {
    return createRoute(this.router).path(path).method(method);
  }

  /**
   * Register multiple routes
   */
  routes(routes: RouteConfig[]): void {
    this.router.addRoutes(routes);
  }

  /**
   * Add global middleware
   */
  use(middleware: Middleware): void {
    this.globalMiddleware.push(middleware);
  }

  /**
   * Process incoming request
   */
  async processRequest(request: ApiRequest): Promise<GatewayResponse> {
    try {
      // Find matching route
      const match = this.router.findRoute(request.method, request.path);
      if (!match) {
        return {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: { error: "Route not found" },
        };
      }

      // Apply global middleware
      let middlewareIndex = 0;

      const next = async (): Promise<GatewayResponse> => {
        if (middlewareIndex < this.globalMiddleware.length) {
          const middleware = this.globalMiddleware[middlewareIndex++];
          if (middleware) {
            return await middleware.execute(request, next);
          }
        }

        // Apply route-specific middleware
        if (match.route.middleware && match.route.middleware.length > 0) {
          let routeMiddlewareIndex = 0;

          const routeNext = async (): Promise<GatewayResponse> => {
            if (routeMiddlewareIndex < match.route.middleware!.length) {
              const middleware = match.route.middleware![routeMiddlewareIndex++];
              if (middleware) {
                return await middleware.execute(request, routeNext);
              }
            }

            // Execute route handler
            return await match.route.handler(request);
          };

          return await routeNext();
        }

        // Execute route handler directly
        return await match.route.handler(request);
      };

      const response = await next();

      // Add default headers
      if (!response.headers["Content-Type"]) {
        response.headers["Content-Type"] = "application/json";
      }

      return response;
    } catch (error) {
      console.error("[API Gateway] Request processing error:", error);

      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RouteConfig[] {
    return this.router.getRoutes();
  }

  /**
   * Get gateway configuration
   */
  getConfig(): GatewayConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<GatewayConfig>): void {
    this.config = { ...this.config, ...updates };
    this.setupGlobalMiddleware();
  }
}

/**
 * Create a new API Gateway instance
 */
export function createApiGateway(config: GatewayConfig): ApiGateway {
  return new ApiGateway(config);
}

/**
 * Default gateway configuration
 */
export const defaultGatewayConfig: GatewayConfig = {
  baseUrl: process.env.API_BASE_URL || "http://localhost:3001",
  timeout: 30000,
  retries: 3,
  rateLimiting: {
    enabled: true,
    defaultWindowMs: 15 * 60 * 1000, // 15 minutes
    defaultMax: 100, // requests per window
  },
  caching: {
    enabled: false,
    defaultTtl: 300, // 5 minutes
  },
  logging: {
    enabled: true,
    level: "info",
  },
};
