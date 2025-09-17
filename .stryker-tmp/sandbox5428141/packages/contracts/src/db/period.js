// @ts-nocheck
import { z } from "zod";
/**
 * Period Database Row Schema - Raw database structure (snake_case)
 */
export const PeriodRow = z.object({
    id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    company_id: z.string().uuid(),
    code: z.string(), // e.g. "2025-08"
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    status: z.enum(["open", "closed", "locked"]),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date().optional(),
});
/**
 * Period Domain Schema - Business logic structure (camelCase)
 */
export const Period = PeriodRow.transform(r => ({
    id: r.id,
    tenantId: r.tenant_id,
    companyId: r.company_id,
    code: r.code,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? null,
}));
/**
 * Period Query Schema
 */
export const PeriodQuerySchema = z.object({
    tenantId: z.string().uuid(),
    companyId: z.string().uuid(),
    status: z.enum(["open", "closed", "locked"]).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
});
/**
 * Period Response Schema
 */
export const PeriodResponseSchema = z.object({
    periods: z.array(Period),
    totalCount: z.number().int().min(0),
    hasMore: z.boolean(),
});
