// @ts-nocheck
// Monitoring Facade - Unified interface for monitoring components
export type HealthSnapshot = { ok: boolean; details?: Record<string, unknown> };

export type TraceStats = {
  totalTraces: number;
  activeSpans: number;
  tracesByStatus: Record<string, number>;
  tracesByService: Record<string, number>;
  averageDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorRate: number;
};

export type LogStats = {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
  logsByTenant: Record<string, number>;
  errorRate: number;
  averageLogSize: number;
};

export interface MonitoringSnapshot {
  health: HealthSnapshot;
  traces: TraceStats;
  logs: LogStats;
}

export interface MonitoringFacade {
  snapshot(): Promise<MonitoringSnapshot>;
}

import { TracingManager } from "./tracing";
import { Logger } from "./logger";

export class DefaultMonitoringFacade implements MonitoringFacade {
  constructor(
    private tracing: TracingManager,
    private logger: Logger
  ) {}

  async snapshot(): Promise<MonitoringSnapshot> {
    const traces = this.tracing.getTraceStats(); // existing method
    const logs = this.logger.getLogStats();      // existing method
    const health: HealthSnapshot = {
      ok: traces.errorRate === 0 && logs.errorRate === 0,
      details: { traceErrorRate: traces.errorRate, logErrorRate: logs.errorRate }
    };
    return { health, traces, logs };
  }
}
