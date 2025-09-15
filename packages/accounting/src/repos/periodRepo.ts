import { z } from "zod";
import type { DbAdapter } from "@aibos/db";
import { queryTyped } from "@aibos/db";
import { PeriodRow, Period, type PeriodQuery } from "@aibos/contracts";

/**
 * List periods by company with filtering and pagination
 */
export async function listPeriodsByCompany(
    db: DbAdapter,
    args: {
        tenantId: string;
        companyId: string;
        status?: "open" | "closed" | "locked";
        limit?: number;
        offset?: number;
    }
): Promise<Period[]> {
    const rows = await queryTyped(
        () => db.select({
            table: "ref_periods",
            columns: "*",
            eq: {
                tenant_id: args.tenantId,
                company_id: args.companyId,
                ...(args.status && { status: args.status }),
            },
            limit: args.limit || 50,
            offset: args.offset || 0,
            orderBy: { column: "start_date", ascending: false },
        }),
        PeriodRow
    );

    // Transform to domain shape (camelCase)
    return rows.map(r => Period.parse(r));
}

/**
 * Get a single period by ID
 */
export async function getPeriodById(
    db: DbAdapter,
    args: {
        tenantId: string;
        companyId: string;
        periodId: string;
    }
): Promise<Period | null> {
    const rows = await queryTyped(
        () => db.select({
            table: "ref_periods",
            columns: "*",
            eq: {
                id: args.periodId,
                tenant_id: args.tenantId,
                company_id: args.companyId,
            },
            limit: 1,
        }),
        PeriodRow
    );

    if (rows.length === 0) return null;
    return Period.parse(rows[0]);
}

/**
 * Create a new period
 */
export async function createPeriod(
    db: DbAdapter,
    args: {
        tenantId: string;
        companyId: string;
        code: string;
        startDate: Date;
        endDate: Date;
        status?: "open" | "closed" | "locked";
    }
): Promise<Period> {
    const row = await db.insert({
        table: "ref_periods",
        data: {
            tenant_id: args.tenantId,
            company_id: args.companyId,
            code: args.code,
            start_date: args.startDate.toISOString(),
            end_date: args.endDate.toISOString(),
            status: args.status || "open",
            created_at: new Date().toISOString(),
        },
    });

    return Period.parse(row);
}

/**
 * Update period status
 */
export async function updatePeriodStatus(
    db: DbAdapter,
    args: {
        tenantId: string;
        companyId: string;
        periodId: string;
        status: "open" | "closed" | "locked";
    }
): Promise<Period | null> {
    const rows = await db.update({
        table: "ref_periods",
        data: {
            status: args.status,
            updated_at: new Date().toISOString(),
        },
        eq: {
            id: args.periodId,
            tenant_id: args.tenantId,
            company_id: args.companyId,
        },
    });

    if (rows.length === 0) return null;
    return Period.parse(rows[0]);
}

/**
 * Get total count of periods for pagination
 */
export async function getPeriodsCount(
    db: DbAdapter,
    args: {
        tenantId: string;
        companyId: string;
        status?: "open" | "closed" | "locked";
    }
): Promise<number> {
    // This would need a count query - for now return 0
    // In production, implement proper count query
    return 0;
}
