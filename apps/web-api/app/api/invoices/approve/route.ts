import { NextRequest, NextResponse } from "next/server";
import {
  ApproveInvoiceReq,
  ApproveInvoiceRes,
  InvoiceApprovedEvt,
  TInvoiceApprovedEvt,
} from "@aibos/contracts";

export const runtime = "nodejs";

async function sendEvent(evt: TInvoiceApprovedEvt) {
  // Placeholder: wire to Inngest client in services/worker
  return true;
}

export async function POST(req: NextRequest) {
  const body = ApproveInvoiceReq.parse(await req.json());
  // TODO auth + RLS context
  // TODO call pure accounting logic
  await sendEvent({
    tenantId: body.tenantId,
    invoiceId: body.invoiceId,
    customerEmail: undefined,
    idemKey: body.idemKey,
  });
  return NextResponse.json(ApproveInvoiceRes.parse({ id: body.invoiceId }), { status: 200 });
}
