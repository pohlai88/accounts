import { z, ZodTypeAny } from "zod";

/**
 * Database Adapter Interface - Unified database access layer
 */
export interface DbAdapter {
    /** Low-level raw query if you have RPC/SQL (optional) */
    queryRaw<T = unknown>(sql: string, params?: unknown[]): Promise<T>;

    /** High-level select (table + select) for PostgREST style */
    select<T = unknown>(opts: {
        table: string;
        columns?: string;
        eq?: Record<string, string | number>;
        limit?: number;
        offset?: number;
        orderBy?: { column: string; ascending?: boolean };
    }): Promise<T[]>;

    /** Insert a single record */
    insert<T = unknown>(opts: {
        table: string;
        data: Record<string, unknown>;
    }): Promise<T>;

    /** Update records */
    update<T = unknown>(opts: {
        table: string;
        data: Record<string, unknown>;
        eq?: Record<string, string | number>;
    }): Promise<T[]>;

    /** Delete records */
    delete(opts: {
        table: string;
        eq?: Record<string, string | number>;
    }): Promise<void>;
}

/**
 * Helper to parse arrays with a schema
 * @param run - Function that returns unknown array
 * @param schema - Zod schema to parse each item
 * @returns Parsed array of typed items
 */
export async function queryTyped<T extends ZodTypeAny>(
    run: () => Promise<unknown[]>,
    schema: T
): Promise<z.infer<T>[]> {
    const rows = await run();
    return z.array(schema).parse(rows);
}

/**
 * Helper to parse single item with a schema
 * @param run - Function that returns unknown item
 * @param schema - Zod schema to parse the item
 * @returns Parsed typed item
 */
export async function queryTypedSingle<T extends ZodTypeAny>(
    run: () => Promise<unknown>,
    schema: T
): Promise<z.infer<T>> {
    const row = await run();
    return schema.parse(row);
}
