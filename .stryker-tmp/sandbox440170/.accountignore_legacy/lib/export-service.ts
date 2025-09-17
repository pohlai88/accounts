// @ts-nocheck
// =====================================================
// Phase 8: Professional Export Service
// Comprehensive data export with multiple formats
// =====================================================

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { format } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Export Types and Interfaces
export interface ExportOptions {
  format: "CSV" | "Excel" | "JSON" | "QuickBooks" | "PDF" | "XML";
  dataType: "all" | "accounts" | "transactions" | "reports" | "customers" | "vendors" | "items";
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    accountIds?: string[];
    companyId?: string;
    currency?: string;
    status?: string;
  };
  templateId?: string;
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface ExportResult {
  success: boolean;
  jobId: string;
  downloadUrl?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
}

export interface ExportJob {
  id: string;
  jobType: string;
  status: "pending" | "processing" | "completed" | "failed";
  fileFormat: string;
  dataTypes: string[];
  filters: any;
  filePath?: string;
  fileSizeBytes?: number;
  downloadCount: number;
  expiresAt: Date;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Professional Export Service Class
export class ExportService {
  private companyId: string;
  private userId: string;

  constructor(companyId: string, userId: string) {
    this.companyId = companyId;
    this.userId = userId;
  }

  // Main Export Method
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      // Create export job
      const jobId = await this.createExportJob(options);

      // Process export based on format
      let result: ExportResult;

      switch (options.format) {
        case "CSV":
          result = await this.exportToCSV(options, jobId);
          break;
        case "Excel":
          result = await this.exportToExcel(options, jobId);
          break;
        case "JSON":
          result = await this.exportToJSON(options, jobId);
          break;
        case "QuickBooks":
          result = await this.exportToQuickBooks(options, jobId);
          break;
        case "PDF":
          result = await this.exportToPDF(options, jobId);
          break;
        case "XML":
          result = await this.exportToXML(options, jobId);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      return result;
    } catch (error) {
      console.error("Export failed:", error);
      return {
        success: false,
        jobId: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create Export Job
  private async createExportJob(options: ExportOptions): Promise<string> {
    const { data, error } = await supabase
      .from("export_jobs")
      .insert({
        job_type: options.format.toLowerCase(),
        file_format: options.format,
        data_types: [options.dataType],
        filters: options.filters || {},
        company_id: this.companyId,
        created_by: this.userId,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  // CSV Export
  private async exportToCSV(options: ExportOptions, jobId: string): Promise<ExportResult> {
    try {
      const data = await this.fetchDataForExport(options);
      const csvContent = this.convertToCSV(data, options);

      // Save to Supabase Storage
      const fileName = `export_${options.dataType}_${Date.now()}.csv`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, csvContent, {
          contentType: "text/csv",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Update job status
      await this.updateExportJob(jobId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: csvContent.length,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId,
        downloadUrl: uploadData.path,
        fileSize: csvContent.length,
        recordCount: data.length,
      };
    } catch (error) {
      await this.updateExportJob(jobId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // Excel Export
  private async exportToExcel(options: ExportOptions, jobId: string): Promise<ExportResult> {
    try {
      const data = await this.fetchDataForExport(options);

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Main data sheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, options.dataType);

      // Metadata sheet
      if (options.includeMetadata) {
        const metadata = this.generateMetadata(options, data.length);
        const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");
      }

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
        compression: options.compression,
      });

      // Save to Supabase Storage
      const fileName = `export_${options.dataType}_${Date.now()}.xlsx`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, excelBuffer, {
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Update job status
      await this.updateExportJob(jobId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: excelBuffer.length,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId,
        downloadUrl: uploadData.path,
        fileSize: excelBuffer.length,
        recordCount: data.length,
      };
    } catch (error) {
      await this.updateExportJob(jobId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // JSON Export
  private async exportToJSON(options: ExportOptions, jobId: string): Promise<ExportResult> {
    try {
      const data = await this.fetchDataForExport(options);

      const jsonData = {
        exportInfo: {
          format: "JSON",
          dataType: options.dataType,
          exportedAt: new Date().toISOString(),
          recordCount: data.length,
          companyId: this.companyId,
        },
        data: data,
        metadata: options.includeMetadata ? this.generateMetadata(options, data.length) : undefined,
      };

      const jsonContent = JSON.stringify(jsonData, null, 2);

      // Save to Supabase Storage
      const fileName = `export_${options.dataType}_${Date.now()}.json`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, jsonContent, {
          contentType: "application/json",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Update job status
      await this.updateExportJob(jobId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: jsonContent.length,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId,
        downloadUrl: uploadData.path,
        fileSize: jsonContent.length,
        recordCount: data.length,
      };
    } catch (error) {
      await this.updateExportJob(jobId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // QuickBooks Export (IIF Format)
  private async exportToQuickBooks(options: ExportOptions, jobId: string): Promise<ExportResult> {
    try {
      const data = await this.fetchDataForExport(options);
      const iifContent = this.convertToQuickBooksIIF(data, options);

      // Save to Supabase Storage
      const fileName = `quickbooks_export_${Date.now()}.iif`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, iifContent, {
          contentType: "text/plain",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Update job status
      await this.updateExportJob(jobId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: iifContent.length,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId,
        downloadUrl: uploadData.path,
        fileSize: iifContent.length,
        recordCount: data.length,
      };
    } catch (error) {
      await this.updateExportJob(jobId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // PDF Export
  private async exportToPDF(options: ExportOptions, jobId: string): Promise<ExportResult> {
    try {
      const data = await this.fetchDataForExport(options);
      const pdfContent = await this.convertToPDF(data, options);

      // Save to Supabase Storage
      const fileName = `export_${options.dataType}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, pdfContent, {
          contentType: "application/pdf",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Update job status
      await this.updateExportJob(jobId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: pdfContent.length,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId,
        downloadUrl: uploadData.path,
        fileSize: pdfContent.length,
        recordCount: data.length,
      };
    } catch (error) {
      await this.updateExportJob(jobId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // XML Export
  private async exportToXML(options: ExportOptions, jobId: string): Promise<ExportResult> {
    try {
      const data = await this.fetchDataForExport(options);
      const xmlContent = this.convertToXML(data, options);

      // Save to Supabase Storage
      const fileName = `export_${options.dataType}_${Date.now()}.xml`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("exports")
        .upload(fileName, xmlContent, {
          contentType: "application/xml",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Update job status
      await this.updateExportJob(jobId, {
        status: "completed",
        file_path: uploadData.path,
        file_size_bytes: xmlContent.length,
        completed_at: new Date().toISOString(),
      });

      return {
        success: true,
        jobId,
        downloadUrl: uploadData.path,
        fileSize: xmlContent.length,
        recordCount: data.length,
      };
    } catch (error) {
      await this.updateExportJob(jobId, {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  // Fetch Data for Export
  private async fetchDataForExport(options: ExportOptions): Promise<any[]> {
    let query = supabase.from(this.getTableName(options.dataType)).select("*");

    // Apply company filter
    if (this.companyId) {
      query = query.eq("company_id", this.companyId);
    }

    // Apply date range filter
    if (options.dateRange) {
      query = query.gte("created_at", options.dateRange.start.toISOString());
      query = query.lte("created_at", options.dateRange.end.toISOString());
    }

    // Apply additional filters
    if (options.filters) {
      if (options.filters.accountIds) {
        query = query.in("account_id", options.filters.accountIds);
      }
      if (options.filters.currency) {
        query = query.eq("currency", options.filters.currency);
      }
      if (options.filters.status) {
        query = query.eq("status", options.filters.status);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Get Table Name for Data Type
  private getTableName(dataType: string): string {
    const tableMap: Record<string, string> = {
      accounts: "accounts",
      transactions: "gl_entries",
      customers: "customers",
      vendors: "vendors",
      items: "items",
      reports: "reports",
    };
    return tableMap[dataType] || "accounts";
  }

  // Convert to CSV
  private convertToCSV(data: any[], options: ExportOptions): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  // Convert to QuickBooks IIF
  private convertToQuickBooksIIF(data: any[], options: ExportOptions): string {
    const iifRows: string[] = [];

    // IIF Header
    iifRows.push("!ACCNT\tNAME\tACCNTTYPE\tDESC\tACCNUM");

    for (const row of data) {
      if (options.dataType === "accounts") {
        iifRows.push(
          [
            "ACCNT",
            row.name,
            this.mapAccountTypeToQuickBooks(row.account_type),
            row.description || "",
            row.account_code || "",
          ].join("\t"),
        );
      }
    }

    return iifRows.join("\n");
  }

  // Map Account Type to QuickBooks
  private mapAccountTypeToQuickBooks(accountType: string): string {
    const mapping: Record<string, string> = {
      Asset: "BANK",
      Liability: "CREDIT CARD",
      Equity: "EQUITY",
      Income: "INCOME",
      Expense: "EXPENSE",
    };
    return mapping[accountType] || "OTHER";
  }

  // Convert to PDF (simplified - would use jsPDF in real implementation)
  private async convertToPDF(data: any[], options: ExportOptions): Promise<Buffer> {
    // This is a simplified implementation
    // In a real implementation, you would use jsPDF or similar
    const content = `Export Report\n\nData Type: ${options.dataType}\nRecord Count: ${data.length}\n\n${JSON.stringify(data, null, 2)}`;
    return Buffer.from(content, "utf-8");
  }

  // Convert to XML
  private convertToXML(data: any[], options: ExportOptions): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<export>\n`;
    xml += `  <metadata>\n`;
    xml += `    <dataType>${options.dataType}</dataType>\n`;
    xml += `    <recordCount>${data.length}</recordCount>\n`;
    xml += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
    xml += `  </metadata>\n`;
    xml += `  <data>\n`;

    for (const row of data) {
      xml += `    <record>\n`;
      for (const [key, value] of Object.entries(row)) {
        xml += `      <${key}>${value}</${key}>\n`;
      }
      xml += `    </record>\n`;
    }

    xml += `  </data>\n`;
    xml += `</export>`;

    return xml;
  }

  // Generate Metadata
  private generateMetadata(options: ExportOptions, recordCount: number): any {
    return {
      exportInfo: {
        format: options.format,
        dataType: options.dataType,
        recordCount,
        exportedAt: new Date().toISOString(),
        companyId: this.companyId,
        userId: this.userId,
      },
      filters: options.filters,
      dateRange: options.dateRange,
    };
  }

  // Update Export Job
  private async updateExportJob(jobId: string, updates: any): Promise<void> {
    const { error } = await supabase.from("export_jobs").update(updates).eq("id", jobId);

    if (error) throw error;
  }

  // Get Export Jobs
  async getExportJobs(): Promise<ExportJob[]> {
    const { data, error } = await supabase
      .from("export_jobs")
      .select("*")
      .eq("company_id", this.companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get Download URL
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage.from("exports").createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || "";
  }

  // Delete Export Job
  async deleteExportJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from("export_jobs")
      .delete()
      .eq("id", jobId)
      .eq("company_id", this.companyId);

    if (error) throw error;
  }
}

// Export Utility Functions
export const exportUtils = {
  // Format Date for Export
  formatDateForExport: (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  },

  // Format Currency for Export
  formatCurrencyForExport: (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  // Validate Export Options
  validateExportOptions: (options: ExportOptions): string[] => {
    const errors: string[] = [];

    if (!options.format) {
      errors.push("Export format is required");
    }

    if (!options.dataType) {
      errors.push("Data type is required");
    }

    if (options.dateRange && options.dateRange.start > options.dateRange.end) {
      errors.push("Start date must be before end date");
    }

    return errors;
  },

  // Get Supported Formats
  getSupportedFormats: (): string[] => {
    return ["CSV", "Excel", "JSON", "QuickBooks", "PDF", "XML"];
  },

  // Get Supported Data Types
  getSupportedDataTypes: (): string[] => {
    return ["all", "accounts", "transactions", "reports", "customers", "vendors", "items"];
  },
};
