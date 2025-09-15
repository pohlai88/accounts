import { sql, and, or, asc, desc, type SQL, type AnyColumn, getTableName } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export interface QueryOptimizerConfig {
  enableQueryLogging: boolean;
  /** milliseconds */
  maxQueryTime: number;
  enableQueryCaching: boolean;
  /** seconds */
  cacheTTL: number;
}

/** Minimal “executable” Drizzle style type that remains compatible with await. */
type Executable<T> = Promise<T[]> & {
  orderBy?: (...order: SQL[]) => Executable<T>;
  limit?: (count: number) => Executable<T>;
  offset?: (count: number) => Executable<T>;
  groupBy?: (...groups: (SQL | AnyColumn)[]) => Executable<T>;
};

type Whereable<T> = {
  where: (condition: SQL) => Executable<T>;
};

type Selectable<T> = {
  from: (table: PgTable) => Whereable<T>;
};

export type DrizzleLikeDb = {
  select: (selection?: unknown) => Selectable<unknown>;
};

/** Narrow runtime guard for tables that have a tenantId column. */
function hasTenantId(table: unknown): table is { tenantId: AnyColumn } {
  return (
    typeof table === "object" && table !== null && "tenantId" in (table as Record<string, unknown>)
  );
}

/** Safely fetch a column object from a table by name. */
function getColumn(table: unknown, name: string): AnyColumn {
  return (table as Record<string, unknown>)[name] as AnyColumn;
}

/** Tiny non-crypto hash (djb2) to build stable IDs without Node.js Buffer/crypto. */
function shortHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  // unsigned + base36 -> short & URL-safe
  return (h >>> 0).toString(36);
}

export class QueryOptimizer {
  private readonly config: QueryOptimizerConfig;

  private readonly queryCache = new Map<string, { result: unknown; timestamp: number }>();

  constructor(config: Partial<QueryOptimizerConfig> = {}) {
    this.config = {
      enableQueryLogging: false,
      maxQueryTime: 5000,
      enableQueryCaching: true,
      cacheTTL: 300,
      ...config,
    };
  }

  /** Optimize tenant-scoped queries with optional cache + logging. */
  async optimizeTenantQuery<T>(
    db: DrizzleLikeDb,
    table: PgTable,
    tenantId: string,
    conditions: SQL[] = [],
    options: {
      select?: unknown;
      orderBy?: SQL;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<T[]> {
    const start = Date.now();
    const queryId = this.generateQueryId(table, tenantId, conditions, options);

    try {
      if (this.config.enableQueryCaching) {
        const cached = this.getCachedQuery<T[]>(queryId);
        if (cached) {
          this.logQuery(queryId, "CACHE_HIT", Date.now() - start);
          return cached;
        }
      }

      const whereParts: SQL[] = [];

      if (hasTenantId(table)) {
        // Use SQL template to avoid column type headaches
        whereParts.push(sql`${table.tenantId} = ${tenantId}`);
      }
      if (conditions.length > 0) { whereParts.push(...conditions); }

      const whereExpr = whereParts.length > 0 ? (and(...whereParts) as SQL) : sql`1=1`;

      // Build the query (keep types flexible/awaitable)
      let q = db
        .select(options.select ?? table)
        .from(table)
        .where(whereExpr) as Executable<T>;

      // OrderBy: avoid passing SQL | undefined by narrowing at the callsite
      if (typeof q.orderBy === "function" && options.orderBy !== undefined) {
        const call = q.orderBy as (...o: SQL[]) => Executable<T>;
        q = call(options.orderBy as SQL);
      }
      if (typeof options.limit === "number" && typeof q.limit === "function") {
        const call = q.limit as (n: number) => Executable<T>;
        q = call(options.limit);
      }
      if (typeof options.offset === "number" && typeof q.offset === "function") {
        const call = q.offset as (n: number) => Executable<T>;
        q = call(options.offset);
      }

      const result = (await q) as T[];
      const took = Date.now() - start;

      this.logQuery(queryId, "SUCCESS", took);

      if (this.config.enableQueryCaching) {
        this.setCachedQuery(queryId, result);
      }
      if (took > this.config.maxQueryTime) {
        console.warn(`Slow query: ${queryId} took ${took}ms`);
      }

      return result;
    } catch (err) {
      const took = Date.now() - start;
      this.logQuery(queryId, "ERROR", took, err);
      throw err;
    }
  }

  /** Optimize a batch of tenant queries in parallel. */
  async optimizeBatchQueries<T>(
    db: DrizzleLikeDb,
    queries: Array<{
      table: PgTable;
      tenantId: string;
      conditions: SQL[];
      options?: {
        select?: unknown;
        orderBy?: SQL;
        limit?: number;
        offset?: number;
      };
    }>,
  ): Promise<T[][]> {
    const start = Date.now();
    const queryId = `BATCH_${queries.length}_QUERIES`;

    try {
      const tasks = queries.map(q =>
        this.optimizeTenantQuery<T>(db, q.table, q.tenantId, q.conditions, q.options ?? {}),
      );
      const results = await Promise.all(tasks);
      this.logQuery(queryId, "BATCH_SUCCESS", Date.now() - start);
      return results;
    } catch (err) {
      this.logQuery(queryId, "BATCH_ERROR", Date.now() - start, err);
      throw err;
    }
  }

  /** Aggregation with optional groupBy. */
  async optimizeAggregationQuery(
    db: DrizzleLikeDb,
    table: PgTable,
    tenantId: string,
    aggregations: Record<string, SQL>,
    conditions: SQL[] = [],
    groupBy?: SQL | AnyColumn,
  ): Promise<unknown[]> {
    const start = Date.now();
    const queryId = `AGGREGATION_${Object.keys(aggregations).sort().join("_")}`;

    try {
      const whereParts: SQL[] = [];
      if (hasTenantId(table)) {
        whereParts.push(sql`${table.tenantId} = ${tenantId}`);
      }
      if (conditions.length > 0) { whereParts.push(...conditions); }
      const whereExpr = whereParts.length > 0 ? (and(...whereParts) as SQL) : sql`1=1`;

      let q = db.select(aggregations).from(table).where(whereExpr) as Executable<unknown>;

      if (typeof q.groupBy === "function" && groupBy !== undefined) {
        const call = q.groupBy as (...g: (SQL | AnyColumn)[]) => Executable<unknown>;
        q = call(groupBy);
      }

      const result = await q;
      this.logQuery(queryId, "AGGREGATION_SUCCESS", Date.now() - start);
      return result;
    } catch (err) {
      this.logQuery(queryId, "AGGREGATION_ERROR", Date.now() - start, err);
      throw err;
    }
  }

  /** Simple full-text-style ILIKE search across columns with relevance order. */
  async optimizeSearchQuery<T>(
    db: DrizzleLikeDb,
    table: PgTable,
    tenantId: string,
    searchTerm: string,
    searchColumns: string[],
    conditions: SQL[] = [],
    options: { select?: unknown; limit?: number } = {},
  ): Promise<T[]> {
    const start = Date.now();
    const queryId = `SEARCH_${searchColumns.join("_")}`;

    try {
      const likeConds = searchColumns.map(
        col => sql`${getColumn(table, col)} ILIKE ${`%${searchTerm}%`}`,
      );

      const whereParts: SQL[] = [];
      if (hasTenantId(table)) {
        whereParts.push(sql`${getColumn(table, "tenantId")} = ${tenantId}`);
      }
      if (likeConds.length > 0) { whereParts.push(or(...likeConds) as SQL); }
      if (conditions.length > 0) { whereParts.push(...conditions); }
      const whereExpr = whereParts.length > 0 ? (and(...whereParts) as SQL) : sql`1=1`;

      let q = db
        .select(options.select ?? table)
        .from(table)
        .where(whereExpr) as Executable<T>;

      // crude relevance = sum of CASE matches
      if (typeof q.orderBy === "function" && searchColumns.length > 0) {
        const cases = searchColumns.map(
          col =>
            sql`CASE WHEN ${getColumn(table, col)} ILIKE ${`%${searchTerm}%`} THEN 1 ELSE 0 END`,
        );
        const relevance = sql`(${sql.join(cases, sql` + `)})`;
        const call = q.orderBy as (...o: SQL[]) => Executable<T>;
        // ensure we pass a definite SQL (no union)
        const orderExpr = desc(relevance) as SQL;
        q = call(orderExpr);
      }

      if (typeof options.limit === "number" && typeof q.limit === "function") {
        const call = q.limit as (n: number) => Executable<T>;
        q = call(options.limit);
      }

      const result = (await q) as T[];
      this.logQuery(queryId, "SEARCH_SUCCESS", Date.now() - start);
      return result;
    } catch (err) {
      this.logQuery(queryId, "SEARCH_ERROR", Date.now() - start, err);
      throw err;
    }
  }

  /** ------------ internals: cache + logging + ids ------------ */

  private generateQueryId(
    table: PgTable,
    tenantId: string,
    conditions: unknown[],
    options: unknown,
  ): string {
    const tableName = getTableName(table) ?? "unknown";
    const payload = JSON.stringify({
      tableName,
      tenantId,
      conditions,
      options,
    });
    return `${tableName}_${tenantId}_${shortHash(payload)}`;
  }

  private getCachedQuery<T>(id: string): T | null {
    const entry = this.queryCache.get(id);
    if (!entry) { return null; }
    const ageMs = Date.now() - entry.timestamp;
    const maxMs = this.config.cacheTTL * 1000;
    if (ageMs > maxMs) {
      this.queryCache.delete(id);
      return null;
    }
    return entry.result as T;
  }

  private setCachedQuery(id: string, result: unknown): void {
    this.queryCache.set(id, { result, timestamp: Date.now() });
  }

  private logQuery(
    id: string,
    status:
      | "SUCCESS"
      | "ERROR"
      | "CACHE_HIT"
      | "BATCH_SUCCESS"
      | "BATCH_ERROR"
      | "AGGREGATION_SUCCESS"
      | "AGGREGATION_ERROR"
      | "SEARCH_SUCCESS"
      | "SEARCH_ERROR",
    ms: number,
    error?: unknown,
  ): void {
    if (!this.config.enableQueryLogging) { return; }
    const payload = {
      id,
      status,
      ms,
      at: new Date().toISOString(),
      ...(error ? { error: (error as { message?: string }).message ?? "unknown" } : {}),
    };
    // keep console usage localized & opt-in via enableQueryLogging
    if (status.includes("ERROR")) { console.error("Query", payload); }
    else if (ms > 1000) { console.warn("Query", payload); }
    else { console.log("Query", payload); }
  }

  clearCache(): void {
    this.queryCache.clear();
  }

  getCacheStats(): { size: number; maxAge: number; enabled: boolean } {
    return {
      size: this.queryCache.size,
      maxAge: this.config.cacheTTL,
      enabled: this.config.enableQueryCaching,
    };
  }
}

/** Small helpers for pagination/sorting/filter building. */
export const QueryUtils = {
  /** page starts at 1; clamps to sensible values */
  createPagination(page: number, limit: number): { limit: number; offset: number } {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const p = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    return { limit: safeLimit, offset: (p - 1) * safeLimit };
  },

  createSorting(by: SQL | AnyColumn, order: "asc" | "desc" = "asc"): SQL {
    return order === "asc" ? asc(by) : desc(by);
  },

  /**
   * Build equality filters from a columns map and values.
   * Example:
   *   createFilters({ code: table.code, name: table.name }, { code: "1000" })
   */
  createFilters<TCols extends Record<string, SQL | AnyColumn>>(
    columns: TCols,
    filters: Partial<Record<keyof TCols, unknown>>,
  ): SQL[] {
    const out: SQL[] = [];
    for (const key of Object.keys(filters) as Array<keyof TCols>) {
      const val = filters[key];
      if (val !== undefined && val !== null) {
        out.push(sql`${(columns as Record<string, unknown>)[key as string] as AnyColumn} = ${val}`);
      }
    }
    return out;
  },
};
