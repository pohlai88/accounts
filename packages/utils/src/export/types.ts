// Export system types for V1 compliance

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  JSONL = 'jsonl'
}

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
  compression?: boolean; // For XLSX files
  sheetName?: string; // Custom sheet name
  styling?: {
    headerStyle?: ExcelCellStyle;
    dataStyle?: ExcelCellStyle;
    alternateRowStyle?: ExcelCellStyle;
  };
  charts?: ChartConfig[]; // For advanced Excel exports
}

export interface ExcelCellStyle {
  font?: {
    bold?: boolean;
    italic?: boolean;
    color?: { rgb: string };
    size?: number;
  };
  fill?: {
    fgColor?: { rgb: string };
    bgColor?: { rgb: string };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
  };
  border?: {
    top?: { style: string; color?: { rgb: string } };
    bottom?: { style: string; color?: { rgb: string } };
    left?: { style: string; color?: { rgb: string } };
    right?: { style: string; color?: { rgb: string } };
  };
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'column';
  title: string;
  dataRange: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExportResult {
  success: boolean;
  filename: string;
  url?: string;
  size: number;
  recordCount: number;
  error?: string;
  buffer?: Buffer; // For server-side file operations
  downloadUrl?: string; // For client downloads
  expiresAt?: Date; // For temporary URLs
}

export interface ExportableData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  metadata?: Record<string, unknown>;
}

export interface ReportExportRequest {
  reportType: 'trial-balance' | 'balance-sheet' | 'profit-loss' | 'cash-flow';
  format: ExportFormat;
  filters: {
    tenantId: string;
    companyId: string;
    asOfDate?: string;
    fromDate?: string;
    toDate?: string;
    accountIds?: string[];
    includeInactive?: boolean;
  };
  options?: Partial<ExportOptions>;
}
