// @ts-nocheck
// Export Scheduling Service
// V1 compliance: Automated report generation and scheduling

import { ExportFormat, ReportExportRequest, ExportResult } from "./types.js";
import { createExportService } from "./export-service.js";

export interface ScheduledExport {
  id: string;
  name: string;
  reportType: "trial-balance" | "balance-sheet" | "profit-loss" | "cash-flow";
  format: ExportFormat;
  schedule: ScheduleConfig;
  filters: {
    tenantId: string;
    companyId: string;
    asOfDate?: string;
    fromDate?: string;
    toDate?: string;
    accountIds?: string[];
    includeInactive?: boolean;
  };
  options?: {
    filename?: string;
    includeHeaders?: boolean;
    dateFormat?: string;
    timezone?: string;
  };
  recipients: string[]; // Email addresses
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: string;
}

export interface ScheduleConfig {
  type: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  frequency: number; // e.g., every 2 weeks
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  timezone: string;
  endDate?: Date;
}

export interface ExportScheduleService {
  createSchedule(
    schedule: Omit<ScheduledExport, "id" | "createdAt" | "updatedAt" | "nextRunAt">,
  ): Promise<ScheduledExport>;
  updateSchedule(id: string, updates: Partial<ScheduledExport>): Promise<ScheduledExport>;
  deleteSchedule(id: string): Promise<void>;
  getSchedule(id: string): Promise<ScheduledExport | null>;
  listSchedules(tenantId: string, companyId?: string): Promise<ScheduledExport[]>;
  executeSchedule(id: string): Promise<ExportResult>;
  getNextRunTime(schedule: ScheduleConfig, lastRun?: Date): Date;
  getDueSchedules(): Promise<ScheduledExport[]>;
}

export function createExportScheduleService(): ExportScheduleService {
  const exportService = createExportService();
  const schedules = new Map<string, ScheduledExport>(); // In production, use database

  return {
    async createSchedule(scheduleData): Promise<ScheduledExport> {
      const id = generateId();
      const now = new Date();
      const nextRunAt = getNextRunTime(scheduleData.schedule);

      const schedule: ScheduledExport = {
        ...scheduleData,
        id,
        createdAt: now,
        updatedAt: now,
        nextRunAt,
      };

      schedules.set(id, schedule);
      return schedule;
    },

    async updateSchedule(id: string, updates: Partial<ScheduledExport>): Promise<ScheduledExport> {
      const existing = schedules.get(id);
      if (!existing) {
        throw new Error(`Schedule ${id} not found`);
      }

      const updated: ScheduledExport = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      // Recalculate next run time if schedule changed
      if (updates.schedule) {
        updated.nextRunAt = getNextRunTime(updates.schedule, existing.lastRunAt);
      }

      schedules.set(id, updated);
      return updated;
    },

    async deleteSchedule(id: string): Promise<void> {
      if (!schedules.has(id)) {
        throw new Error(`Schedule ${id} not found`);
      }
      schedules.delete(id);
    },

    async getSchedule(id: string): Promise<ScheduledExport | null> {
      return schedules.get(id) || null;
    },

    async listSchedules(tenantId: string, companyId?: string): Promise<ScheduledExport[]> {
      return Array.from(schedules.values()).filter(schedule => {
        if (schedule.filters.tenantId !== tenantId) { return false; }
        if (companyId && schedule.filters.companyId !== companyId) { return false; }
        return true;
      });
    },

    async executeSchedule(id: string): Promise<ExportResult> {
      const schedule = schedules.get(id);
      if (!schedule) {
        throw new Error(`Schedule ${id} not found`);
      }

      if (!schedule.isActive) {
        throw new Error(`Schedule ${id} is inactive`);
      }

      // Create export request
      const request: ReportExportRequest = {
        reportType: schedule.reportType,
        format: schedule.format,
        filters: schedule.filters,
        options: schedule.options,
      };

      // Execute export
      const result = await exportService.exportReport(request);

      // Update schedule
      const now = new Date();
      schedule.lastRunAt = now;
      schedule.nextRunAt = getNextRunTime(schedule.schedule, now);
      schedule.updatedAt = now;
      schedules.set(id, schedule);

      return result;
    },

    getNextRunTime,

    async getDueSchedules(): Promise<ScheduledExport[]> {
      const now = new Date();
      return Array.from(schedules.values()).filter(
        schedule => schedule.isActive && schedule.nextRunAt && schedule.nextRunAt <= now,
      );
    },
  };
}

/**
 * Calculate next run time based on schedule configuration
 */
function getNextRunTime(schedule: ScheduleConfig, lastRun?: Date): Date {
  const now = lastRun || new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);

  const nextRun = new Date(now);
  nextRun.setHours(hours || 0, minutes || 0, 0, 0);

  // If the time has already passed today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  switch (schedule.type) {
    case "daily":
      // Already set to next day if needed
      break;

    case "weekly": {
      // Move to next occurrence of the specified day of week
      const targetDay = schedule.dayOfWeek || 0;
      const currentDay = nextRun.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      if (daysUntilTarget === 0 && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      }
      break;
    }

    case "monthly": {
      // Move to next occurrence of the specified day of month
      const targetDate = schedule.dayOfMonth || 1;
      nextRun.setDate(targetDate);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(targetDate);
      }
      break;
    }

    case "quarterly": {
      // Move to next quarter
      const currentMonth = nextRun.getMonth();
      const nextQuarterMonth = Math.floor(currentMonth / 3) * 3 + 3;
      nextRun.setMonth(nextQuarterMonth);
      nextRun.setDate(schedule.dayOfMonth || 1);
      if (nextRun <= now) {
        nextRun.setMonth(nextQuarterMonth + 3);
        nextRun.setDate(schedule.dayOfMonth || 1);
      }
      break;
    }

    case "yearly":
      // Move to next year
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      nextRun.setMonth(0); // January
      nextRun.setDate(schedule.dayOfMonth || 1);
      break;

    default:
      throw new Error(`Unsupported schedule type: ${schedule.type}`);
  }

  // Check end date
  if (schedule.endDate && nextRun > schedule.endDate) {
    throw new Error("Schedule has expired");
  }

  return nextRun;
}

/**
 * Generate unique ID for schedules
 */
function generateId(): string {
  return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Background job to process scheduled exports
 */
export async function processScheduledExports(): Promise<void> {
  const scheduleService = createExportScheduleService();

  try {
    const dueSchedules = await scheduleService.getDueSchedules();

    for (const schedule of dueSchedules) {
      try {
        console.log(`Executing scheduled export: ${schedule.name} (${schedule.id})`);
        const result = await scheduleService.executeSchedule(schedule.id);

        if (result.success) {
          console.log(`Export completed: ${result.filename}, ${result.recordCount} records`);

          // TODO: Send email to recipients with export file
          // await sendExportEmail(schedule.recipients, result);
        } else {
          console.error(`Export failed for schedule ${schedule.id}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Error executing schedule ${schedule.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error processing scheduled exports:", error);
  }
}
