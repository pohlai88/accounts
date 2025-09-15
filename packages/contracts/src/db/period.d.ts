import { z } from "zod";
/**
 * Period Database Row Schema - Raw database structure (snake_case)
 */
export declare const PeriodRow: z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    company_id: z.ZodString;
    code: z.ZodString;
    start_date: z.ZodDate;
    end_date: z.ZodDate;
    status: z.ZodEnum<["open", "closed", "locked"]>;
    created_at: z.ZodDate;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    code: string;
    status: "open" | "closed" | "locked";
    id: string;
    tenant_id: string;
    company_id: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at?: Date | undefined;
}, {
    code: string;
    status: "open" | "closed" | "locked";
    id: string;
    tenant_id: string;
    company_id: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at?: Date | undefined;
}>;
export type PeriodRow = z.infer<typeof PeriodRow>;
/**
 * Period Domain Schema - Business logic structure (camelCase)
 */
export declare const Period: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    tenant_id: z.ZodString;
    company_id: z.ZodString;
    code: z.ZodString;
    start_date: z.ZodDate;
    end_date: z.ZodDate;
    status: z.ZodEnum<["open", "closed", "locked"]>;
    created_at: z.ZodDate;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    code: string;
    status: "open" | "closed" | "locked";
    id: string;
    tenant_id: string;
    company_id: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at?: Date | undefined;
}, {
    code: string;
    status: "open" | "closed" | "locked";
    id: string;
    tenant_id: string;
    company_id: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at?: Date | undefined;
}>, {
    id: string;
    tenantId: string;
    companyId: string;
    code: string;
    startDate: Date;
    endDate: Date;
    status: "open" | "closed" | "locked";
    createdAt: Date;
    updatedAt: Date | null;
}, {
    code: string;
    status: "open" | "closed" | "locked";
    id: string;
    tenant_id: string;
    company_id: string;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    updated_at?: Date | undefined;
}>;
export type Period = z.infer<typeof Period>;
/**
 * Period Query Schema
 */
export declare const PeriodQuerySchema: z.ZodObject<{
    tenantId: z.ZodString;
    companyId: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["open", "closed", "locked"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    companyId: string;
    limit: number;
    offset: number;
    status?: "open" | "closed" | "locked" | undefined;
}, {
    tenantId: string;
    companyId: string;
    status?: "open" | "closed" | "locked" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type PeriodQuery = z.infer<typeof PeriodQuerySchema>;
/**
 * Period Response Schema
 */
export declare const PeriodResponseSchema: z.ZodObject<{
    periods: z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        tenant_id: z.ZodString;
        company_id: z.ZodString;
        code: z.ZodString;
        start_date: z.ZodDate;
        end_date: z.ZodDate;
        status: z.ZodEnum<["open", "closed", "locked"]>;
        created_at: z.ZodDate;
        updated_at: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        status: "open" | "closed" | "locked";
        id: string;
        tenant_id: string;
        company_id: string;
        start_date: Date;
        end_date: Date;
        created_at: Date;
        updated_at?: Date | undefined;
    }, {
        code: string;
        status: "open" | "closed" | "locked";
        id: string;
        tenant_id: string;
        company_id: string;
        start_date: Date;
        end_date: Date;
        created_at: Date;
        updated_at?: Date | undefined;
    }>, {
        id: string;
        tenantId: string;
        companyId: string;
        code: string;
        startDate: Date;
        endDate: Date;
        status: "open" | "closed" | "locked";
        createdAt: Date;
        updatedAt: Date | null;
    }, {
        code: string;
        status: "open" | "closed" | "locked";
        id: string;
        tenant_id: string;
        company_id: string;
        start_date: Date;
        end_date: Date;
        created_at: Date;
        updated_at?: Date | undefined;
    }>, "many">;
    totalCount: z.ZodNumber;
    hasMore: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    periods: {
        id: string;
        tenantId: string;
        companyId: string;
        code: string;
        startDate: Date;
        endDate: Date;
        status: "open" | "closed" | "locked";
        createdAt: Date;
        updatedAt: Date | null;
    }[];
    totalCount: number;
    hasMore: boolean;
}, {
    periods: {
        code: string;
        status: "open" | "closed" | "locked";
        id: string;
        tenant_id: string;
        company_id: string;
        start_date: Date;
        end_date: Date;
        created_at: Date;
        updated_at?: Date | undefined;
    }[];
    totalCount: number;
    hasMore: boolean;
}>;
export type PeriodResponse = z.infer<typeof PeriodResponseSchema>;
//# sourceMappingURL=period.d.ts.map