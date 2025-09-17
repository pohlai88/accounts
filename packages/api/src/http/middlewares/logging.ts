/**
 * Logging Middleware
 *
 * Request/response logging with structured data and performance metrics
 */

import type { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";

export interface LoggingConfig {
  enabled: boolean;
  level: "debug" | "info" | "warn" | "error";
  format: "combined" | "common" | "dev" | "short" | "tiny" | "custom";
  includeBody: boolean;
  includeHeaders: boolean;
  maxBodySize: number;
}

const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enabled: true,
  level: "info",
  format: "combined",
  includeBody: false,
  includeHeaders: false,
  maxBodySize: 1024, // 1KB
};

export function logging(config: Partial<LoggingConfig> = {}) {
  const loggingConfig = { ...DEFAULT_LOGGING_CONFIG, ...config };

  if (!loggingConfig.enabled) {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  // Add request ID to all requests
  const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
      let requestId = "unknown";

      // Use existing request ID from header if provided
      if (req.headers['x-request-id']) {
        requestId = req.headers['x-request-id'] as string;
      } else if (typeof uuidv4 === "function") {
        try {
          requestId = (uuidv4 as () => string)();
        } catch {
          requestId = "unknown";
        }
      }

      const reqWithId = req as Request & { requestId: string };
      reqWithId.requestId = requestId;
      res.setHeader("X-Request-ID", requestId);
    } catch {
      // Ignore errors
    }
    next();
  };

  // Add response time tracking
  const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
      const start = Date.now();
      res.on("finish", () => {
        const reqWithTime = req as Request & { responseTime: number };
        reqWithTime.responseTime = Date.now() - start;
      });
    } catch {
      // Ignore errors
    }
    next();
  };

  // Configure morgan based on format
  let morganFormat: string;
  switch (loggingConfig.format) {
    case "custom":
      morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
      break;
    case "combined":
    case "common":
    case "dev":
    case "short":
    case "tiny":
      morganFormat = loggingConfig.format;
      break;
    default:
      morganFormat = "combined";
  }

  let morganMiddleware: (req: Request, res: Response, next: NextFunction) => void;
  try {
    if (typeof morgan === "function") {
      try {
        const morganResult = (morgan as (format: string, options?: { skip?: (req: Request) => boolean }) => (req: Request, res: Response, next: NextFunction) => void)(morganFormat, {
          skip: (req: Request) => {
            // Skip logging for health checks in production
            if (process.env.NODE_ENV === "production" && req.path === "/health") {
              return true;
            }
            return false;
          },
        });
        morganMiddleware = morganResult as (req: Request, res: Response, next: NextFunction) => void;
      } catch {
        morganMiddleware = (req: Request, res: Response, next: NextFunction) => next();
      }
    } else {
      morganMiddleware = (req: Request, res: Response, next: NextFunction) => next();
    }
  } catch {
    morganMiddleware = (req: Request, res: Response, next: NextFunction) => next();
  }

  return [requestIdMiddleware, responseTimeMiddleware, morganMiddleware] as const;
}

export function createRequestLogger(config: Partial<LoggingConfig> = {}): ReturnType<typeof logging> {
  return logging(config);
}
