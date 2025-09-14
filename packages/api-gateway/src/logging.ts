/**
 * @aibos/api-gateway - Request Logging Service
 *
 * Centralized request logging with Redis backend
 */

import { Request, Response, NextFunction } from "express";
import { CacheService } from "@aibos/cache";

export interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  responseStatus: number;
  responseTime: number;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  ip: string;
  userAgent: string;
}

export interface LogStats {
  totalRequests: number;
  averageResponseTime: number;
  statusCodes: Record<number, number>;
  topEndpoints: Array<{ path: string; count: number }>;
  errors: number;
}

export class RequestLoggingService {
  private cache: CacheService;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000; // Keep last 10k logs in memory

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  middleware() {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId =
        (req.headers["x-request-id"] as string) ||
        `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Add request ID to response headers
      res.set("X-Request-ID", requestId);

      // Override res.end to capture response data
      const originalEnd = res.end.bind(res);
      res.end = function (chunk?: any, encoding?: any) {
        const responseTime = Date.now() - startTime;

        // Log the request
        const logEntry: LogEntry = {
          id: requestId,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          query: req.query,
          headers: req.headers as Record<string, string>,
          body: req.method !== "GET" ? req.body : undefined,
          responseStatus: res.statusCode,
          responseTime,
          tenantId: req.headers["x-tenant-id"] as string,
          userId: req.headers["x-user-id"] as string,
          requestId,
          ip: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
        };

        // Store log entry
        self.storeLog(logEntry);

        // Call original end
        return originalEnd(chunk, encoding);
      };

      next();
    };
  }

  private async storeLog(logEntry: LogEntry): Promise<void> {
    try {
      // Store in memory (for quick access)
      this.logs.push(logEntry);

      // Keep only the last maxLogs entries
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Store in Redis for persistence
      const key = `log:${logEntry.id}`;
      await this.cache.set(key, logEntry, {
        namespace: "request-logs",
        ttl: 7 * 24 * 60 * 60, // 7 days
      });

      // Store in daily log collection
      const date = new Date().toISOString().split("T")[0];
      const dailyKey = `logs:daily:${date}`;
      await this.cache.set(dailyKey, logEntry, {
        namespace: "request-logs",
        ttl: 30 * 24 * 60 * 60, // 30 days
      });
    } catch (error) {
      console.error("Log storage error:", error);
    }
  }

  async getLogs(
    filters: {
      tenantId?: string;
      userId?: string;
      method?: string;
      statusCode?: number;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {},
  ): Promise<LogEntry[]> {
    try {
      let filteredLogs = [...this.logs];

      // Apply filters
      if (filters.tenantId) {
        filteredLogs = filteredLogs.filter(log => log.tenantId === filters.tenantId);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.method) {
        filteredLogs = filteredLogs.filter(log => log.method === filters.method);
      }
      if (filters.statusCode) {
        filteredLogs = filteredLogs.filter(log => log.responseStatus === filters.statusCode);
      }
      if (filters.startDate) {
        const startTime = new Date(filters.startDate).getTime();
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp).getTime() >= startTime);
      }
      if (filters.endDate) {
        const endTime = new Date(filters.endDate).getTime();
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp).getTime() <= endTime);
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Apply limit
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }

      return filteredLogs;
    } catch (error) {
      console.error("Get logs error:", error);
      return [];
    }
  }

  async getLogById(id: string): Promise<LogEntry | null> {
    try {
      const key = `log:${id}`;
      return await this.cache.get<LogEntry>(key, {
        namespace: "request-logs",
      });
    } catch (error) {
      console.error("Get log by ID error:", error);
      return null;
    }
  }

  getStats(): LogStats {
    const totalRequests = this.logs.length;
    const averageResponseTime =
      totalRequests > 0
        ? this.logs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests
        : 0;

    const statusCodes: Record<number, number> = {};
    const endpointCounts: Record<string, number> = {};
    let errors = 0;

    this.logs.forEach(log => {
      // Count status codes
      statusCodes[log.responseStatus] = (statusCodes[log.responseStatus] || 0) + 1;

      // Count errors
      if (log.responseStatus >= 400) {
        errors++;
      }

      // Count endpoints
      endpointCounts[log.path] = (endpointCounts[log.path] || 0) + 1;
    });

    // Get top endpoints
    const topEndpoints = Object.entries(endpointCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      statusCodes,
      topEndpoints,
      errors,
    };
  }

  async clearLogs(): Promise<void> {
    try {
      this.logs = [];
      await this.cache.clear("request-logs");
    } catch (error) {
      console.error("Clear logs error:", error);
    }
  }

  async exportLogs(format: "json" | "csv" = "json"): Promise<string> {
    try {
      if (format === "csv") {
        const headers = [
          "id",
          "timestamp",
          "method",
          "path",
          "responseStatus",
          "responseTime",
          "tenantId",
          "userId",
          "ip",
          "userAgent",
        ];

        const csvRows = [headers.join(",")];
        this.logs.forEach(log => {
          const row = headers.map(header => {
            const value = log[header as keyof LogEntry];
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
          });
          csvRows.push(row.join(","));
        });

        return csvRows.join("\n");
      } else {
        return JSON.stringify(this.logs, null, 2);
      }
    } catch (error) {
      console.error("Export logs error:", error);
      return "";
    }
  }
}
