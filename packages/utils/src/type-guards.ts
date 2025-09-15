/**
 * Type safety utilities and guards
 * Provides safe type conversions and error handling
 */

/**
 * Safely convert unknown to Error
 * @param e - Unknown value to convert
 * @returns Error instance
 */
// toError moved to error-utils.ts to avoid duplication

/**
 * Type guard to check if value is an object
 * @param value - Value to check
 * @returns True if value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is a string
 * @param value - Value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * Type guard to check if value is a number
 * @param value - Value to check
 * @returns True if value is a number
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

/**
 * Safe property access with fallback
 * @param obj - Object to access
 * @param key - Property key
 * @param fallback - Fallback value
 * @returns Property value or fallback
 */
export function safeGetWithFallback<T>(
    obj: unknown,
    key: string,
    fallback: T
): T {
    if (!isObject(obj)) {
        return fallback;
    }

    return (obj as Record<string, unknown>)[key] as T ?? fallback;
}
