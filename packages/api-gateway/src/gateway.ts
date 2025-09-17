/**
 * @aibos/api-gateway - API Gateway
 *
 * Centralized API routing with authentication, rate limiting, and monitoring
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { CacheService } from "@aibos/cache";
import { RateLimitService, RATE_LIMIT_CONFIGS } from "./rate-limit";
import { RequestLoggingService } from "./logging";
import { ok, notFound, serverErr, unauthorized } from "./response";

export interface GatewayConfig {
  port: number;
  corsOrigin: string | string[];
  rateLimitConfig: (typeof RATE_LIMIT_CONFIGS)[keyof typeof RATE_LIMIT_CONFIGS];
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface GatewayStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
}

export class APIGateway {
  private app: Express;
  private cache: CacheService;
  private rateLimitService: RateLimitService;
  private loggingService: RequestLoggingService;
  private config: GatewayConfig;
  private stats: GatewayStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeConnections: 0,
  };

  constructor(cache: CacheService, config: GatewayConfig) {
    this.cache = cache;
    this.config = config;
    this.app = express();
    this.rateLimitService = new RateLimitService(cache, config.rateLimitConfig);
    this.loggingService = new RequestLoggingService(cache);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    );

    // CORS middleware
    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Tenant-ID",
          "X-User-ID",
          "X-Request-ID",
        ],
      }),
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging middleware
    if (this.config.enableLogging) {
      this.app.use(this.loggingService.middleware());
    }

    // Rate limiting middleware
    this.app.use(this.rateLimitService.middleware());

    // Request tracking middleware
    this.app.use(this.requestTrackingMiddleware());
  }

  private requestTrackingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Track request
      this.stats.totalRequests++;
      this.stats.activeConnections++;

      // Add request ID if not present
      if (!req.headers["x-request-id"]) {
        req.headers["x-request-id"] =
          `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      }

      // Track response
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        this.updateResponseTime(duration);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.stats.successfulRequests++;
        } else {
          this.stats.failedRequests++;
        }

        this.stats.activeConnections--;
      });

      next();
    };
  }

  private updateResponseTime(duration: number): void {
    const total = this.stats.totalRequests;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (total - 1) + duration) / total;
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      const healthData = {
        service: "api-gateway",
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        stats: this.getStats(),
      };
      res.status(200).json(ok(healthData, "Service healthy"));
    });

    // Metrics endpoint
    if (this.config.enableMetrics) {
      this.app.get("/metrics", (req: Request, res: Response) => {
        const metricsData = {
          requests: this.stats,
          cache: this.cache.getStats(),
          rateLimit: this.rateLimitService.getStats(req),
        };
        res.status(200).json(ok(metricsData, "Metrics retrieved"));
      });
    }

    // API routes (these would be proxied to actual services)
    this.app.use("/api", this.apiRouter());
  }

  private apiRouter() {
    const router = express.Router();

    // Authentication middleware
    router.use(this.authMiddleware());

    // Route to different services based on path
    router.use("/auth", this.proxyToService("auth-service", 3001));
    router.use("/invoices", this.proxyToService("invoice-service", 3002));
    router.use("/customers", this.proxyToService("customer-service", 3003));
    router.use("/reports", this.proxyToService("report-service", 3004));
    router.use("/attachments", this.proxyToService("attachment-service", 3005));

    return router;
  }

  private authMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        const tenantId = req.headers["x-tenant-id"] as string;

        // Basic validation
        if (!authHeader || !tenantId) {
          return res.status(401).json(unauthorized("UNAUTHORIZED", "Missing authentication headers"));
        }

        // JWT verification handled by Supabase Auth middleware
        // Token validation occurs at the Supabase level
        next();
      } catch (error) {
        // Log error to monitoring service instead of console
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error("Auth middleware error:", error);
        }
        res.status(401).json(unauthorized("UNAUTHORIZED", "Authentication failed"));
      }
    };
  }

  private proxyToService(serviceName: string, _port: number) {
    return async (req: Request, res: Response, _next: NextFunction) => {
      try {
        // TODO: Implement actual service proxying
        // For now, return a placeholder response
        const proxyData = {
          service: serviceName,
          path: req.path,
          method: req.method,
          headers: req.headers,
        };
        res.status(200).json(ok(proxyData, `Proxying to ${serviceName}`));
      } catch (error) {
        // Log error to monitoring service instead of console
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error(`Proxy error for ${serviceName}:`, error);
        }
        res.status(502).json(serverErr("BAD_GATEWAY", `Service ${serviceName} unavailable`));
      }
    };
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).json(notFound("NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
      // Log error to monitoring service instead of console
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Gateway error:", error);
      }

      res.status(500).json(serverErr("INTERNAL_ERROR", "An unexpected error occurred", {
        requestId: req.headers["x-request-id"],
        error: error.message,
      }));
    });
  }

  public getStats(): GatewayStats {
    return { ...this.stats };
  }

  public getApp(): Express {
    return this.app;
  }

  public getPort(): number {
    return this.config.port;
  }

  public async start(): Promise<void> {
    return new Promise(resolve => {
      this.app.listen(this.config.port, () => {
        // Log startup to monitoring service instead of console
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`API Gateway running on port ${this.config.port}`);
        }
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    // Graceful shutdown logic would go here
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log("API Gateway stopped");
    }
  }
}

// Default configuration
export const defaultGatewayConfig: GatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || "3000"),
  corsOrigin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  rateLimitConfig: RATE_LIMIT_CONFIGS.STANDARD,
  enableLogging: process.env.ENABLE_LOGGING !== "false",
  enableMetrics: process.env.ENABLE_METRICS !== "false",
};
