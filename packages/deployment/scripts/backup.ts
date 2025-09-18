// Automated Backup Procedures
// DoD: Automated backup procedures
// SSOT: Use existing deployment package
// Tech Stack: Node.js + Supabase backup

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@aibos/logger";
import { monitoring } from "../../../apps/web-api/lib/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BackupConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  backupDirectory: string;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  includeTables: string[];
  excludeTables: string[];
  scheduleEnabled: boolean;
  scheduleCron?: string;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: Date;
  duration: number;
  size: number;
  tables: Array<{
    name: string;
    rowCount: number;
    size: number;
  }>;
  errors: string[];
  warnings: string[];
}

export interface RestoreConfig {
  backupId: string;
  targetEnvironment: "staging" | "production";
  restoreTables: string[];
  skipConflicts: boolean;
  validateData: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  errors: string[];
  warnings: string[];
  duration: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: BackupConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  backupDirectory: "./backups",
  retentionDays: 30,
  compressionEnabled: true,
  encryptionEnabled: false,
  includeTables: [],
  excludeTables: ["audit_events", "monitoring_metrics", "monitoring_traces", "monitoring_logs"],
  scheduleEnabled: false,
};

// ============================================================================
// BACKUP MANAGER
// ============================================================================

export class BackupManager {
  private config: BackupConfig;
  private supabase: any;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceKey);
  }

  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupPath = join(this.config.backupDirectory, backupId);

    const result: BackupResult = {
      success: false,
      backupId,
      timestamp: new Date(),
      duration: 0,
      size: 0,
      tables: [],
      errors: [],
      warnings: [],
    };

    try {
      // Log backup start to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }

      // Create backup directory
      mkdirSync(backupPath, { recursive: true });

      // Get all tables
      const tables = await this.getTablesToBackup();

      // Backup each table
      for (const table of tables) {
        try {
          const tableResult = await this.backupTable(table, backupPath);
          result.tables.push(tableResult);
          // Log table backup success to monitoring service
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
          }
        } catch (error) {
          const errorMsg = `Failed to backup table ${table}: ${error}`;
          result.errors.push(errorMsg);
          // Log table backup error to monitoring service
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            logger.error("Backup error", new Error(errorMsg));
          }
        }
      }

      // Create metadata file
      await this.createMetadataFile(backupPath, result);

      // Compress backup if enabled
      if (this.config.compressionEnabled) {
        await this.compressBackup(backupPath);
      }

      // Encrypt backup if enabled
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        await this.encryptBackup(backupPath);
      }

      // Calculate total size
      result.size = await this.calculateBackupSize(backupPath);

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      // Record backup metrics
      monitoring.recordBusinessMetric(
        "backup.created",
        1,
        "count",
        JSON.stringify({
          backup_id: backupId,
          success: result.success.toString(),
          table_count: result.tables.length.toString(),
          size_bytes: result.size.toString(),
        })
      );

      // Log backup completion to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
      }
      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(`Backup failed: ${error}`);

      logger.error("Backup failed", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async restoreBackup(config: RestoreConfig): Promise<RestoreResult> {
    const startTime = Date.now();
    const backupPath = join(this.config.backupDirectory, config.backupId);

    const result: RestoreResult = {
      success: false,
      restoredTables: [],
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {

      // Verify backup exists
      if (!existsSync(backupPath)) {
        throw new Error(`Backup not found: ${config.backupId}`);
      }

      // Decrypt backup if encrypted
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        await this.decryptBackup(backupPath);
      }

      // Decompress backup if compressed
      if (this.config.compressionEnabled) {
        await this.decompressBackup(backupPath);
      }

      // Read metadata
      const metadata = await this.readMetadataFile(backupPath);

      // Restore tables
      const tablesToRestore = config.restoreTables.length > 0
        ? config.restoreTables
        : metadata.tables.map((t: any) => t.name);

      for (const tableName of tablesToRestore) {
        try {
          await this.restoreTable(tableName, backupPath, config);
          result.restoredTables.push(tableName);
        } catch (error) {
          const errorMsg = `Failed to restore table ${tableName}: ${error}`;
          result.errors.push(errorMsg);
          logger.error("Restore error", new Error(errorMsg));
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      // Record restore metrics
      monitoring.recordBusinessMetric(
        "backup.restored",
        1,
        "count",
        JSON.stringify({
          backup_id: config.backupId,
          success: result.success.toString(),
          table_count: result.restoredTables.length.toString(),
        })
      );

      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(`Restore failed: ${error}`);

      logger.error("Restore failed", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async listBackups(): Promise<Array<{ id: string; timestamp: Date; size: number; tables: number }>> {
    try {
      const backupDir = this.config.backupDirectory;
      if (!existsSync(backupDir)) {
        return [];
      }

      const backups = [];
      const fs = await import("fs/promises");
      const files = await fs.readdir(backupDir);

      for (const file of files) {
        if (file.startsWith("backup_")) {
          const backupPath = join(backupDir, file);
          const metadataPath = join(backupPath, "metadata.json");

          if (existsSync(metadataPath)) {
            const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
            backups.push({
              id: file,
              timestamp: new Date(metadata.timestamp),
              size: metadata.size,
              tables: metadata.tables.length,
            });
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error("Failed to list backups", error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  async cleanupOldBackups(): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      for (const backup of backups) {
        if (backup.timestamp < cutoffDate) {
          await this.deleteBackup(backup.id);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error("Failed to cleanup old backups", error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  private async getTablesToBackup(): Promise<string[]> {
    try {
      const { data: tables, error } = await this.supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .not("table_name", "like", "pg_%")
        .not("table_name", "like", "information_schema%");

      if (error) {
        throw error;
      }

      let tableNames = tables.map((t: any) => t.table_name);

      // Apply include/exclude filters
      if (this.config.includeTables.length > 0) {
        tableNames = tableNames.filter((name: string) => this.config.includeTables.includes(name));
      }

      if (this.config.excludeTables.length > 0) {
        tableNames = tableNames.filter((name: string) => !this.config.excludeTables.includes(name));
      }

      return tableNames;
    } catch (error) {
      logger.error("Failed to get tables", error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  private async backupTable(tableName: string, backupPath: string): Promise<{ name: string; rowCount: number; size: number }> {
    try {
      // Get table data
      const { data, error } = await this.supabase
        .from(tableName)
        .select("*");

      if (error) {
        throw error;
      }

      // Write table data to file
      const tableFile = join(backupPath, `${tableName}.json`);
      writeFileSync(tableFile, JSON.stringify(data, null, 2));

      // Get table schema
      const { data: schema, error: schemaError } = await this.supabase
        .from("information_schema.columns")
        .select("*")
        .eq("table_name", tableName)
        .eq("table_schema", "public");

      if (!schemaError) {
        const schemaFile = join(backupPath, `${tableName}_schema.json`);
        writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
      }

      const fs = await import("fs");
      const stats = fs.statSync(tableFile);

      return {
        name: tableName,
        rowCount: data.length,
        size: stats.size,
      };
    } catch (error) {
      throw new Error(`Failed to backup table ${tableName}: ${error}`);
    }
  }

  private async restoreTable(tableName: string, backupPath: string, config: RestoreConfig): Promise<void> {
    try {
      const tableFile = join(backupPath, `${tableName}.json`);
      const fs = await import("fs");

      if (!fs.existsSync(tableFile)) {
        throw new Error(`Table file not found: ${tableFile}`);
      }

      const data = JSON.parse(fs.readFileSync(tableFile, "utf8"));

      if (data.length === 0) {
        return;
      }

      // Clear existing data if not skipping conflicts
      if (!config.skipConflicts) {
        const { error: deleteError } = await this.supabase
          .from(tableName)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

        if (deleteError) {
          throw deleteError;
        }
      }

      // Insert data in batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        const { error } = await this.supabase
          .from(tableName)
          .insert(batch);

        if (error) {
          throw error;
        }
      }

      // Validate data if requested
      if (config.validateData) {
        const { data: restoredData, error: countError } = await this.supabase
          .from(tableName)
          .select("id", { count: "exact" });

        if (countError) {
          throw countError;
        }

        if (restoredData.length !== data.length) {
          throw new Error(`Data validation failed: expected ${data.length} rows, got ${restoredData.length}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to restore table ${tableName}: ${error}`);
    }
  }

  private async createMetadataFile(backupPath: string, result: BackupResult): Promise<void> {
    const metadata = {
      backupId: result.backupId,
      timestamp: result.timestamp.toISOString(),
      duration: result.duration,
      size: result.size,
      tables: result.tables,
      config: {
        compressionEnabled: this.config.compressionEnabled,
        encryptionEnabled: this.config.encryptionEnabled,
        retentionDays: this.config.retentionDays,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    const metadataFile = join(backupPath, "metadata.json");
    writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  }

  private async readMetadataFile(backupPath: string): Promise<any> {
    const metadataFile = join(backupPath, "metadata.json");
    const fs = await import("fs");

    if (!fs.existsSync(metadataFile)) {
      throw new Error("Metadata file not found");
    }

    return JSON.parse(fs.readFileSync(metadataFile, "utf8"));
  }

  private async compressBackup(backupPath: string): Promise<void> {
    try {
      const tarCommand = `tar -czf ${backupPath}.tar.gz -C ${backupPath} .`;
      execSync(tarCommand);

      // Remove uncompressed directory
      const fs = await import("fs/promises");
      await fs.rm(backupPath, { recursive: true, force: true });

    } catch (error) {
      throw new Error(`Failed to compress backup: ${error}`);
    }
  }

  private async decompressBackup(backupPath: string): Promise<void> {
    try {
      const tarFile = `${backupPath}.tar.gz`;
      const fs = await import("fs");

      if (!fs.existsSync(tarFile)) {
        throw new Error(`Compressed backup not found: ${tarFile}`);
      }

      const tarCommand = `tar -xzf ${tarFile} -C ${backupPath}`;
      execSync(tarCommand);

    } catch (error) {
      throw new Error(`Failed to decompress backup: ${error}`);
    }
  }

  private async encryptBackup(backupPath: string): Promise<void> {
    try {
      const crypto = await import("crypto");
      const fs = await import("fs");

      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(this.config.encryptionKey!, "salt", 32);
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      cipher.setAAD(Buffer.from("backup"));

      const input = fs.createReadStream(backupPath);
      const output = fs.createWriteStream(`${backupPath}.enc`);

      input.pipe(cipher).pipe(output);

      await new Promise<void>((resolve, reject) => {
        output.on("finish", () => resolve());
        output.on("error", reject);
      });

    } catch (error) {
      throw new Error(`Failed to encrypt backup: ${error}`);
    }
  }

  private async decryptBackup(backupPath: string): Promise<void> {
    try {
      const crypto = await import("crypto");
      const fs = await import("fs");

      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(this.config.encryptionKey!, "salt", 32);
      const iv = crypto.randomBytes(16);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAAD(Buffer.from("backup"));

      const input = fs.createReadStream(`${backupPath}.enc`);
      const output = fs.createWriteStream(backupPath);

      input.pipe(decipher).pipe(output);

      await new Promise<void>((resolve, reject) => {
        output.on("finish", () => resolve());
        output.on("error", reject);
      });

    } catch (error) {
      throw new Error(`Failed to decrypt backup: ${error}`);
    }
  }

  private async calculateBackupSize(backupPath: string): Promise<number> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      let totalSize = 0;

      const calculateDirSize = (dir: string): number => {
        let size = 0;
        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory()) {
            size += calculateDirSize(filePath);
          } else {
            size += stats.size;
          }
        }

        return size;
      };

      return calculateDirSize(backupPath);
    } catch (error) {
      logger.error("Failed to calculate backup size", error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }

  private async deleteBackup(backupId: string): Promise<void> {
    try {
      const fs = await import("fs/promises");
      const backupPath = join(this.config.backupDirectory, backupId);

      // Try to delete compressed version first
      const compressedPath = `${backupPath}.tar.gz`;
      const encryptedPath = `${backupPath}.enc`;

      if (existsSync(compressedPath)) {
        await fs.unlink(compressedPath);
      } else if (existsSync(encryptedPath)) {
        await fs.unlink(encryptedPath);
      } else if (existsSync(backupPath)) {
        await fs.rm(backupPath, { recursive: true, force: true });
      }
    } catch (error) {
      throw new Error(`Failed to delete backup ${backupId}: ${error}`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

export async function createBackup(): Promise<void> {
  const backupManager = new BackupManager();
  const result = await backupManager.createBackup();

  if (!result.success) {
    logger.error("Backup failed", new Error(JSON.stringify(result.errors)));
    process.exit(1);
  }

}

export async function restoreBackup(backupId: string, environment: "staging" | "production" = "staging"): Promise<void> {
  const backupManager = new BackupManager();
  const result = await backupManager.restoreBackup({
    backupId,
    targetEnvironment: environment,
    restoreTables: [],
    skipConflicts: false,
    validateData: true,
  });

  if (!result.success) {
    logger.error("Restore failed", new Error(JSON.stringify(result.errors)));
    process.exit(1);
  }

}

export async function listBackups(): Promise<void> {
  const backupManager = new BackupManager();
  const backups = await backupManager.listBackups();

  console.table(backups);
}

export async function cleanupBackups(): Promise<void> {
  const backupManager = new BackupManager();
  const deletedCount = await backupManager.cleanupOldBackups();

}

// ============================================================================
// SCHEDULED BACKUP SERVICE
// ============================================================================

export class ScheduledBackupService {
  private backupManager: BackupManager;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<BackupConfig> = {}) {
    this.backupManager = new BackupManager(config);
  }

  startSchedule(): void {
    if (!this.backupManager["config"].scheduleEnabled) {
      return;
    }

    // Default to daily backups at 2 AM
    const cronExpression = this.backupManager["config"].scheduleCron || "0 2 * * *";


    // For now, use a simple interval (in production, use a proper cron library)
    this.intervalId = setInterval(async () => {
      try {
        await this.backupManager.createBackup();
        await this.backupManager.cleanupOldBackups();
      } catch (error) {
        logger.error("Scheduled backup failed", error instanceof Error ? error : new Error(String(error)));
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  stopSchedule(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default BackupManager;
