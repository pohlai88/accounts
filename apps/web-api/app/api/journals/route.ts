// Journal API - GET and POST endpoints
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequestContext, extractUserContext } from "@aibos/utils";
import { getAuditService, createAuditContext } from "@aibos/utils";
import { z } from "zod";

// Journal creation schema
const CreateJournalSchema = z.object({
  journalNumber: z.string().min(1),
  journalDate: z.string(),
  description: z.string().optional(),
  reference: z.string().optional(),
  lines: z
    .array(
      z.object({
        accountId: z.string(),
        description: z.string(),
        debit: z.number().min(0).optional(),
        credit: z.number().min(0).optional(),
      }),
    )
    .min(1),
});

/**
 * GET /api/journals - Get journals with filtering and pagination
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const context = createRequestContext(req);
    const scope = extractUserContext(req);
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const status = searchParams.get("status");

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from("gl_journals")
      .select(
        `
        *,
        gl_journal_lines (
          id,
          account_id,
          description,
          debit,
          credit
        )
      `,
      )
      .eq("tenant_id", scope.tenantId)
      .eq("company_id", scope.companyId);

    // Apply filters
    if (fromDate) {
      query = query.gte("journal_date", fromDate);
    }
    if (toDate) {
      query = query.lte("journal_date", toDate);
    }
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const {
      data: journals,
      error,
      count,
    } = await query.range(from, to).order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch journals: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: journals || [],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch journals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch journals" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/journals - Create new journal
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auditService = getAuditService();

  try {
    const context = createRequestContext(req);
    const body = CreateJournalSchema.parse(await req.json());
    const scope = extractUserContext(req);

    const auditContext = createAuditContext(
      context.request_id,
      req.ip || req.headers.get("x-forwarded-for") || "unknown",
      req.headers.get("user-agent") || "unknown",
      "API",
    );

    // Validate journal lines (debits must equal credits)
    const totalDebits = body.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = body.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: "Journal lines must balance (total debits must equal total credits)",
        },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if journal number already exists
    const { data: existingJournal } = await supabase
      .from("gl_journals")
      .select("id")
      .eq("journal_number", body.journalNumber)
      .eq("tenant_id", scope.tenantId)
      .eq("company_id", scope.companyId)
      .single();

    if (existingJournal) {
      return NextResponse.json(
        { success: false, error: "Journal number already exists" },
        { status: 409 },
      );
    }

    // Create journal
    const { data: journal, error: journalError } = await supabase
      .from("gl_journals")
      .insert({
        tenant_id: scope.tenantId,
        company_id: scope.companyId,
        journal_number: body.journalNumber,
        journal_date: body.journalDate,
        description: body.description,
        reference: body.reference,
        status: "draft",
        total_debits: totalDebits,
        total_credits: totalCredits,
        created_by: scope.userId,
      })
      .select()
      .single();

    if (journalError) {
      throw new Error(`Failed to create journal: ${journalError.message}`);
    }

    // Create journal lines
    const journalLines = body.lines.map(line => ({
      journal_id: journal.id,
      tenant_id: scope.tenantId,
      company_id: scope.companyId,
      account_id: line.accountId,
      description: line.description,
      debit: line.debit || 0,
      credit: line.credit || 0,
    }));

    const { error: linesError } = await supabase.from("gl_journal_lines").insert(journalLines);

    if (linesError) {
      // Rollback journal creation
      await supabase.from("gl_journals").delete().eq("id", journal.id);

      throw new Error(`Failed to create journal lines: ${linesError.message}`);
    }

    // Log successful journal creation
    await auditService.logOperation({
      scope,
      action: "CREATE",
      entityType: "JOURNAL",
      entityId: journal.id,
      metadata: {
        journalNumber: journal.journal_number,
        totalDebits,
        totalCredits,
        lineCount: body.lines.length,
      },
      context: auditContext,
    });

    // Fetch the complete journal with lines
    const { data: completeJournal } = await supabase
      .from("gl_journals")
      .select(
        `
        *,
        gl_journal_lines (
          id,
          account_id,
          description,
          debit,
          credit
        )
      `,
      )
      .eq("id", journal.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: completeJournal,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Journal creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid journal data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create journal" },
      { status: 500 },
    );
  }
}
