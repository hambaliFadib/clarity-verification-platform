import { NextResponse } from "next/server";
import { guestAuditTrail } from "@/lib/server/guest-fixtures";
import { listApprovalAuditTrail } from "@/lib/server/approval-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json(guestAuditTrail(
        searchParams.get("entity_type") || undefined,
        searchParams.get("entity_id") || undefined,
      ));
    }
    return NextResponse.json(await listApprovalAuditTrail(searchParams, ctx));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Approval gate mutations are locked until RBAC approval enforcement is implemented.",
    },
    { status: 403 },
  );
}
