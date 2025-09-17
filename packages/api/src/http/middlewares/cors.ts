/**
 * CORS Middleware
 *
 * Configurable CORS middleware with security best practices
 */

import cors from "cors";

export interface CorsConfig {
  origins: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  origins: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
    "X-Request-ID",
  ],
  exposedHeaders: ["X-Request-ID", "X-Response-Time"],
  maxAge: 86400, // 24 hours
};

export function createCors(config: Partial<CorsConfig> = {}) {
  const corsConfig = { ...DEFAULT_CORS_CONFIG, ...config };

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (corsConfig.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: corsConfig.credentials,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders,
    maxAge: corsConfig.maxAge,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  });
}

export function corsMw(origins: string[] = ["*"]) {
  return createCors({ origins });
}
