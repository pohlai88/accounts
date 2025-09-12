// D3 Bank CSV Import System - Multi-format Bank Statement Processing
// CSV parsing functionality - will be implemented with a CSV parser
// For now, using a simple implementation

export interface BankTransactionImport {
    transactionDate: Date;
    description: string;
    reference?: string;
    debitAmount: number;
    creditAmount: number;
    balance?: number;
    transactionType?: string;
    rawData: Record<string, any>; // Original CSV row data
}

export interface ImportResult {
    success: boolean;
    transactions: BankTransactionImport[];
    errors: string[];
    warnings: string[];
    summary: {
        totalRows: number;
        validTransactions: number;
        duplicates: number;
        errors: number;
    };
}

export interface BankFormat {
    name: string;
    dateColumn: string;
    descriptionColumn: string;
    referenceColumn?: string;
    debitColumn?: string;
    creditColumn?: string;
    amountColumn?: string;
    balanceColumn?: string;
    typeColumn?: string;
    dateFormat: string;
    skipRows: number;
    encoding?: string;
}

// Predefined bank formats for Malaysian banks
export const BANK_FORMATS: Record<string, BankFormat> = {
    MAYBANK: {
        name: 'Maybank',
        dateColumn: 'Date',
        descriptionColumn: 'Description',
        referenceColumn: 'Reference',
        debitColumn: 'Debit',
        creditColumn: 'Credit',
        balanceColumn: 'Balance',
        dateFormat: 'DD/MM/YYYY',
        skipRows: 1
    },
    CIMB: {
        name: 'CIMB Bank',
        dateColumn: 'Transaction Date',
        descriptionColumn: 'Description',
        referenceColumn: 'Reference No',
        amountColumn: 'Amount',
        balanceColumn: 'Balance',
        typeColumn: 'Dr/Cr',
        dateFormat: 'DD-MM-YYYY',
        skipRows: 2
    },
    PUBLIC_BANK: {
        name: 'Public Bank',
        dateColumn: 'Date',
        descriptionColumn: 'Transaction Details',
        debitColumn: 'Withdrawal',
        creditColumn: 'Deposit',
        balanceColumn: 'Balance',
        dateFormat: 'DD/MM/YYYY',
        skipRows: 1
    },
    HONG_LEONG: {
        name: 'Hong Leong Bank',
        dateColumn: 'Date',
        descriptionColumn: 'Description',
        referenceColumn: 'Ref No',
        debitColumn: 'Debit Amount',
        creditColumn: 'Credit Amount',
        balanceColumn: 'Balance',
        dateFormat: 'DD-MMM-YYYY',
        skipRows: 1
    },
    RHB: {
        name: 'RHB Bank',
        dateColumn: 'Transaction Date',
        descriptionColumn: 'Transaction Description',
        amountColumn: 'Amount',
        balanceColumn: 'Available Balance',
        typeColumn: 'Transaction Type',
        dateFormat: 'DD/MM/YYYY',
        skipRows: 1
    },
    GENERIC: {
        name: 'Generic Format',
        dateColumn: 'date',
        descriptionColumn: 'description',
        referenceColumn: 'reference',
        debitColumn: 'debit',
        creditColumn: 'credit',
        balanceColumn: 'balance',
        dateFormat: 'YYYY-MM-DD',
        skipRows: 1
    }
};

/**
 * Import bank transactions from CSV data
 */
export async function importBankTransactions(
    csvData: string,
    format: BankFormat,
    bankAccountId: string,
    importBatchId: string
): Promise<ImportResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const transactions: BankTransactionImport[] = [];

    try {
        // Parse CSV data (simplified implementation)
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }

        const csvHeaders = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
        const records = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const record: Record<string, any> = {};
            csvHeaders.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            return record;
        });

        // Skip header rows if specified
        const dataRows = records.slice(format.skipRows);

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const rowNumber = i + format.skipRows + 1;

            try {
                const transaction = parseTransactionRow(row || {}, format, rowNumber);

                // Validate transaction
                const validation = validateTransaction(transaction, rowNumber);
                if (validation.valid) {
                    transactions.push(transaction);
                } else {
                    errors.push(...validation.errors);
                }

                warnings.push(...validation.warnings);

            } catch (error) {
                errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
            }
        }

        // Check for duplicates within the import
        const duplicates = findDuplicateTransactions(transactions);

        return {
            success: errors.length === 0,
            transactions: transactions.filter((_, index) => !duplicates.includes(index)),
            errors,
            warnings: [...warnings, ...duplicates.map(i => `Row ${i + 1}: Duplicate transaction detected`)],
            summary: {
                totalRows: dataRows.length,
                validTransactions: transactions.length - duplicates.length,
                duplicates: duplicates.length,
                errors: errors.length
            }
        };

    } catch (error) {
        return {
            success: false,
            transactions: [],
            errors: [`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
            summary: {
                totalRows: 0,
                validTransactions: 0,
                duplicates: 0,
                errors: 1
            }
        };
    }
}

/**
 * Parse a single transaction row
 */
function parseTransactionRow(row: Record<string, any>, format: BankFormat, rowNumber: number): BankTransactionImport {
    // Parse date
    const dateStr = row[format.dateColumn];
    if (!dateStr) {
        throw new Error(`Missing date in column '${format.dateColumn}'`);
    }

    const transactionDate = parseDate(dateStr, format.dateFormat);
    if (!transactionDate) {
        throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Parse description
    const description = row[format.descriptionColumn]?.toString().trim();
    if (!description) {
        throw new Error(`Missing description in column '${format.descriptionColumn}'`);
    }

    // Parse reference
    const reference = format.referenceColumn ? row[format.referenceColumn]?.toString().trim() || undefined : undefined;

    // Parse amounts
    let debitAmount = 0;
    let creditAmount = 0;

    if (format.debitColumn && format.creditColumn) {
        // Separate debit/credit columns
        debitAmount = parseAmount(row[format.debitColumn]) || 0;
        creditAmount = parseAmount(row[format.creditColumn]) || 0;
    } else if (format.amountColumn && format.typeColumn) {
        // Single amount column with type indicator
        const amount = parseAmount(row[format.amountColumn]) || 0;
        const type = row[format.typeColumn]?.toString().toUpperCase();

        if (type?.includes('DR') || type?.includes('DEBIT') || type?.includes('WITHDRAWAL')) {
            debitAmount = Math.abs(amount);
        } else if (type?.includes('CR') || type?.includes('CREDIT') || type?.includes('DEPOSIT')) {
            creditAmount = Math.abs(amount);
        } else {
            // Determine by amount sign
            if (amount < 0) {
                debitAmount = Math.abs(amount);
            } else {
                creditAmount = amount;
            }
        }
    } else if (format.amountColumn) {
        // Single amount column, determine by sign
        const amount = parseAmount(row[format.amountColumn]) || 0;
        if (amount < 0) {
            debitAmount = Math.abs(amount);
        } else {
            creditAmount = amount;
        }
    }

    // Parse balance
    const balance = format.balanceColumn ? parseAmount(row[format.balanceColumn]) : undefined;

    // Parse transaction type
    const transactionType = format.typeColumn ? row[format.typeColumn]?.toString().trim() || undefined : undefined;

    return {
        transactionDate,
        description,
        reference,
        debitAmount,
        creditAmount,
        balance: balance || undefined,
        transactionType,
        rawData: row
    };
}

/**
 * Parse date string according to format
 */
function parseDate(dateStr: string, format: string): Date | null {
    try {
        // Handle common Malaysian date formats
        if (format === 'DD/MM/YYYY' || format === 'DD-MM-YYYY') {
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
                const day = parseInt(parts[0] || '0');
                const month = parseInt(parts[1] || '0') - 1; // Month is 0-indexed
                const year = parseInt(parts[2] || '0');
                return new Date(year, month, day);
            }
        } else if (format === 'DD-MMM-YYYY') {
            // Handle format like "15-Jan-2024"
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const day = parseInt(parts[0] || '0');
                const monthStr = parts[1] || '';
                const year = parseInt(parts[2] || '0');

                const monthMap: Record<string, number> = {
                    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                };

                const month = monthMap[monthStr as keyof typeof monthMap];
                if (month !== undefined) {
                    return new Date(year, month, day);
                }
            }
        } else if (format === 'YYYY-MM-DD') {
            return new Date(dateStr);
        }

        // Fallback: try to parse as-is
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;

    } catch {
        return null;
    }
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: any): number | null {
    if (amountStr === null || amountStr === undefined || amountStr === '') {
        return null;
    }

    // Convert to string and clean
    const cleanStr = amountStr.toString()
        .replace(/[^\d.-]/g, '') // Remove non-numeric characters except . and -
        .trim();

    if (cleanStr === '') {
        return null;
    }

    const amount = parseFloat(cleanStr);
    return isNaN(amount) ? null : amount;
}

/**
 * Validate a parsed transaction
 */
function validateTransaction(transaction: BankTransactionImport, rowNumber: number): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate date is not in the future
    if (transaction.transactionDate > new Date()) {
        warnings.push(`Row ${rowNumber}: Transaction date is in the future`);
    }

    // Validate date is not too old (more than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    if (transaction.transactionDate < twoYearsAgo) {
        warnings.push(`Row ${rowNumber}: Transaction date is more than 2 years old`);
    }

    // Validate amounts
    if (transaction.debitAmount === 0 && transaction.creditAmount === 0) {
        errors.push(`Row ${rowNumber}: Transaction must have either debit or credit amount`);
    }

    if (transaction.debitAmount < 0) {
        errors.push(`Row ${rowNumber}: Debit amount cannot be negative`);
    }

    if (transaction.creditAmount < 0) {
        errors.push(`Row ${rowNumber}: Credit amount cannot be negative`);
    }

    // Validate description length
    if (transaction.description.length > 255) {
        warnings.push(`Row ${rowNumber}: Description is very long (${transaction.description.length} characters)`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Find duplicate transactions within the import
 */
function findDuplicateTransactions(transactions: BankTransactionImport[]): number[] {
    const duplicateIndexes: number[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        // Create a hash key for duplicate detection
        const key = `${transactions[i]?.transactionDate.toISOString().split('T')[0]}_${transactions[i]?.description}_${transactions[i]?.debitAmount}_${transactions[i]?.creditAmount}`;

        if (seen.has(key)) {
            duplicateIndexes.push(i);
        } else {
            seen.add(key);
        }
    }

    return duplicateIndexes;
}

/**
 * Auto-detect bank format from CSV headers
 */
export function detectBankFormat(csvData: string): BankFormat | null {
    try {
        // Simple CSV parsing for format detection
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;

        const detectionHeaders = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
        const detectionRecords = [{} as Record<string, string>];
        detectionHeaders.forEach(header => {
            detectionRecords[0]![header] = '';
        });

        if (detectionRecords.length === 0) {
            return null;
        }

        const detectionHeadersLower = Object.keys(detectionRecords[0]!).map(h => h.toLowerCase());

        // Try to match against known formats
        for (const [key, format] of Object.entries(BANK_FORMATS)) {
            if (key === 'GENERIC') continue; // Skip generic format in auto-detection

            const requiredColumns = [
                format.dateColumn.toLowerCase(),
                format.descriptionColumn.toLowerCase()
            ];

            if (format.debitColumn) requiredColumns.push(format.debitColumn.toLowerCase());
            if (format.creditColumn) requiredColumns.push(format.creditColumn.toLowerCase());
            if (format.amountColumn) requiredColumns.push(format.amountColumn.toLowerCase());

            const matchCount = requiredColumns.filter(col =>
                detectionHeadersLower.some(header => header.includes(col) || col.includes(header))
            ).length;

            // If most required columns match, use this format
            if (matchCount >= requiredColumns.length * 0.7) {
                return format;
            }
        }

        // Return generic format as fallback
        return BANK_FORMATS.GENERIC || null;

    } catch {
        return null;
    }
}

/**
 * Generate import batch ID
 */
export function generateImportBatchId(bankAccountId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `IMPORT-${bankAccountId.slice(-8)}-${timestamp}-${random}`;
}
