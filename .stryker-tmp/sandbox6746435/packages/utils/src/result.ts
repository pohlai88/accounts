/**
 * Result type utilities
 * Provides safe error handling without throwing exceptions
 */
// @ts-nocheck


export type Ok<T> = { ok: true; value: T };
export type Err<E = Error> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Create a successful result
 * @param value - The successful value
 * @returns Ok result
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/**
 * Create an error result
 * @param error - The error value
 * @returns Err result
 */
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/**
 * Check if result is successful
 * @param result - The result to check
 * @returns True if result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok === true;
}

/**
 * Check if result is an error
 * @param result - The result to check
 * @returns True if result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return result.ok === false;
}

/**
 * Get the value from a successful result, or throw if error
 * @param result - The result to unwrap
 * @returns The value if successful
 * @throws The error if failed
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (isOk(result)) {
        return result.value;
    }
    throw result.error;
}

/**
 * Get the value from a successful result, or return default if error
 * @param result - The result to unwrap
 * @param defaultValue - Default value if error
 * @returns The value if successful, or default if error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (isOk(result)) {
        return result.value;
    }
    return defaultValue;
}

/**
 * Map a successful result to a new value
 * @param result - The result to map
 * @param fn - Function to transform the value
 * @returns New result with transformed value
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (isOk(result)) {
        return ok(fn(result.value));
    }
    return result;
}

/**
 * Map an error result to a new error
 * @param result - The result to map
 * @param fn - Function to transform the error
 * @returns New result with transformed error
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (isErr(result)) {
        return err(fn(result.error));
    }
    return result;
}

/**
 * Chain operations on results
 * @param result - The result to chain
 * @param fn - Function that returns a new result
 * @returns New result from the chained operation
 */
export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
    if (isOk(result)) {
        return fn(result.value);
    }
    return result;
}

// toError moved to error-utils.ts to avoid duplication
