// Customer API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService } from "@aibos/utils";
import { createAuditContext } from "@aibos/utils/audit/service";
import { z } from "zod";

// Customer creation schema
const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.number().min(0).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/customers - Get customers with filtering and pagination
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

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", scope.tenantId)
      .eq("company_id", scope.companyId);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: customers,
      error,
      count,
    } = await query.range(from, to).order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: customers || [],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/customers - Create new customer
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auditService = getAuditService();

  try {
    const context = createRequestContext(req);
    const body = CreateCustomerSchema.parse(await req.json());
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

    // Check if customer with same email already exists
    if (body.email) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", body.email)
        .eq("tenant_id", scope.tenantId)
        .eq("company_id", scope.companyId)
        .single();

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: "Customer with this email already exists" },
          { status: 409 },
        );
      }
    }

    // Create customer
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: scope.tenantId,
        company_id: scope.companyId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        tax_id: body.taxId,
        credit_limit: body.creditLimit || 0,
        payment_terms: body.paymentTerms || 30,
        notes: body.notes,
        status: "active",
        created_by: scope.userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    // Log successful customer creation
    await auditService.logOperation({
      scope,
      action: "CREATE",
      entityType: "CUSTOMER",
      entityId: customer.id,
      metadata: {
        customerName: customer.name,
        email: customer.email,
      },
      context: auditContext,
    });

    return NextResponse.json(
      {
        success: true,
        data: customer,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Customer creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid customer data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
