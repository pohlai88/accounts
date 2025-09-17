// @ts-nocheck
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DbAdapter } from "../adapter.js";

/**
 * Supabase Database Adapter - Implements DbAdapter for Supabase
 */
export class SupabaseAdapter implements DbAdapter {
    constructor(private readonly sb: SupabaseClient) { }

    async queryRaw<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
        // If you use Edge Functions / RPC for SQL:
        const { data, error } = await this.sb.rpc("exec_sql", { sql, params });
        if (error) throw error;
        return data as T;
    }

    async select<T = unknown>(opts: {
        table: string;
        columns?: string;
        eq?: Record<string, string | number>;
        limit?: number;
        offset?: number;
        orderBy?: { column: string; ascending?: boolean };
    }): Promise<T[]> {
        let q = this.sb.from(opts.table).select(opts.columns || "*");

        if (opts.eq) {
            for (const [k, v] of Object.entries(opts.eq)) {
                q = q.eq(k, v as any) as any;
            }
        }

        if (opts.orderBy) {
            q = q.order(opts.orderBy.column, { ascending: opts.orderBy.ascending ?? true });
        }

        if (opts.limit) {
            q = q.limit(opts.limit);
        }

        if (opts.offset) {
            q = q.range(opts.offset, opts.offset + (opts.limit || 50) - 1);
        }

        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []) as T[];
    }

    async insert<T = unknown>(opts: {
        table: string;
        data: Record<string, unknown>;
    }): Promise<T> {
        const { data, error } = await this.sb
            .from(opts.table)
            .insert(opts.data)
            .select()
            .single();

        if (error) throw error;
        return data as T;
    }

    async update<T = unknown>(opts: {
        table: string;
        data: Record<string, unknown>;
        eq?: Record<string, string | number>;
    }): Promise<T[]> {
        let q = this.sb.from(opts.table).update(opts.data);

        if (opts.eq) {
            for (const [k, v] of Object.entries(opts.eq)) {
                q = q.eq(k, v as any);
            }
        }

        const { data, error } = await q.select();
        if (error) throw error;
        return (data ?? []) as T[];
    }

    async delete(opts: {
        table: string;
        eq?: Record<string, string | number>;
    }): Promise<void> {
        let q = this.sb.from(opts.table).delete();

        if (opts.eq) {
            for (const [k, v] of Object.entries(opts.eq)) {
                q = q.eq(k, v as any) as any;
            }
        }

        const { error } = await q;
        if (error) throw error;
    }
}
