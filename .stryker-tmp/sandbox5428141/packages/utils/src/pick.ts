/**
 * Pick utility functions
 * Provides safe object property selection for type narrowing
 */
// @ts-nocheck


/**
 * Pick specific properties from an object
 * @param obj - Source object
 * @param keys - Array of keys to pick
 * @returns Object with only the specified keys
 */
export const pick = <T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> =>
    Object.fromEntries(keys.map(k => [k, obj[k]])) as Pick<T, K>;

/**
 * Pick specific properties from an object with type safety
 * @param obj - Source object
 * @param keys - Array of keys to pick
 * @returns Object with only the specified keys
 */
export function pickSafe<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}

/**
 * Omit specific properties from an object
 * @param obj - Source object
 * @param keys - Array of keys to omit
 * @returns Object without the specified keys
 */
export const omit = <T, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> => {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
};
