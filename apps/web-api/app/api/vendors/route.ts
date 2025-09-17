// Vendor API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Vendor creation schema
const CreateVendorSchema = z.object({
    supplierNumber: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    billingAddress: z
        .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
        })
        .optional(),
    shippingAddress: z
        .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
        })
        .optional(),
    currency: z.string().length(3).default("MYR"),
    paymentTerms: z
        .enum(["NET_15", "NET_30", "NET_45", "NET_60", "COD", "PREPAID"])
        .default("NET_30"),
    creditLimit: z.number().min(0).default(0),
    taxId: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * GET /api/vendors - Get vendors with filtering and pagination
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const context = createRequestContext(req);
        const userContext = extractUserContext(req);
        const scope = {
            tenantId: userContext.tenantId!,
            companyId: userContext.companyId!,
            userId: userContext.userId!,
            userRole: userContext.userRole!,
        };
        const { searchParams } = new URL(req.url);

        // Parse query parameters
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const currency = searchParams.get("currency");

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Build query
        let query = supabase
            .from("suppliers")
            .select("*")
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId);

        // Apply filters
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,supplier_number.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq("is_active", status === "active");
        }
        if (currency) {
            query = query.eq("currency", currency);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const {
            data: vendors,
            error,
            count,
        } = await query.range(from, to).order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch vendors: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            data: vendors || [],
            meta: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch vendors:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch vendors" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/vendors - Create new vendor
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const auditService = getAuditService();

    try {
        const context = createRequestContext(req);
        const body = CreateVendorSchema.parse(await req.json());
        const userContext = extractUserContext(req);
        const scope = {
            tenantId: userContext.tenantId!,
            companyId: userContext.companyId!,
            userId: userContext.userId!,
            userRole: userContext.userRole!,
        };

        const auditContext = createAuditContext(
            context.requestId,
            req.ip || req.headers.get("x-forwarded-for") || "unknown",
            req.headers.get("user-agent") || "unknown",
            "API",
        );

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if vendor with same supplier number already exists
        const { data: existingVendor } = await supabase
            .from("suppliers")
            .select("id")
            .eq("supplier_number", body.supplierNumber)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (existingVendor) {
            return NextResponse.json(
                { success: false, error: "Vendor with this supplier number already exists" },
                { status: 409 },
            );
        }

        // Check if vendor with same email already exists (if email provided)
        if (body.email) {
            const { data: existingEmailVendor } = await supabase
                .from("suppliers")
                .select("id")
                .eq("email", body.email)
                .eq("tenant_id", scope.tenantId)
                .eq("company_id", scope.companyId)
                .single();

            if (existingEmailVendor) {
                return NextResponse.json(
                    { success: false, error: "Vendor with this email already exists" },
                    { status: 409 },
                );
            }
        }

        // Create vendor
        const { data: vendor, error } = await supabase
            .from("suppliers")
            .insert({
                tenant_id: scope.tenantId,
                company_id: scope.companyId,
                supplier_number: body.supplierNumber,
                name: body.name,
                email: body.email,
                phone: body.phone,
                billing_address: body.billingAddress,
                shipping_address: body.shippingAddress,
                currency: body.currency,
                payment_terms: body.paymentTerms,
                credit_limit: body.creditLimit,
                tax_id: body.taxId,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create vendor: ${error.message}`);
        }

        // Log successful vendor creation
        await auditService.logOperation({
            scope,
            action: "CREATE",
            entityType: "CUSTOMER",
            entityId: vendor.id,
            metadata: {
                vendorName: vendor.name,
                supplierNumber: vendor.supplier_number,
                email: vendor.email,
            },
            context: auditContext,
        });

        return NextResponse.json(
            {
                success: true,
                data: vendor,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Vendor creation error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Invalid vendor data", details: error.issues },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to create vendor" },
            { status: 500 },
        );
    }
}
