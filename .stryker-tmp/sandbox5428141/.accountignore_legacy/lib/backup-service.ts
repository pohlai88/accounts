// @ts-nocheck
// =====================================================
// Phase 8: Professional Backup & Restore Service
// Complete data backup with encryption and compression
// =====================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { gzip, gunzip } from "zlib";
import { promisify } from "util";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Backup Types and Interfaces
export interface BackupOptions {
  type: "full" | "incremental" | "differential";
  tables: string[];
  includeMetadata: boolean;
  compression: boolean;
  encryption: boolean;
  password?: string;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  filePath?: string;
  fileSize?: number;
  recordCounts?: Record<string, number>;
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  password?: string;
  tables?: string[];
  mergeMode: "replace" | "merge" | "skip_existing";
  validateData: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  recordCounts?: Record<string, number>;
  errors?: string[];
}

export interface BackupJob {
  id: string;
  backupType: string;
  status: "pending" | "processing" | "completed" | "failed";
  filePath?: string;
  fileSizeBytes?: number;
  encryptionKeyHash?: string;
  compressionRatio?: number;
  tablesIncluded: string[];
  recordsCount: Record<string, number>;
  companyId: string;
  createdAt: Date;
  completedAt?: Date;
}

// Backup Service Class
export class BackupService {
  private companyId: string;
  private userId: string;

  constructor(companyId: string, userId: string) {
    this.companyId = companyId;
    this.userId = userId;
  }

  // Create Backup
  async createBackup(options: BackupOptions): Promise<BackupResult> {
    try {
      // Create backup job
      const backupId = await this.createBackupJob(options);

      // Process backup
      const result = await this.processBackup(backupId, options);

      return result;
    } catch (error) {
      console.error("Backup failed:", error);
      return {
        success: false,
        backupId: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create Backup Job
  private async createBackupJob(options: BackupOptions): Promise<string> {
    const { data, error } = await supabase
      .from("backup_jobs")
      .insert({
        backup_type: options.type,
        tables_included: options.tables,
        company_id: this.companyId,
        created_by: this.userId,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  // Process Backup
  private async processBackup(backupId: string, options: BackupOptions): Promise<BackupResult> {
    try {
      // Update job status to processing
      await this.updateBackupJob(backupId, { status: "processing" });

      // Collect data from all tables
      const backupData: Record<string, any[]> = {};
      const recordCounts: Record<string, number> = {};

      for (const table of options.tables) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("company_id", this.companyId);

        if (error) {
          console.warn(`Failed to backup table ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
        recordCounts[table] = data?.length || 0;
      }

      // Create backup package
      const backupPackage = {
        metadata: {
          version: "1.0.0",
          backupType: options.type,
          createdAt: new Date().toISOString(),
          companyId: this.companyId,
          userId: this.userId,
          tables: options.tables,
          recordCounts,
          includeMetadata: options.includeMetadata,
        },
        data: backupData,
      };

      // Serialize to JSON
      let backupContent = JSON.stringify(backupPackage, null, 2);

      // Apply compression if requested
      if (options.compression) {
        const compressed = await gzipAsync(backupContent);
        backupContent = compressed.toString("base64");
      }

      // Apply encryption if requested
      if (options.encryption && options.password) {
        backupContent = this.encryptData(backupContent, options.password);
      }

      // Save to Supabase Storage
      const fileName = `backup_${options.type}_${Date.now()}.json`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("backups")
        .upload(fileName, backupContent, {
          contentType: "application/json",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Calculate compression ratio
      const compressionRatio = options.compression
        ? backupContent.length / JSON.stringify(backupPackage).length
        : 1;

      // Update job status
      await this.updateBackupJob(backupId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: backupContent.length,
        compression_ratio: compressionRatio,
        records_count: recordCounts,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        backupId,
        filePath: uploadData.path,
        fileSize: backupContent.length,
        recordCounts,
      };
    } catch (error) {
      await this.updateBackupJob(backupId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // Restore Backup
  async restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
    try {
      // Get backup job details
      const { data: backupJob, error: jobError } = await supabase
        .from("backup_jobs")
        .select("*")
        .eq("id", options.backupId)
        .eq("company_id", this.companyId)
        .single();

      if (jobError || !backupJob) {
        throw new Error("Backup not found");
      }

      // Download backup file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("backups")
        .download(backupJob.file_path);

      if (downloadError) throw downloadError;

      // Read file content
      const fileContent = await fileData.text();

      // Decrypt if encrypted
      let decryptedContent = fileContent;
      if (backupJob.encryption_key_hash && options.password) {
        decryptedContent = this.decryptData(fileContent, options.password);
      }

      // Decompress if compressed
      if (backupJob.compression_ratio && backupJob.compression_ratio < 1) {
        const compressed = Buffer.from(decryptedContent, "base64");
        const decompressed = await gunzipAsync(compressed);
        decryptedContent = decompressed.toString("utf-8");
      }

      // Parse backup data
      const backupPackage = JSON.parse(decryptedContent);

      // Validate backup data
      if (options.validateData) {
        const validation = this.validateBackupData(backupPackage);
        if (!validation.valid) {
          throw new Error(`Backup validation failed: ${validation.error}`);
        }
      }

      // Restore data
      const result = await this.restoreData(backupPackage, options);

      return result;
    } catch (error) {
      console.error("Restore failed:", error);
      return {
        success: false,
        restoredTables: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // Restore Data
  private async restoreData(backupPackage: any, options: RestoreOptions): Promise<RestoreResult> {
    const restoredTables: string[] = [];
    const recordCounts: Record<string, number> = {};
    const errors: string[] = [];

    const tablesToRestore = options.tables || Object.keys(backupPackage.data);

    for (const table of tablesToRestore) {
      try {
        const tableData = backupPackage.data[table];
        if (!tableData || tableData.length === 0) {
          continue;
        }

        // Apply merge mode logic
        if (options.mergeMode === "replace") {
          // Delete existing data
          await supabase.from(table).delete().eq("company_id", this.companyId);
        }

        // Insert data
        const { error } = await supabase.from(table).insert(
          tableData.map((record: any) => ({
            ...record,
            company_id: this.companyId,
          })),
        );

        if (error) {
          errors.push(`Failed to restore table ${table}: ${error.message}`);
          continue;
        }

        restoredTables.push(table);
        recordCounts[table] = tableData.length;
      } catch (error) {
        errors.push(
          `Error restoring table ${table}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return {
      success: errors.length === 0,
      restoredTables,
      recordCounts,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Validate Backup Data
  private validateBackupData(backupPackage: any): { valid: boolean; error?: string } {
    if (!backupPackage.metadata) {
      return { valid: false, error: "Missing metadata" };
    }

    if (!backupPackage.data) {
      return { valid: false, error: "Missing data" };
    }

    if (backupPackage.metadata.companyId !== this.companyId) {
      return { valid: false, error: "Company ID mismatch" };
    }

    return { valid: true };
  }

  // Encrypt Data
  private encryptData(data: string, password: string): string {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    });
  }

  // Decrypt Data
  private decryptData(encryptedData: string, password: string): string {
    try {
      const parsed = JSON.parse(encryptedData);
      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(password, "salt", 32);
      const iv = Buffer.from(parsed.iv, "hex");
      const authTag = Buffer.from(parsed.authTag, "hex");

      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(parsed.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error("Failed to decrypt data: Invalid password or corrupted data");
    }
  }

  // Update Backup Job
  private async updateBackupJob(backupId: string, updates: any): Promise<void> {
    const { error } = await supabase.from("backup_jobs").update(updates).eq("id", backupId);

    if (error) throw error;
  }

  // Get Backup Jobs
  async getBackupJobs(): Promise<BackupJob[]> {
    const { data, error } = await supabase
      .from("backup_jobs")
      .select("*")
      .eq("company_id", this.companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Delete Backup
  async deleteBackup(backupId: string): Promise<void> {
    // Get backup job
    const { data: backupJob, error: jobError } = await supabase
      .from("backup_jobs")
      .select("file_path")
      .eq("id", backupId)
      .eq("company_id", this.companyId)
      .single();

    if (jobError) throw jobError;

    // Delete file from storage
    if (backupJob.file_path) {
      await supabase.storage.from("backups").remove([backupJob.file_path]);
    }

    // Delete job record
    const { error } = await supabase
      .from("backup_jobs")
      .delete()
      .eq("id", backupId)
      .eq("company_id", this.companyId);

    if (error) throw error;
  }

  // Get Backup Download URL
  async getBackupDownloadUrl(backupId: string): Promise<string> {
    const { data: backupJob, error } = await supabase
      .from("backup_jobs")
      .select("file_path")
      .eq("id", backupId)
      .eq("company_id", this.companyId)
      .single();

    if (error) throw error;

    const { data } = await supabase.storage
      .from("backups")
      .createSignedUrl(backupJob.file_path, 3600); // 1 hour expiry

    return data?.signedUrl || "";
  }

  // Schedule Automatic Backups
  async scheduleAutomaticBackup(
    frequency: "daily" | "weekly" | "monthly",
    tables: string[],
  ): Promise<void> {
    // This would integrate with a job scheduler like cron or a cloud function
    // For now, we'll just store the schedule in the database
    const { error } = await supabase.from("backup_schedules").insert({
      frequency,
      tables,
      company_id: this.companyId,
      created_by: this.userId,
      is_active: true,
    });

    if (error) throw error;
  }

  // Get Backup Statistics
  async getBackupStatistics(): Promise<any> {
    const { data, error } = await supabase
      .from("backup_jobs")
      .select("backup_type, file_size_bytes, created_at, status")
      .eq("company_id", this.companyId);

    if (error) throw error;

    const stats = {
      totalBackups: data.length,
      totalSize: data.reduce((sum, backup) => sum + (backup.file_size_bytes || 0), 0),
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recentBackups: data.slice(0, 5),
    };

    data.forEach(backup => {
      stats.byType[backup.backup_type] = (stats.byType[backup.backup_type] || 0) + 1;
      stats.byStatus[backup.status] = (stats.byStatus[backup.status] || 0) + 1;
    });

    return stats;
  }
}

// Backup Utility Functions
export const backupUtils = {
  // Get Available Tables
  getAvailableTables: (): string[] => {
    return [
      "companies",
      "accounts",
      "gl_entries",
      "customers",
      "vendors",
      "items",
      "invoices",
      "payments",
      "recurring_templates",
      "budgets",
      "projects",
      "fixed_assets",
      "depreciation_schedules",
      "tax_rates",
      "exchange_rates",
      "user_companies",
      "api_keys",
      "export_jobs",
      "webhook_endpoints",
      "backup_jobs",
    ];
  },

  // Calculate Backup Size
  calculateBackupSize: (data: any): number => {
    return JSON.stringify(data).length;
  },

  // Validate Backup File
  validateBackupFile: (file: File): { valid: boolean; error?: string } => {
    if (!file.name.endsWith(".json")) {
      return { valid: false, error: "Invalid file format. Expected .json file" };
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      return { valid: false, error: "File too large. Maximum size is 100MB" };
    }

    return { valid: true };
  },

  // Generate Backup Report
  generateBackupReport: (backupJob: BackupJob): string => {
    return `
Backup Report
=============
ID: ${backupJob.id}
Type: ${backupJob.backupType}
Status: ${backupJob.status}
File Size: ${backupJob.fileSizeBytes ? (backupJob.fileSizeBytes / 1024 / 1024).toFixed(2) + " MB" : "N/A"}
Compression Ratio: ${backupJob.compressionRatio ? (backupJob.compressionRatio * 100).toFixed(1) + "%" : "N/A"}
Tables: ${backupJob.tablesIncluded.join(", ")}
Records: ${Object.entries(backupJob.recordsCount)
      .map(([table, count]) => `${table}: ${count}`)
      .join(", ")}
Created: ${backupJob.createdAt}
Completed: ${backupJob.completedAt || "N/A"}
    `.trim();
  },
};
