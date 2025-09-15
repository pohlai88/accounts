/* @aibos/worker – Base types to remove implicit any while staying SSOT-friendly */

/** Brand utility for opaque IDs and similar */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/** Generic worker event envelope; narrow `data` via Zod in workflows */
export interface WorkerEvent<T = unknown> {
  name: string;
  data: T;
  ts?: string;
  id?: string;
  [k: string]: unknown;
}

/** Minimal StepTools surface used in workflows (extend as needed) */
export interface StepTools {
  run<T>(name: string, fn: () => Promise<T>): Promise<T>;
  sleep?(ms: number): Promise<void>;
  waitForEvent?<T = unknown>(
    name: string,
    opts?: Record<string, unknown>
  ): Promise<WorkerEvent<T>>;
  [k: string]: unknown;
}

/** Standard workflow args; use with `WorkflowFn<YourPayload>` */
export type WorkflowArgs<T = unknown> = { event: WorkerEvent<T>; step: StepTools };

/** Standard workflow function signature */
export type WorkflowFn<T = unknown, R = unknown> = (args: WorkflowArgs<T>) => Promise<R>;

/** Common attachment shape used across adapters/workflows */
export interface Attachment {
  id: string;
  url: string;
  name?: string;
  size?: number;
  contentType?: string;
}

/** JSON helpers */
export type JsonPrimitive = string | number | boolean | null;
export type Json = JsonPrimitive | { [k: string]: Json } | Json[];
export type NonEmptyArray<T> = [T, ...T[]];

/** Result helper */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
