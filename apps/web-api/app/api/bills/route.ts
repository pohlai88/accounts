// Bill API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Bill line item schema
const BillLineSchema = z.object({
    lineNumber: z.number().int().positive(),
    description: z.string().min(1).max(500),
    quantity: z.number().positive().default(1),
    unitPrice: z.number().nonnegative(),
    taxCode: z.string().optional(),
    taxRate: z.number().min(0).max(1).default(0),
    expenseAccountId: z.string().uuid(),
});

// Bill creation schema
const CreateBillSchema = z.object({
    supplierId: z.string().uuid(),
    billNumber: z.string().min(1).max(50),
    supplierInvoiceNumber: z.string().optional(),
    billDate: z.string().date(),
    dueDate: z.string().date(),
    currency: z.string().length(3).default("MYR"),
    exchangeRate: z.number().positive().default(1),
    description: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(BillLineSchema).min(1).max(100),
});

/**
 * GET /api/bills - Get bills with filtering and pagination
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
        const supplierId = searchParams.get("supplierId");
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Build query with supplier join
        let query = supabase
            .from("ap_bills")
            .select(`
        *,
        suppliers!ap_bills_supplier_id_fkey (
          id,
          name,
          supplier_number
        )
      `)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId);

        // Apply filters
        if (search) {
            query = query.or(`bill_number.ilike.%${search}%,supplier_invoice_number.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq("status", status);
        }
        if (supplierId) {
            query = query.eq("supplier_id", supplierId);
        }
        if (fromDate) {
            query = query.gte("bill_date", fromDate);
        }
        if (toDate) {
            query = query.lte("bill_date", toDate);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const {
            data: bills,
            error,
            count,
        } = await query.range(from, to).order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch bills: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            data: bills || [],
            meta: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch bills:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch bills" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/bills - Create new bill
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const auditService = getAuditService();

    try {
        const context = createRequestContext(req);
        const body = CreateBillSchema.parse(await req.json());
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

        // Verify supplier exists
        const { data: supplier, error: supplierError } = await supabase
            .from("suppliers")
            .select("id, name, supplier_number")
            .eq("id", body.supplierId)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (supplierError || !supplier) {
            return NextResponse.json(
                { success: false, error: "Supplier not found" },
                { status: 404 },
            );
        }

        // Check if bill with same bill number already exists
        const { data: existingBill } = await supabase
            .from("ap_bills")
            .select("id")
            .eq("bill_number", body.billNumber)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (existingBill) {
            return NextResponse.json(
                { success: false, error: "Bill with this number already exists" },
                { status: 409 },
            );
        }

        // Calculate totals
        const subtotal = body.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
        const taxAmount = body.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice * line.taxRate), 0);
        const totalAmount = subtotal + taxAmount;

        // Create bill
        const { data: bill, error: billError } = await supabase
            .from("ap_bills")
            .insert({
                tenant_id: scope.tenantId,
                company_id: scope.companyId,
                supplier_id: body.supplierId,
                bill_number: body.billNumber,
                supplier_invoice_number: body.supplierInvoiceNumber,
                bill_date: body.billDate,
                due_date: body.dueDate,
                currency: body.currency,
                exchange_rate: body.exchangeRate,
                subtotal: subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                paid_amount: 0,
                balance_amount: totalAmount,
                status: "draft",
                description: body.description,
                notes: body.notes,
                created_by: scope.userId,
            })
            .select()
            .single();

        if (billError) {
            throw new Error(`Failed to create bill: ${billError.message}`);
        }

        // Create bill lines
        const billLines = body.lines.map(line => ({
            bill_id: bill.id,
            line_number: line.lineNumber,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            line_amount: line.quantity * line.unitPrice,
            tax_code: line.taxCode,
            tax_rate: line.taxRate,
            tax_amount: line.quantity * line.unitPrice * line.taxRate,
            expense_account_id: line.expenseAccountId,
        }));

        const { error: linesError } = await supabase
            .from("ap_bill_lines")
            .insert(billLines);

        if (linesError) {
            // Rollback bill creation if lines fail
            await supabase.from("ap_bills").delete().eq("id", bill.id);
            throw new Error(`Failed to create bill lines: ${linesError.message}`);
        }

        // Log successful bill creation
        await auditService.logOperation({
            scope,
            action: "CREATE",
            entityType: "INVOICE",
            entityId: bill.id,
            metadata: {
                billNumber: bill.bill_number,
                supplierId: body.supplierId,
                supplierName: supplier.name,
                totalAmount: totalAmount,
                status: "draft",
            },
            context: auditContext,
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    ...bill,
                    supplier: supplier,
                    lines: billLines,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Bill creation error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Invalid bill data", details: error.issues },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to create bill" },
            { status: 500 },
        );
    }
}
