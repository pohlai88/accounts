// @ts-nocheck
// V1 Axiom Telemetry Configuration
import { Axiom } from "@axiomhq/js";

// V1 Axiom Client Configuration
export const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
});

// V1 Dataset Configuration
export const AXIOM_DATASETS = {
  app_web_prod: "app_web_prod",
  app_web_staging: "app_web_staging",
  api_prod: "api_prod",
  api_staging: "api_staging",
  jobs_prod: "jobs_prod",
  jobs_staging: "jobs_staging",
} as const;

export type AxiomDataset = keyof typeof AXIOM_DATASETS;

// V1 Event Types for Business Intelligence
export interface AxiomEvent {
  timestamp: string;
  dataset: AxiomDataset;
  env: string;
  region: string;
  service: string;
  tenant_id?: string;
  company_id?: string;
  user_id?: string;
  request_id?: string;
  event_type: string;
  data: Record<string, unknown>;
}

// V1 Performance Metrics
export interface PerformanceMetrics {
  request_duration_ms: number;
  db_query_time_ms?: number;
  db_query_count?: number;
  cache_hit_ratio?: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  response_size_bytes?: number;
}

// V1 Business Events
export interface BusinessEvent {
  event_type:
  | "journal_posted"
  | "invoice_created"
  | "payment_processed"
  | "user_login"
  | "period_closed";
  entity_type: string;
  entity_id: string;
  amount?: string;
  currency?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

// V1 Error Events
export interface ErrorEvent {
  error_type: string;
  error_message: string;
  error_stack?: string;
  request_path?: string;
  request_method?: string;
  user_id?: string;
  tenant_id?: string;
  company_id?: string;
}

// Helper function to send events to Axiom
export async function sendToAxiom(
  dataset: AxiomDataset,
  events: Array<Partial<AxiomEvent>>,
): Promise<void> {
  if (!process.env.AXIOM_TOKEN || !process.env.AXIOM_ORG_ID) {
    console.warn("Axiom credentials not configured, skipping telemetry");
    return;
  }

  try {
    const enrichedEvents = events.map(event => ({
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV ?? "development",
      region: process.env.AIBOS_REGION ?? "my-1",
      service: process.env.SERVICE_NAME ?? "unknown",
      ...event,
      dataset,
    }));

    await axiom.ingest(AXIOM_DATASETS[dataset], enrichedEvents);
  } catch (error) {
    console.error("Failed to send events to Axiom:", error);
    // Don't throw - telemetry failures shouldn't break the application
  }
}

// V1 Convenience functions for common events
export async function logPerformanceEvent(
  dataset: AxiomDataset,
  context: {
    tenant_id?: string;
    company_id?: string;
    user_id?: string;
    request_id?: string;
    request_path?: string;
    request_method?: string;
  },
  metrics: PerformanceMetrics,
): Promise<void> {
  await sendToAxiom(dataset, [
    {
      event_type: "performance_metrics",
      tenant_id: context.tenant_id,
      company_id: context.company_id,
      user_id: context.user_id,
      request_id: context.request_id,
      data: {
        request_path: context.request_path,
        request_method: context.request_method,
        ...metrics,
      },
    },
  ]);
}

export async function logBusinessEvent(
  dataset: AxiomDataset,
  context: {
    tenant_id?: string;
    company_id?: string;
    user_id?: string;
    request_id?: string;
  },
  event: BusinessEvent,
): Promise<void> {
  await sendToAxiom(dataset, [
    {
      event_type: event.event_type,
      tenant_id: context.tenant_id,
      company_id: context.company_id,
      user_id: context.user_id,
      request_id: context.request_id,
      data: {
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        amount: event.amount,
        currency: event.currency,
        status: event.status,
        metadata: event.metadata,
      },
    },
  ]);
}

export async function logErrorEvent(
  dataset: AxiomDataset,
  context: {
    tenant_id?: string;
    company_id?: string;
    user_id?: string;
    request_id?: string;
  },
  error: ErrorEvent,
): Promise<void> {
  await sendToAxiom(dataset, [
    {
      event_type: "error",
      tenant_id: context.tenant_id,
      company_id: context.company_id,
      user_id: context.user_id,
      request_id: context.request_id,
      data: {
        error_type: error.error_type,
        error_message: error.error_message,
        error_stack: error.error_stack,
        request_path: error.request_path,
        request_method: error.request_method,
      },
    },
  ]);
}

// V1 Batch event sender for high-throughput scenarios
export class AxiomBatcher {
  private events: Array<Partial<AxiomEvent>> = [];
  private batchSize: number;
  private flushInterval: number;
  private timer?: NodeJS.Timeout;

  constructor(
    private dataset: AxiomDataset,
    batchSize: number = 100,
    flushInterval: number = 5000, // 5 seconds
  ) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startTimer();
  }

  add(event: Partial<AxiomEvent>): void {
    this.events.push(event);

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.events.length === 0) { return; }

    const eventsToSend = [...this.events];
    this.events = [];

    await sendToAxiom(this.dataset, eventsToSend);
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.flushInterval);
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush().catch(console.error);
  }
}
