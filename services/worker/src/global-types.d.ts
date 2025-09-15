/* Make WorkflowArgs available globally inside @aibos/worker to avoid noisy imports */
/* Type-only import; TS resolves to .ts during build regardless of NodeNext .js specifier */
import type { WorkflowArgs as _WorkflowArgs } from "./types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type WorkflowArgs<T = unknown> = _WorkflowArgs<T>;
}

export {};
