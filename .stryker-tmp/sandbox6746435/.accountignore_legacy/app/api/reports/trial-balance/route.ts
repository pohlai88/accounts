// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { ReportCurrencyConversionService } from "@/lib/report-currency-conversion";
import { TrialBalancePDF } from "@/components/pdf/TrialBalancePDF";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const asOfDate = searchParams.get("asOfDate");
    const currency = searchParams.get("currency") || "USD";

    if (!companyId || !asOfDate) {
      return NextResponse.json(
        { error: "Missing required parameters: companyId, asOfDate" },
        { status: 400 },
      );
    }

    // Get trial balance data using the fixed service
    const result = await ReportCurrencyConversionService.getTrialBalanceWithConversion(
      companyId,
      asOfDate,
      currency as any,
    );

    if (!result.success || !result.trialBalance) {
      return NextResponse.json(
        { error: result.error || "Failed to generate trial balance" },
        { status: 500 },
      );
    }

    // Generate PDF
    const stream = await renderToStream(TrialBalancePDF({ data: result.trialBalance }));

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TrialBalance_${asOfDate}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating trial balance PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
