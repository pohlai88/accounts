// @ts-nocheck
import { EventEmitter } from "events";
import { randomBytes } from "crypto";

export interface TraceConfig {
  enableTracing: boolean;
  sampleRate: number; // 0.0 to 1.0
  maxTracesPerSecond: number;
  retentionPeriod: number; // days
  enableB3Headers: boolean;
  enableW3CTraceContext: boolean;
  enableJaeger: boolean;
  jaegerEndpoint?: string;
  enableZipkin: boolean;
  zipkinEndpoint?: string;
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  kind: "client" | "server" | "producer" | "consumer" | "internal";
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "ok" | "error" | "unset";
  attributes: Record<string, string | number | boolean>;
  events: TraceEvent[];
  links: TraceLink[];
  tenantId?: string;
  userId?: string;
  serviceName: string;
  serviceVersion: string;
  resource: Record<string, string>;
}

export interface TraceEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, string | number | boolean>;
}

export interface TraceLink {
  traceId: string;
  spanId: string;
  attributes: Record<string, string | number | boolean>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  sampled: boolean;
  flags: number;
  baggage: Record<string, string>;
}

export interface TraceData {
  traceId: string;
  spans: TraceSpan[];
  startTime: number;
  endTime: number;
  duration: number;
  serviceName: string;
  tenantId?: string;
  userId?: string;
  status: "ok" | "error" | "partial";
  attributes: Record<string, string | number | boolean>;
}

export class TracingManager extends EventEmitter {
  private config: TraceConfig;
  private activeSpans: Map<string, TraceSpan> = new Map();
  private completedTraces: Map<string, TraceData> = new Map();
  private traceCounter: number = 0;

  constructor(config: Partial<TraceConfig> = {}) {
    super();

    this.config = {
      enableTracing: true,
      sampleRate: 0.1, // 10% sampling by default
      maxTracesPerSecond: 1000,
      retentionPeriod: 7, // 7 days
      enableB3Headers: true,
      enableW3CTraceContext: true,
      enableJaeger: false,
      enableZipkin: false,
      ...config,
    };

    this.startCleanup();
  }

  /**
   * Start a new trace span
   */
  startSpan(
    name: string,
    kind: TraceSpan["kind"] = "internal",
    parentContext?: TraceContext,
    attributes: Record<string, string | number | boolean> = {},
    tenantId?: string,
    userId?: string,
  ): TraceSpan {
    if (!this.config.enableTracing) {
      return this.createDummySpan(name, kind);
    }

    // Check sampling
    if (!this.shouldSample()) {
      return this.createDummySpan(name, kind);
    }

    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const now = Date.now();

    const span: TraceSpan = {
      id: spanId,
      traceId,
      parentId: parentContext?.spanId,
      name,
      kind,
      startTime: now,
      status: "unset",
      attributes: {
        "service.name": this.getServiceName(),
        "service.version": this.getServiceVersion(),
        ...attributes,
      },
      events: [],
      links: [],
      tenantId,
      userId,
      serviceName: this.getServiceName(),
      serviceVersion: this.getServiceVersion(),
      resource: this.getResourceAttributes(),
    };

    this.activeSpans.set(spanId, span);
    this.emit("spanStarted", span);

    return span;
  }

  /**
   * End a trace span
   */
  endSpan(
    spanId: string,
    status: TraceSpan["status"] = "ok",
    attributes: Record<string, string | number | boolean> = {},
    events: TraceEvent[] = [],
  ): TraceSpan | null {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      console.warn(`Span ${spanId} not found`);
      return null;
    }

    const now = Date.now();
    span.endTime = now;
    span.duration = now - span.startTime;
    span.status = status;
    span.attributes = { ...span.attributes, ...attributes };
    span.events = [...span.events, ...events];

    this.activeSpans.delete(spanId);
    this.emit("spanEnded", span);

    // Check if this completes a trace
    this.checkTraceCompletion(span);

    return span;
  }

  /**
   * Add an event to a span
   */
  addSpanEvent(
    spanId: string,
    name: string,
    attributes: Record<string, string | number | boolean> = {},
  ): boolean {
    const span = this.activeSpans.get(spanId);
    if (!span) {return false;}

    const event: TraceEvent = {
      name,
      timestamp: Date.now(),
      attributes,
    };

    span.events.push(event);
    this.emit("spanEvent", { spanId, event });

    return true;
  }

  /**
   * Add attributes to a span
   */
  addSpanAttributes(
    spanId: string,
    attributes: Record<string, string | number | boolean>,
  ): boolean {
    const span = this.activeSpans.get(spanId);
    if (!span) {return false;}

    span.attributes = { ...span.attributes, ...attributes };
    this.emit("spanAttributes", { spanId, attributes });

    return true;
  }

  /**
   * Create a link between spans
   */
  addSpanLink(
    spanId: string,
    traceId: string,
    linkedSpanId: string,
    attributes: Record<string, string | number | boolean> = {},
  ): boolean {
    const span = this.activeSpans.get(spanId);
    if (!span) {return false;}

    const link: TraceLink = {
      traceId,
      spanId: linkedSpanId,
      attributes,
    };

    span.links.push(link);
    this.emit("spanLink", { spanId, link });

    return true;
  }

  /**
   * Extract trace context from headers
   */
  extractTraceContext(headers: Record<string, string>): TraceContext | null {
    // Try W3C Trace Context first
    if (this.config.enableW3CTraceContext) {
      const traceparent = headers["traceparent"];
      if (traceparent) {
        return this.parseW3CTraceContext(traceparent);
      }
    }

    // Try B3 headers
    if (this.config.enableB3Headers) {
      const traceId = headers["x-b3-traceid"];
      const spanId = headers["x-b3-spanid"];
      const parentId = headers["x-b3-parentspanid"];
      const sampled = headers["x-b3-sampled"];

      if (traceId && spanId) {
        return {
          traceId,
          spanId,
          parentId,
          sampled: sampled === "1" || sampled === "true",
          flags: 0,
          baggage: {},
        };
      }
    }

    return null;
  }

  /**
   * Inject trace context into headers
   */
  injectTraceContext(context: TraceContext): Record<string, string> {
    const headers: Record<string, string> = {};

    // W3C Trace Context
    if (this.config.enableW3CTraceContext) {
      const sampled = context.sampled ? "01" : "00";
      headers["traceparent"] = `00-${context.traceId}-${context.spanId}-${sampled}`;
    }

    // B3 headers
    if (this.config.enableB3Headers) {
      headers["x-b3-traceid"] = context.traceId;
      headers["x-b3-spanid"] = context.spanId;
      if (context.parentId) {
        headers["x-b3-parentspanid"] = context.parentId;
      }
      headers["x-b3-sampled"] = context.sampled ? "1" : "0";
    }

    return headers;
  }

  /**
   * Get trace data by trace ID
   */
  getTrace(traceId: string): TraceData | null {
    return this.completedTraces.get(traceId) || null;
  }

  /**
   * Get all traces with filtering
   */
  getTraces(
    filters: {
      tenantId?: string;
      userId?: string;
      serviceName?: string;
      startTime?: number;
      endTime?: number;
      status?: string;
      limit?: number;
    } = {},
  ): TraceData[] {
    let traces = Array.from(this.completedTraces.values());

    if (filters.tenantId) {
      traces = traces.filter(t => t.tenantId === filters.tenantId);
    }

    if (filters.userId) {
      traces = traces.filter(t => t.userId === filters.userId);
    }

    if (filters.serviceName) {
      traces = traces.filter(t => t.serviceName === filters.serviceName);
    }

    if (filters.startTime) {
      traces = traces.filter(t => t.startTime >= filters.startTime!);
    }

    if (filters.endTime) {
      traces = traces.filter(t => t.endTime <= filters.endTime!);
    }

    if (filters.status) {
      traces = traces.filter(t => t.status === filters.status);
    }

    // Sort by start time (newest first)
    traces.sort((a, b) => b.startTime - a.startTime);

    // Apply limit
    if (filters.limit) {
      traces = traces.slice(0, filters.limit);
    }

    return traces;
  }

  /**
   * Get trace statistics
   */
  getTraceStats(): {
    totalTraces: number;
    activeSpans: number;
    tracesByStatus: Record<string, number>;
    tracesByService: Record<string, number>;
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
    errorRate: number;
  } {
    const traces = Array.from(this.completedTraces.values());
    const durations = traces.map(t => t.duration);

    const tracesByStatus: Record<string, number> = {};
    const tracesByService: Record<string, number> = {};

    for (const trace of traces) {
      tracesByStatus[trace.status] = (tracesByStatus[trace.status] || 0) + 1;
      tracesByService[trace.serviceName] = (tracesByService[trace.serviceName] || 0) + 1;
    }

    const errorTraces = traces.filter(t => t.status === "error").length;
    const errorRate = traces.length > 0 ? errorTraces / traces.length : 0;

    return {
      totalTraces: traces.length,
      activeSpans: this.activeSpans.size,
      tracesByStatus,
      tracesByService,
      averageDuration:
        durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      errorRate,
    };
  }

  /**
   * Check if a trace should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Check if a trace is complete
   */
  private checkTraceCompletion(span: TraceSpan): void {
    const traceId = span.traceId;
    const activeSpansForTrace = Array.from(this.activeSpans.values()).filter(
      s => s.traceId === traceId,
    );

    // If no active spans for this trace, it's complete
    if (activeSpansForTrace.length === 0) {
      this.completeTrace(traceId);
    }
  }

  /**
   * Complete a trace
   */
  private completeTrace(traceId: string): void {
    const spans =
      Array.from(this.completedTraces.values()).find(t => t.traceId === traceId)?.spans || [];

    if (spans.length === 0) {return;}

    const startTime = Math.min(...spans.map(s => s.startTime));
    const endTime = Math.max(...spans.map(s => s.endTime || s.startTime));
    const duration = endTime - startTime;

    const errorSpans = spans.filter(s => s.status === "error");
    const status =
      errorSpans.length === 0 ? "ok" : errorSpans.length === spans.length ? "error" : "partial";

    const traceData: TraceData = {
      traceId,
      spans,
      startTime,
      endTime,
      duration,
      serviceName: spans[0]?.serviceName || "unknown",
      tenantId: spans[0]?.tenantId,
      userId: spans[0]?.userId,
      status,
      attributes: this.mergeSpanAttributes(spans),
    };

    this.completedTraces.set(traceId, traceData);
    this.emit("traceCompleted", traceData);
  }

  /**
   * Merge attributes from all spans in a trace
   */
  private mergeSpanAttributes(spans: TraceSpan[]): Record<string, string | number | boolean> {
    const merged: Record<string, string | number | boolean> = {};

    for (const span of spans) {
      Object.assign(merged, span.attributes);
    }

    return merged;
  }

  /**
   * Parse W3C Trace Context header
   */
  private parseW3CTraceContext(traceparent: string): TraceContext | null {
    const parts = traceparent.split("-");
    if (parts.length !== 4) {return null;}

    const [version, traceId, parentId, flags] = parts;
    if (version !== "00") {return null;}

    return {
      traceId: traceId || "",
      spanId: parentId || "", // In W3C, parentId is actually the current span ID
      sampled: flags === "01",
      flags: flags ? parseInt(flags, 16) : 0,
      baggage: {},
    };
  }

  /**
   * Create a dummy span for non-sampled traces
   */
  private createDummySpan(name: string, kind: TraceSpan["kind"]): TraceSpan {
    return {
      id: "dummy",
      traceId: "dummy",
      name,
      kind,
      startTime: Date.now(),
      status: "unset",
      attributes: {},
      events: [],
      links: [],
      serviceName: this.getServiceName(),
      serviceVersion: this.getServiceVersion(),
      resource: {},
    };
  }

  /**
   * Get service name
   */
  private getServiceName(): string {
    return process.env.SERVICE_NAME || "aibos-accounts";
  }

  /**
   * Get service version
   */
  private getServiceVersion(): string {
    return process.env.SERVICE_VERSION || "1.0.0";
  }

  /**
   * Get resource attributes
   */
  private getResourceAttributes(): Record<string, string> {
    return {
      "service.name": this.getServiceName(),
      "service.version": this.getServiceVersion(),
      "deployment.environment": process.env.NODE_ENV || "development",
    };
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return randomBytes(16).toString("hex");
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): string {
    return randomBytes(8).toString("hex");
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {return 0;}

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    setInterval(
      () => {
        const cutoff = Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000;

        // Clean up completed traces
        for (const [traceId, trace] of this.completedTraces) {
          if (trace.startTime < cutoff) {
            this.completedTraces.delete(traceId);
          }
        }
      },
      24 * 60 * 60 * 1000,
    ); // Daily cleanup
  }
}
