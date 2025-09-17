// Payment API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Payment allocation schema
const PaymentAllocationSchema = z.object({
    billId: z.string().uuid().optional(),
    invoiceId: z.string().uuid().optional(),
    allocatedAmount: z.number().positive(),
});

// Payment creation schema
const CreatePaymentSchema = z.object({
    paymentNumber: z.string().min(1).max(50),
    paymentDate: z.string().date(),
    paymentMethod: z.enum(["CASH", "CHECK", "WIRE_TRANSFER", "CREDIT_CARD", "ACH", "OTHER"]),
    bankAccountId: z.string().uuid(),
    supplierId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    currency: z.string().length(3).default("MYR"),
    exchangeRate: z.number().positive().default(1),
    amount: z.number().positive(),
    reference: z.string().optional(),
    description: z.string().optional(),
    allocations: z.array(PaymentAllocationSchema).optional(),
});

/**
 * GET /api/payments - Get payments with filtering and pagination
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
        const paymentMethod = searchParams.get("paymentMethod");
        const supplierId = searchParams.get("supplierId");
        const customerId = searchParams.get("customerId");
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Build query with joins
        let query = supabase
            .from("payments")
            .select(`
        *,
        suppliers!payments_supplier_id_fkey (
          id,
          name,
          supplier_number
        ),
        customers!payments_customer_id_fkey (
          id,
          name,
          customer_number
        ),
        bank_accounts!payments_bank_account_id_fkey (
          id,
          account_name,
          bank_name,
          account_number
        )
      `)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId);

        // Apply filters
        if (search) {
            query = query.or(`payment_number.ilike.%${search}%,reference.ilike.%${search}%,description.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq("status", status);
        }
        if (paymentMethod) {
            query = query.eq("payment_method", paymentMethod);
        }
        if (supplierId) {
            query = query.eq("supplier_id", supplierId);
        }
        if (customerId) {
            query = query.eq("customer_id", customerId);
        }
        if (fromDate) {
            query = query.gte("payment_date", fromDate);
        }
        if (toDate) {
            query = query.lte("payment_date", toDate);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const {
            data: payments,
            error,
            count,
        } = await query.range(from, to).order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch payments: ${error.message}`);
        }

        return NextResponse.json({
            success: true,
            data: payments || [],
            meta: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch payments:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch payments" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/payments - Create new payment
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    const auditService = getAuditService();

    try {
        const context = createRequestContext(req);
        const body = CreatePaymentSchema.parse(await req.json());
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

        // Verify bank account exists
        const { data: bankAccount, error: bankAccountError } = await supabase
            .from("bank_accounts")
            .select("id, account_name, bank_name, account_number")
            .eq("id", body.bankAccountId)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (bankAccountError || !bankAccount) {
            return NextResponse.json(
                { success: false, error: "Bank account not found" },
                { status: 404 },
            );
        }

        // Verify supplier exists (if provided)
        if (body.supplierId) {
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
        }

        // Verify customer exists (if provided)
        if (body.customerId) {
            const { data: customer, error: customerError } = await supabase
                .from("customers")
                .select("id, name, customer_number")
                .eq("id", body.customerId)
                .eq("tenant_id", scope.tenantId)
                .eq("company_id", scope.companyId)
                .single();

            if (customerError || !customer) {
                return NextResponse.json(
                    { success: false, error: "Customer not found" },
                    { status: 404 },
                );
            }
        }

        // Check if payment with same payment number already exists
        const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("payment_number", body.paymentNumber)
            .eq("tenant_id", scope.tenantId)
            .eq("company_id", scope.companyId)
            .single();

        if (existingPayment) {
            return NextResponse.json(
                { success: false, error: "Payment with this number already exists" },
                { status: 409 },
            );
        }

        // Validate allocations if provided
        if (body.allocations && body.allocations.length > 0) {
            const totalAllocated = body.allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
            if (Math.abs(totalAllocated - body.amount) > 0.01) {
                return NextResponse.json(
                    { success: false, error: "Total allocated amount must equal payment amount" },
                    { status: 400 },
                );
            }
        }

        // Create payment
        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .insert({
                tenant_id: scope.tenantId,
                company_id: scope.companyId,
                payment_number: body.paymentNumber,
                payment_date: body.paymentDate,
                payment_method: body.paymentMethod,
                bank_account_id: body.bankAccountId,
                supplier_id: body.supplierId,
                customer_id: body.customerId,
                currency: body.currency,
                exchange_rate: body.exchangeRate,
                amount: body.amount,
                reference: body.reference,
                description: body.description,
                status: "draft",
                created_by: scope.userId,
            })
            .select()
            .single();

        if (paymentError) {
            throw new Error(`Failed to create payment: ${paymentError.message}`);
        }

        // Create payment allocations if provided
        if (body.allocations && body.allocations.length > 0) {
            const allocations = body.allocations.map(alloc => ({
                payment_id: payment.id,
                bill_id: alloc.billId,
                invoice_id: alloc.invoiceId,
                allocated_amount: alloc.allocatedAmount,
            }));

            const { error: allocationsError } = await supabase
                .from("payment_allocations")
                .insert(allocations);

            if (allocationsError) {
                // Rollback payment creation if allocations fail
                await supabase.from("payments").delete().eq("id", payment.id);
                throw new Error(`Failed to create payment allocations: ${allocationsError.message}`);
            }
        }

        // Log successful payment creation
        await auditService.logOperation({
            scope,
            action: "CREATE",
            entityType: "PAYMENT",
            entityId: payment.id,
            metadata: {
                paymentNumber: payment.payment_number,
                amount: payment.amount,
                currency: payment.currency,
                paymentMethod: payment.payment_method,
                supplierId: body.supplierId,
                customerId: body.customerId,
                status: "draft",
            },
            context: auditContext,
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    ...payment,
                    bankAccount: bankAccount,
                    allocations: body.allocations || [],
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Payment creation error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Invalid payment data", details: error.issues },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to create payment" },
            { status: 500 },
        );
    }
}
