/**
 * Error handling utilities
 * Provides safe type conversions and error handling
 */
// @ts-nocheck


/**
 * Type guard to check if value is a boolean
 * @param value - Value to check
 * @returns True if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/**
 * Type guard to check if value is an array
 * @param value - Value to check
 * @returns True if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/**
 * Safe property access with type checking
 * @param obj - Object to access
 * @param key - Property key
 * @returns Property value or undefined
 */
export function safeGet<T = unknown>(obj: unknown, key: string): T | undefined {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return undefined;
    }
    return (obj as Record<string, unknown>)[key] as T;
}

/**
 * Safe property access with default value
 * @param obj - Object to access
 * @param key - Property key
 * @param defaultValue - Default value if property doesn't exist
 * @returns Property value or default
 */
export function safeGetWithDefault<T>(obj: unknown, key: string, defaultValue: T): T {
    const value = safeGet<T>(obj, key);
    return value !== undefined ? value : defaultValue;
}

/**
 * Convert unknown error to Error type
 * @param e - Unknown error value
 * @returns Error instance
 */
export function toError(e: unknown): Error {
    if (e instanceof Error) {
        return e;
    }
    if (typeof e === "string") {
        return new Error(e);
    }
    if (typeof e === "object" && e !== null && "message" in e) {
        return new Error(String((e as { message: unknown }).message));
    }
    return new Error(JSON.stringify(e));
}

/**
 * Type guard to check if value is an error with a code property
 * @param value - Value to check
 * @returns True if value is an error with code
 */
export function isErrorWithCode(value: unknown): value is Error & { code: string } {
    return value instanceof Error && 'code' in value && typeof (value as any).code === 'string';
}

/**
 * Type guard to check if value is an API error
 * @param value - Value to check
 * @returns True if value is an API error
 */
export function isApiError(value: unknown): value is { status: number; message: string; code?: string } {
    return typeof value === 'object' && value !== null &&
        'status' in value && 'message' in value &&
        typeof (value as any).status === 'number' &&
        typeof (value as any).message === 'string';
}

/**
 * Extract error message from unknown error
 * @param error - Unknown error value
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message: unknown }).message);
    }
    return "Unknown error occurred";
}

/**
 * Extract error code from unknown error
 * @param error - Unknown error value
 * @returns Error code string or undefined
 */
export function getErrorCode(error: unknown): string | undefined {
    if (isErrorWithCode(error)) {
        return error.code;
    }
    if (isApiError(error)) {
        return error.code;
    }
    if (typeof error === "object" && error !== null && "code" in error) {
        return String((error as { code: unknown }).code);
    }
    return undefined;
}
