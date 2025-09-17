/**
 * Express API Server
 *
 * Production-ready Express server with security, monitoring, and API Gateway integration
 */

import express, { Express, Request, Response, NextFunction } from "express";
import compression from "compression";
import dotenv from "dotenv";
// import { APIGateway, defaultGatewayConfig } from "@aibos/api-gateway";
import Redis from "ioredis";
import { createCors, corsMw } from "./http/middlewares/cors.js";
import { logging } from "./http/middlewares/logging.js";
import {
    wrapErrors,
    notFoundHandler,
    asyncHandler,
    AppError
} from "./http/middlewares/error.js";
import {
    security,
    validateContentType,
    validateRequestSize,
    sanitizeInput
} from "./http/middlewares/security.js";
import {
    ok,
    created,
    notFound,
    internalError
} from "./http/response.js";

// Load environment variables
dotenv.config();

export interface ServerConfig {
    port: number;
    host: string;
    corsOrigins: string[];
    enableCompression: boolean;
    enableLogging: boolean;
    enableSecurity: boolean;
    maxRequestSize: number;
    apiVersion: string;
}

const DEFAULT_SERVER_CONFIG: ServerConfig = {
    port: parseInt(process.env.PORT || "3001"),
    host: process.env.HOST || "0.0.0.0",
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    enableCompression: true,
    enableLogging: true,
    enableSecurity: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    apiVersion: process.env.API_VERSION || "1.0.0",
};

export class ApiServer {
    private app: Express;
    private redis: Redis;
    private config: ServerConfig;

    constructor(config: Partial<ServerConfig> = {}) {
        this.config = { ...DEFAULT_SERVER_CONFIG, ...config };
        this.app = express();

        // Initialize Redis connection
        this.redis = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || "0"),
            lazyConnect: true,
            maxRetriesPerRequest: 3,
        });

        // Redis connection event handlers
        this.redis.on('connect', () => {
            console.log('Redis connected');
        });

        this.redis.on('error', (err) => {
            console.error('Redis error:', err);
        });

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        // Trust proxy for accurate IP addresses (only in production with proper proxy)
        if (process.env.NODE_ENV === "production" && process.env.TRUST_PROXY === "true") {
            this.app.set("trust proxy", true);
        }

        // Compression middleware
        if (this.config.enableCompression) {
            this.app.use(compression());
        }

        // Security middleware
        if (this.config.enableSecurity) {
            const securityMiddlewares = security({
                rateLimitConfig: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100, // limit each IP to 100 requests per windowMs
                    message: "Too many requests from this IP, please try again later",
                    standardHeaders: true,
                    legacyHeaders: false,
                }
            });
            securityMiddlewares.forEach(middleware => this.app.use(middleware));
            this.app.use(validateContentType());
            this.app.use(validateRequestSize(this.config.maxRequestSize));
            this.app.use(sanitizeInput());
        }

        // CORS middleware
        this.app.use(createCors({
            origins: this.config.corsOrigins,
            credentials: true,
        }));

        // Logging middleware
        if (this.config.enableLogging) {
            const loggingMiddlewares = logging();
            if (Array.isArray(loggingMiddlewares)) {
                loggingMiddlewares.forEach(middleware => this.app.use(middleware));
            } else {
                this.app.use(loggingMiddlewares as any);
            }
        } else {
            // Always add request ID middleware even if logging is disabled
            this.app.use((req: Request, res: Response, next: NextFunction) => {
                const reqWithId = req as Request & { requestId: string };
                // Use existing request ID from header if provided, otherwise generate one
                reqWithId.requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
                res.setHeader("X-Request-ID", reqWithId.requestId);
                next();
            });
        }

        // Body parsing middleware
        this.app.use(express.json({
            limit: this.config.maxRequestSize,
            strict: true
        }));
        this.app.use(express.urlencoded({
            extended: true,
            limit: this.config.maxRequestSize
        }));
    }

    private setupRoutes(): void {
        // Health check endpoint
        this.app.get("/health", asyncHandler(async (req: Request, res: Response) => {
            const healthData = {
                service: "api",
                status: "ok",
                timestamp: new Date().toISOString(),
                version: this.config.apiVersion,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: process.env.NODE_ENV || "development",
            };

            res.json(ok(healthData, "Service is healthy", (req as any).requestId));
        }));

        // API health check
        this.app.get("/api/health", asyncHandler(async (req: Request, res: Response) => {
            const healthData = {
                service: "api",
                status: "ok",
                timestamp: new Date().toISOString(),
                version: this.config.apiVersion,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: process.env.NODE_ENV || "development",
            };

            res.json(ok(healthData, "API is healthy", (req as any).requestId));
        }));

        // Test endpoint
        this.app.post("/api/test", asyncHandler(async (req: Request, res: Response) => {
            const testData = {
                ping: "pong",
                received: req.body,
                timestamp: new Date().toISOString(),
                requestId: (req as any).requestId,
            };

            res.json(created(testData, "Test successful", (req as any).requestId));
        }));

        // API routes
        this.app.use("/api", (req: Request, res: Response) => {
            res.json(ok({ message: "API is working", path: req.path }, "API endpoint", (req as any).requestId));
        });

        // Catch-all for unknown routes
        this.app.use("*", notFoundHandler());
    }

    private setupErrorHandling(): void {
        // Global error handler
        this.app.use(wrapErrors());
    }

    public async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const server = this.app.listen(this.config.port, this.config.host, () => {
                    console.log(`🚀 API Server running on ${this.config.host}:${this.config.port}`);
                    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
                    console.log(`🔒 CORS Origins: ${this.config.corsOrigins.join(", ")}`);
                    console.log(`📝 Logging: ${this.config.enableLogging ? "enabled" : "disabled"}`);
                    console.log(`🛡️ Security: ${this.config.enableSecurity ? "enabled" : "disabled"}`);
                    console.log(`🗜️ Compression: ${this.config.enableCompression ? "enabled" : "disabled"}`);
                    resolve();
                });

                server.on("error", (error) => {
                    console.error("Server error:", error);
                    reject(error);
                });

                // Graceful shutdown
                process.on("SIGTERM", () => {
                    console.log("SIGTERM received, shutting down gracefully");
                    server.close(() => {
                        console.log("Server closed");
                        process.exit(0);
                    });
                });

                process.on("SIGINT", () => {
                    console.log("SIGINT received, shutting down gracefully");
                    server.close(() => {
                        console.log("Server closed");
                        process.exit(0);
                    });
                });
            } catch (error) {
                console.error("Failed to start server:", error);
                reject(error);
            }
        });
    }

    public getApp(): Express {
        return this.app;
    }

    // Removed gateway methods for now

    public getRedis(): Redis {
        return this.redis;
    }
}

// Create and export server instance
export const server = new ApiServer();

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    server.start().catch((error) => {
        console.error("Failed to start server:", error);
        process.exit(1);
    });
}
