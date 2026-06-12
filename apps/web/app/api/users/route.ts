import { NextResponse } from "next/server";
import { getAccessibleProjectIds, listProjectMembers } from "@/lib/server/qa-repository";
import { guestTeamMembers } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return NextResponse.json(guestTeamMembers());
    const [projectId] = await getAccessibleProjectIds(ctx);
    if (!projectId) return NextResponse.json([]);
    return NextResponse.json(await listProjectMembers(projectId, ctx.userId, Boolean(ctx.isGuest)));
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

