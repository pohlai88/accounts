// @ts-nocheck
// D2 Tax Calculation Utilities
import { getTaxCode, getTaxCodes, type Scope } from "@aibos/db";

export interface TaxCalculationInput {
  lineAmount: number;
  taxCode?: string;
}

export interface TaxCalculationResult {
  taxRate: number;
  taxAmount: number;
  taxAccountId?: string;
  taxType?: string;
}

export interface LineTaxCalculation {
  lineNumber: number;
  lineAmount: number;
  taxCode?: string;
  taxRate: number;
  taxAmount: number;
  taxAccountId?: string;
}

/**
 * Calculate tax for a single line item
 */
export async function calculateLineTax(
  scope: Scope,
  input: TaxCalculationInput,
): Promise<TaxCalculationResult> {
  // If no tax code provided, return zero tax
  if (!input.taxCode) {
    return {
      taxRate: 0,
      taxAmount: 0,
    };
  }

  try {
    // Get tax code information from database
    const taxCodeInfo = await getTaxCode(scope, input.taxCode);

    if (!taxCodeInfo) {
      throw new Error(`Tax code not found: ${input.taxCode}`);
    }

    // Calculate tax amount
    const taxRate = parseFloat(taxCodeInfo.rate);
    const taxAmount = Math.round(input.lineAmount * taxRate * 100) / 100; // Round to 2 decimal places

    return {
      taxRate,
      taxAmount,
      taxAccountId: taxCodeInfo.taxAccountId,
      taxType: taxCodeInfo.taxType,
    };
  } catch (error) {
    // If tax code not found, default to zero tax but log the error
    console.warn(`Tax code lookup failed for '${input.taxCode}':`, error);

    return {
      taxRate: 0,
      taxAmount: 0,
    };
  }
}

/**
 * Calculate taxes for multiple line items
 */
export async function calculateInvoiceTaxes(
  scope: Scope,
  lines: Array<{
    lineNumber: number;
    lineAmount: number;
    taxCode?: string;
  }>,
): Promise<LineTaxCalculation[]> {
  // Get unique tax codes
  const taxCodes = [...new Set(lines.map(line => line.taxCode).filter(Boolean))] as string[];

  // Fetch all tax codes in one query for efficiency
  const taxCodeMap = new Map<string, Record<string, unknown>>();

  if (taxCodes.length > 0) {
    try {
      const taxCodeInfos = await getTaxCodes(scope, taxCodes);
      for (const info of taxCodeInfos) {
        taxCodeMap.set(info.code, info);
      }
    } catch (error) {
      console.warn("Failed to fetch tax codes:", error);
    }
  }

  // Calculate tax for each line
  const results: LineTaxCalculation[] = [];

  for (const line of lines) {
    let taxRate = 0;
    let taxAmount = 0;
    let taxAccountId: string | undefined;

    if (line.taxCode && taxCodeMap.has(line.taxCode)) {
      const taxInfo = taxCodeMap.get(line.taxCode);
      if (taxInfo) {
        taxRate = parseFloat(String(taxInfo.rate || "0"));
        taxAmount = Math.round(line.lineAmount * taxRate * 100) / 100;
        taxAccountId = String(taxInfo.taxAccountId || "");
      }
    }

    results.push({
      lineNumber: line.lineNumber,
      lineAmount: line.lineAmount,
      taxCode: line.taxCode,
      taxRate,
      taxAmount,
      taxAccountId,
    });
  }

  return results;
}

/**
 * Calculate total tax amount for an invoice
 */
export function calculateTotalTax(lineTaxes: LineTaxCalculation[]): number {
  return Math.round(lineTaxes.reduce((total, line) => total + line.taxAmount, 0) * 100) / 100;
}

/**
 * Validate tax calculations
 */
export function validateTaxCalculations(
  lines: Array<{ lineAmount: number; taxRate: number; taxAmount: number }>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) {
      errors.push(`Line ${i + 1}: Line data is missing`);
      continue;
    }

    const expectedTaxAmount = Math.round(line.lineAmount * line.taxRate * 100) / 100;

    if (Math.abs(line.taxAmount - expectedTaxAmount) > 0.01) {
      errors.push(
        `Line ${i + 1}: Tax amount ${line.taxAmount} does not match expected ${expectedTaxAmount} (line amount ${line.lineAmount} × tax rate ${line.taxRate})`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Group tax amounts by tax code for GL posting
 */
export function groupTaxesByCode(lineTaxes: LineTaxCalculation[]): Array<{
  taxCode: string;
  taxAccountId: string;
  totalTaxAmount: number;
  lineCount: number;
}> {
  const taxGroups = new Map<
    string,
    {
      taxAccountId: string;
      totalTaxAmount: number;
      lineCount: number;
    }
  >();

  for (const line of lineTaxes) {
    if (line.taxCode && line.taxAccountId && line.taxAmount > 0) {
      const existing = taxGroups.get(line.taxCode);

      if (existing) {
        existing.totalTaxAmount += line.taxAmount;
        existing.lineCount += 1;
      } else {
        taxGroups.set(line.taxCode, {
          taxAccountId: line.taxAccountId,
          totalTaxAmount: line.taxAmount,
          lineCount: 1,
        });
      }
    }
  }

  return Array.from(taxGroups.entries()).map(([taxCode, data]) => ({
    taxCode,
    taxAccountId: data.taxAccountId,
    totalTaxAmount: Math.round(data.totalTaxAmount * 100) / 100,
    lineCount: data.lineCount,
  }));
}
