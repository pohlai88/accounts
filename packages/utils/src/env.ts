/**
 * Environment variable validation and type safety
 * Uses Zod for runtime validation of environment variables
 */

import { z } from "zod";

/**
 * Environment schema definition
 * Validates and types environment variables at runtime
 */
export const Env = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(10),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
    DATABASE_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32).optional(),
    API_KEY: z.string().min(10).optional(),
    PORT: z.string().regex(/^\d+$/).transform(Number).default("3000"),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    CORS_ORIGIN: z.string().url().optional(),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default("900000"), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default("100"),
});

export type Env = z.infer<typeof Env>;

/**
 * Validated environment variables
 * Throws error if validation fails
 */
export const env: Env = Env.parse(process.env);

/**
 * Safe environment variable access
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 */
export function getEnv<K extends keyof Env>(key: K, defaultValue?: Env[K]): Env[K] {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value as Env[K];
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if we're in production mode
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Check if we're in test mode
 */
export const isTest = env.NODE_ENV === "test";
