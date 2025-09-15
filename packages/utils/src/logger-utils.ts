/**
 * Logger utility functions
 * Provides type-safe logging with proper field validation
 */

/**
 * Type guard to check if value is suitable for logger fields
 * @param value - Value to check
 * @returns True if value is a valid log fields object
 */
export function isLogFields(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Safely convert unknown value to log fields
 * @param value - Unknown value to convert
 * @returns Safe log fields object
 */
export function toLogFields(value: unknown): Record<string, unknown> {
    if (isLogFields(value)) {
        return value;
    }

    if (value == null) {
        return {};
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return { value };
    }

    try {
        return { data: JSON.parse(JSON.stringify(value)) };
    } catch {
        return { data: String(value) };
    }
}

/**
 * Safe header value conversion
 * @param value - Unknown value to convert to string
 * @returns String representation suitable for headers
 */
export function headerValue(value: unknown): string {
    if (typeof value === "string") return value;
    if (value == null) return "";

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

/**
 * Safe error conversion for logging
 * @param error - Unknown error value
 * @returns Error object suitable for logging
 */
export function toLogError(error: unknown): Error {
    if (error instanceof Error) return error;
    if (typeof error === "string") return new Error(error);
    if (typeof error === "object" && error !== null && "message" in error) {
        return new Error(String((error as { message: unknown }).message));
    }
    return new Error(JSON.stringify(error));
}
