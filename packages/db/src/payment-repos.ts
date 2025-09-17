// Enhanced Payment Processing Repository Functions
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
    customers,
    suppliers,
    bankAccounts,
    advanceAccounts,
    bankChargeConfigs,
    withholdingTaxConfigs
} from "./schema.js";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const pool = new Pool({ connectionString });
    _db = drizzle(pool);
  }
  return _db;
}
import { eq, and, sql } from "drizzle-orm";

export interface CustomerInfo {
    id: string;
    currency: string;
    name: string;
    email?: string | null;
}

export interface SupplierInfo {
    id: string;
    currency: string;
    name: string;
    email?: string | null;
}

export interface BankAccountInfo {
    id: string;
    currency: string;
    accountNumber: string;
    accountName: string;
}

export interface AdvanceAccountInfo {
    id: string;
    accountId: string;
    partyType: 'CUSTOMER' | 'SUPPLIER';
    partyId: string;
    currency: string;
    balanceAmount: number;
}

export interface BankChargeConfig {
    id: string;
    chargeType: 'FIXED' | 'PERCENTAGE' | 'TIERED';
    fixedAmount?: number;
    percentageRate?: number;
    minAmount: number;
    maxAmount?: number;
    expenseAccountId: string;
}

export interface WithholdingTaxConfig {
    id: string;
    taxCode: string;
    taxName: string;
    taxRate: number;
    payableAccountId: string;
    expenseAccountId: string;
    applicableTo: 'SUPPLIERS' | 'CUSTOMERS' | 'BOTH';
    minThreshold: number;
}

/**
 * Get customer information with currency
 */
export async function getCustomerById(
    tenantId: string,
    companyId: string,
    customerId: string
): Promise<CustomerInfo | null> {
    const db = getDb();
    const result = await db
        .select({
            id: customers.id,
            currency: customers.currency,
            name: customers.name,
            email: customers.email,
        })
        .from(customers)
        .where(
            and(
                eq(customers.tenantId, tenantId),
                eq(customers.companyId, companyId),
                eq(customers.id, customerId)
            )
        )
        .limit(1);

    return result[0] || null;
}

/**
 * Get supplier information with currency
 */
export async function getSupplierById(
    tenantId: string,
    companyId: string,
    supplierId: string
): Promise<SupplierInfo | null> {
    const db = getDb();
    const result = await db
        .select({
            id: suppliers.id,
            currency: suppliers.currency,
            name: suppliers.name,
            email: suppliers.email,
        })
        .from(suppliers)
        .where(
            and(
                eq(suppliers.tenantId, tenantId),
                eq(suppliers.companyId, companyId),
                eq(suppliers.id, supplierId)
            )
        )
        .limit(1);

    return result[0] || null;
}

/**
 * Get bank account information with currency
 */
export async function getBankAccountById(
    tenantId: string,
    companyId: string,
    bankAccountId: string
): Promise<BankAccountInfo | null> {
    const db = getDb();
    const result = await db
        .select({
            id: bankAccounts.id,
            currency: bankAccounts.currency,
            accountNumber: bankAccounts.accountNumber,
            accountName: bankAccounts.accountName,
        })
        .from(bankAccounts)
        .where(
            and(
                eq(bankAccounts.tenantId, tenantId),
                eq(bankAccounts.companyId, companyId),
                eq(bankAccounts.id, bankAccountId)
            )
        )
        .limit(1);

    return result[0] || null;
}

/**
 * Get or create advance account for overpayment handling
 */
export async function getOrCreateAdvanceAccount(
    tenantId: string,
    companyId: string,
    partyType: 'CUSTOMER' | 'SUPPLIER',
    partyId: string,
    currency: string,
    advanceAccountId: string
): Promise<AdvanceAccountInfo> {
    const db = getDb();
    // Try to get existing advance account
    const existing = await db
        .select()
        .from(advanceAccounts)
        .where(
            and(
                eq(advanceAccounts.tenantId, tenantId),
                eq(advanceAccounts.companyId, companyId),
                eq(advanceAccounts.partyType, partyType),
                eq(advanceAccounts.partyId, partyId),
                eq(advanceAccounts.currency, currency)
            )
        )
        .limit(1);

    if (existing[0]) {
        return {
            id: existing[0].id,
            accountId: existing[0].accountId,
            partyType: existing[0].partyType,
            partyId: existing[0].partyId,
            currency: existing[0].currency,
            balanceAmount: Number(existing[0].balanceAmount),
        };
    }

    // Create new advance account
    const [newAccount] = await db
        .insert(advanceAccounts)
        .values({
            tenantId,
            companyId,
            accountId: advanceAccountId,
            partyType,
            partyId,
            currency,
            balanceAmount: "0",
        })
        .returning();

    if (!newAccount) {
        throw new Error("Failed to create advance account");
    }

    return {
        id: newAccount.id,
        accountId: newAccount.accountId,
        partyType: newAccount.partyType,
        partyId: newAccount.partyId,
        currency: newAccount.currency,
        balanceAmount: Number(newAccount.balanceAmount),
    };
}

/**
 * Get bank charge configuration for a bank account
 */
export async function getBankChargeConfig(
    tenantId: string,
    companyId: string,
    bankAccountId: string
): Promise<BankChargeConfig | null> {
    const db = getDb();
    const result = await db
        .select({
            id: bankChargeConfigs.id,
            chargeType: bankChargeConfigs.chargeType,
            fixedAmount: bankChargeConfigs.fixedAmount,
            percentageRate: bankChargeConfigs.percentageRate,
            minAmount: bankChargeConfigs.minAmount,
            maxAmount: bankChargeConfigs.maxAmount,
            expenseAccountId: bankChargeConfigs.expenseAccountId,
        })
        .from(bankChargeConfigs)
        .where(
            and(
                eq(bankChargeConfigs.tenantId, tenantId),
                eq(bankChargeConfigs.companyId, companyId),
                eq(bankChargeConfigs.bankAccountId, bankAccountId),
                eq(bankChargeConfigs.isActive, true)
            )
        )
        .limit(1);

    if (!result[0]) return null;

    return {
        id: result[0].id,
        chargeType: result[0].chargeType as 'FIXED' | 'PERCENTAGE' | 'TIERED',
        fixedAmount: result[0].fixedAmount ? Number(result[0].fixedAmount) : undefined,
        percentageRate: result[0].percentageRate ? Number(result[0].percentageRate) : undefined,
        minAmount: Number(result[0].minAmount),
        maxAmount: result[0].maxAmount ? Number(result[0].maxAmount) : undefined,
        expenseAccountId: result[0].expenseAccountId,
    };
}

/**
 * Get withholding tax configuration
 */
export async function getWithholdingTaxConfig(
    tenantId: string,
    companyId: string,
    applicableTo: 'SUPPLIERS' | 'CUSTOMERS' | 'BOTH'
): Promise<WithholdingTaxConfig[]> {
    const db = getDb();
    const result = await db
        .select({
            id: withholdingTaxConfigs.id,
            taxCode: withholdingTaxConfigs.taxCode,
            taxName: withholdingTaxConfigs.taxName,
            taxRate: withholdingTaxConfigs.taxRate,
            payableAccountId: withholdingTaxConfigs.payableAccountId,
            expenseAccountId: withholdingTaxConfigs.expenseAccountId,
            applicableTo: withholdingTaxConfigs.applicableTo,
            minThreshold: withholdingTaxConfigs.minThreshold,
        })
        .from(withholdingTaxConfigs)
        .where(
            and(
                eq(withholdingTaxConfigs.tenantId, tenantId),
                eq(withholdingTaxConfigs.companyId, companyId),
                eq(withholdingTaxConfigs.isActive, true)
            )
        );

    return result.map(row => ({
        id: row.id,
        taxCode: row.taxCode,
        taxName: row.taxName,
        taxRate: Number(row.taxRate),
        payableAccountId: row.payableAccountId,
        expenseAccountId: row.expenseAccountId,
        applicableTo: row.applicableTo as 'SUPPLIERS' | 'CUSTOMERS' | 'BOTH',
        minThreshold: Number(row.minThreshold),
    }));
}

/**
 * Calculate bank charges for a payment
 */
export async function calculateBankCharges(
    tenantId: string,
    companyId: string,
    bankAccountId: string,
    paymentAmount: number
): Promise<{ accountId: string; amount: number; description: string }[]> {
    const config = await getBankChargeConfig(tenantId, companyId, bankAccountId);

    if (!config) return [];

    let chargeAmount = 0;
    let description = '';

    switch (config.chargeType) {
        case 'FIXED':
            chargeAmount = config.fixedAmount || 0;
            description = `Bank charge (fixed)`;
            break;
        case 'PERCENTAGE':
            chargeAmount = paymentAmount * (config.percentageRate || 0);
            description = `Bank charge (${((config.percentageRate || 0) * 100).toFixed(2)}%)`;
            break;
        case 'TIERED':
            // Implement tiered logic based on amount ranges
            chargeAmount = config.fixedAmount || 0; // Simplified for now
            description = `Bank charge (tiered)`;
            break;
    }

    // Apply min/max limits
    if (config.minAmount && chargeAmount < config.minAmount) {
        chargeAmount = config.minAmount;
    }
    if (config.maxAmount && chargeAmount > config.maxAmount) {
        chargeAmount = config.maxAmount;
    }

    if (chargeAmount <= 0) return [];

    return [{
        accountId: config.expenseAccountId,
        amount: chargeAmount,
        description,
    }];
}

/**
 * Calculate withholding tax for a payment
 */
export async function calculateWithholdingTax(
    tenantId: string,
    companyId: string,
    paymentAmount: number,
    partyType: 'CUSTOMER' | 'SUPPLIER'
): Promise<{ accountId: string; amount: number; description: string }[]> {
    const configs = await getWithholdingTaxConfig(
        tenantId,
        companyId,
        partyType === 'CUSTOMER' ? 'CUSTOMERS' : 'SUPPLIERS'
    );

    const charges: { accountId: string; amount: number; description: string }[] = [];

    for (const config of configs) {
        if (paymentAmount < config.minThreshold) continue;

        const taxAmount = paymentAmount * config.taxRate;

        charges.push({
            accountId: config.expenseAccountId,
            amount: taxAmount,
            description: `${config.taxName} (${(config.taxRate * 100).toFixed(1)}%)`,
        });
    }

    return charges;
}

/**
 * Update advance account balance
 */
export async function updateAdvanceAccountBalance(
    tenantId: string,
    companyId: string,
    partyType: 'CUSTOMER' | 'SUPPLIER',
    partyId: string,
    currency: string,
    amountChange: number
): Promise<void> {
    const db = getDb();
    await db
        .update(advanceAccounts)
        .set({
            balanceAmount: sql`balance_amount + ${amountChange}`,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(advanceAccounts.tenantId, tenantId),
                eq(advanceAccounts.companyId, companyId),
                eq(advanceAccounts.partyType, partyType),
                eq(advanceAccounts.partyId, partyId),
                eq(advanceAccounts.currency, currency)
            )
        );
}
