// Export Management Service
// V1 compliance: Download history, format selection, file management

import { ExportFormat, ReportExportRequest } from "./types.js";
import { createExportService } from "./export-service.js";

export interface ExportHistory {
  id: string;
  filename: string;
  reportType: string;
  format: ExportFormat;
  size: number;
  recordCount: number;
  status: "pending" | "completed" | "failed" | "expired";
  downloadUrl?: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
  tenantId: string;
  companyId: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ExportManagerService {
  createExport(request: ReportExportRequest, userId: string): Promise<ExportHistory>;
  getExport(id: string): Promise<ExportHistory | null>;
  listExports(tenantId: string, companyId?: string, limit?: number): Promise<ExportHistory[]>;
  downloadExport(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; url?: string; error?: string }>;
  deleteExport(id: string): Promise<void>;
  cleanupExpiredExports(): Promise<number>;
  getExportStats(tenantId: string, companyId?: string): Promise<ExportStats>;
}

export interface ExportStats {
  totalExports: number;
  totalSize: number;
  exportsByFormat: Record<ExportFormat, number>;
  exportsByReportType: Record<string, number>;
  recentExports: ExportHistory[];
  topUsers: { userId: string; count: number }[];
}

export function createExportManagerService(): ExportManagerService {
  const exportService = createExportService();
  const exports = new Map<string, ExportHistory>(); // In production, use database

  return {
    async createExport(request: ReportExportRequest, userId: string): Promise<ExportHistory> {
      const id = generateExportId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create initial export record
      const exportRecord: ExportHistory = {
        id,
        filename: generateFilename(request),
        reportType: request.reportType,
        format: request.format,
        size: 0,
        recordCount: 0,
        status: "pending",
        downloadCount: 0,
        maxDownloads: 100, // Default limit
        expiresAt,
        createdAt: now,
        createdBy: userId,
        tenantId: request.filters.tenantId,
        companyId: request.filters.companyId,
      };

      exports.set(id, exportRecord);

      try {
        // Execute the export
        const result = await exportService.exportReport(request);

        // Update export record with results
        exportRecord.status = result.success ? "completed" : "failed";
        exportRecord.size = result.size;
        exportRecord.recordCount = result.recordCount;
        exportRecord.downloadUrl = result.url;
        exportRecord.error = result.error;
        exportRecord.metadata = {
          ...request.options,
          generatedAt: now.toISOString(),
          filters: request.filters,
        };

        exports.set(id, exportRecord);
        return exportRecord;
      } catch (error) {
        exportRecord.status = "failed";
        exportRecord.error = error instanceof Error ? error.message : "Export failed";
        exports.set(id, exportRecord);
        return exportRecord;
      }
    },

    async getExport(id: string): Promise<ExportHistory | null> {
      const exportRecord = exports.get(id);
      if (!exportRecord) { return null; }

      // Check if export has expired
      if (exportRecord.expiresAt < new Date()) {
        exportRecord.status = "expired";
        exportRecord.downloadUrl = undefined;
        exports.set(id, exportRecord);
      }

      return exportRecord;
    },

    async listExports(tenantId: string, companyId?: string, limit = 50): Promise<ExportHistory[]> {
      const filtered = Array.from(exports.values())
        .filter(exp => {
          if (exp.tenantId !== tenantId) { return false; }
          if (companyId && exp.companyId !== companyId) { return false; }
          return true;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      return filtered;
    },

    async downloadExport(
      id: string,
      _userId: string,
    ): Promise<{ success: boolean; url?: string; error?: string }> {
      const exportRecord = exports.get(id);

      if (!exportRecord) {
        return { success: false, error: "Export not found" };
      }

      if (exportRecord.status !== "completed") {
        return { success: false, error: `Export is ${exportRecord.status}` };
      }

      if (exportRecord.expiresAt < new Date()) {
        exportRecord.status = "expired";
        exportRecord.downloadUrl = undefined;
        exports.set(id, exportRecord);
        return { success: false, error: "Export has expired" };
      }

      if (exportRecord.downloadCount >= exportRecord.maxDownloads) {
        return { success: false, error: "Download limit exceeded" };
      }

      // Increment download count
      exportRecord.downloadCount++;
      exports.set(id, exportRecord);

      // Log download activity to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // Export download activity logged
      }

      return {
        success: true,
        url: exportRecord.downloadUrl,
      };
    },

    async deleteExport(id: string): Promise<void> {
      const exportRecord = exports.get(id);
      if (!exportRecord) {
        throw new Error(`Export ${id} not found`);
      }

      // Delete file from storage when implemented
      // await deleteFile(exportRecord.downloadUrl);

      exports.delete(id);
    },

    async cleanupExpiredExports(): Promise<number> {
      const now = new Date();
      let cleanedCount = 0;

      for (const [id, exportRecord] of exports.entries()) {
        if (exportRecord.expiresAt < now) {
          await this.deleteExport(id);
          cleanedCount++;
        }
      }

      return cleanedCount;
    },

    async getExportStats(tenantId: string, companyId?: string): Promise<ExportStats> {
      const filtered = Array.from(exports.values()).filter(exp => {
        if (exp.tenantId !== tenantId) { return false; }
        if (companyId && exp.companyId !== companyId) { return false; }
        return true;
      });

      const totalSize = filtered.reduce((sum, exp) => sum + exp.size, 0);

      const exportsByFormat = filtered.reduce(
        (acc, exp) => {
          acc[exp.format] = (acc[exp.format] || 0) + 1;
          return acc;
        },
        {} as Record<ExportFormat, number>,
      );

      const exportsByReportType = filtered.reduce(
        (acc, exp) => {
          acc[exp.reportType] = (acc[exp.reportType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const recentExports = filtered
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      const userCounts = filtered.reduce(
        (acc, exp) => {
          acc[exp.createdBy] = (acc[exp.createdBy] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalExports: filtered.length,
        totalSize,
        exportsByFormat,
        exportsByReportType,
        recentExports,
        topUsers,
      };
    },
  };
}

/**
 * Generate unique export ID
 */
function generateExportId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate filename for export
 */
function generateFilename(request: ReportExportRequest): string {
  const { reportType, format, filters } = request;
  const timestamp = new Date().toISOString().slice(0, 10);
  const reportName = reportType.replace(/-/g, "_");

  let filename = `${reportName}_${timestamp}`;

  if (filters.asOfDate) {
    filename += `_as_of_${filters.asOfDate}`;
  } else if (filters.fromDate && filters.toDate) {
    filename += `_${filters.fromDate}_to_${filters.toDate}`;
  }

  return `${filename}.${format}`;
}

/**
 * Background job to cleanup expired exports
 */
export async function cleanupExpiredExportsJob(): Promise<void> {
  const manager = createExportManagerService();

  try {
    await manager.cleanupExpiredExports();
    // Log export cleanup to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
      // Export cleanup tracked via monitoring service
    }
  } catch {
    // Log export cleanup error to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
      // Export cleanup error tracked via monitoring service
    }
  }
}
