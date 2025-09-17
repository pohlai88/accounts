// @ts-nocheck
import { z } from "zod";
/**
 * Helper to parse arrays with a schema
 * @param run - Function that returns unknown array
 * @param schema - Zod schema to parse each item
 * @returns Parsed array of typed items
 */
export async function queryTyped(run, schema) {
    const rows = await run();
    return z.array(schema).parse(rows);
}
/**
 * Helper to parse single item with a schema
 * @param run - Function that returns unknown item
 * @param schema - Zod schema to parse the item
 * @returns Parsed typed item
 */
export async function queryTypedSingle(run, schema) {
    const row = await run();
    return schema.parse(row);
}
