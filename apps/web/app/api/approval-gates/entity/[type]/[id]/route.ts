import { NextResponse } from "next/server";
import { guestApprovalGates } from "@/lib/server/guest-fixtures";
import { listApprovalGatesForEntity } from "@/lib/server/approval-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ type: string; id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { type, id } = await context.params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json(guestApprovalGates(type, id));
    }
    return NextResponse.json(await listApprovalGatesForEntity(type, id, ctx));
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
