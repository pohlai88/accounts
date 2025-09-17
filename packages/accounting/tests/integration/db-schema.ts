import { Pool } from "pg";

/**
 * Sanitize identifier to prevent SQL injection
 * Only allows letters, numbers, and underscores
 */
function safeIdent(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Test helper to create a throwaway schema per test run
 * Uses direct PostgreSQL connection to bypass PostgREST limitations
 */
export async function withTestSchema<T>(
  fn: (ctx: { schema: string; conn: Pool }) => Promise<T>
): Promise<T> {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error("Missing SUPABASE_DB_URL for integration tests");
  }

  const conn = new Pool({
    connectionString: url,
    max: 1, // Single connection for test isolation
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Generate unique schema name with timestamp and random suffix
  const raw = `test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const schema = safeIdent(raw);

  try {
    // Create isolated test schema
    // Note: Cannot parametrize identifiers; schema is sanitized above
    await conn.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await conn.query(`SET search_path TO ${schema}, public`);

    // Execute test function with schema context
    const result = await fn({ schema, conn });
    return result;
  } finally {
    try {
      // Clean up test schema
      await conn.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    } catch (error) {
      console.warn(`Failed to drop test schema ${schema}:`, error);
    }
    await conn.end();
  }
}

/**
 * Helper to create test tables in the schema
 */
export async function createTestTable(
  conn: Pool,
  schema: string,
  tableName: string,
  columns: string
): Promise<void> {
  const safeTableName = safeIdent(tableName);
  await conn.query(`CREATE TABLE ${schema}.${safeTableName} (${columns})`);
}

/**
 * Helper to insert test data
 */
export async function insertTestData(
  conn: Pool,
  schema: string,
  tableName: string,
  data: Record<string, any>[]
): Promise<void> {
  if (data.length === 0) return;

  const safeTableName = safeIdent(tableName);
  const columns = Object.keys(data[0]);
  const values = data.map(row =>
    `(${columns.map(col => `'${row[col]}'`).join(', ')})`
  ).join(', ');

  await conn.query(
    `INSERT INTO ${schema}.${safeTableName} (${columns.join(', ')}) VALUES ${values}`
  );
}

/**
 * Helper to query test data
 */
export async function queryTestData(
  conn: Pool,
  schema: string,
  tableName: string,
  whereClause?: string
): Promise<any[]> {
  const safeTableName = safeIdent(tableName);
  const query = whereClause
    ? `SELECT * FROM ${schema}.${safeTableName} WHERE ${whereClause}`
    : `SELECT * FROM ${schema}.${safeTableName}`;

  const result = await conn.query(query);
  return result.rows;
}
