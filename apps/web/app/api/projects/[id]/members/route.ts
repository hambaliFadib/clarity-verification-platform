import { NextResponse } from "next/server";
import { inviteProjectMember, listProjectMembers } from "@/lib/server/qa-repository";
import { guestTeamMembers } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return NextResponse.json(guestTeamMembers());
    const members = await listProjectMembers(
      id,
      ctx.userId,
      Boolean(ctx.isGuest),
    );
    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ success: false, error: "Guest mode cannot invite members." }, { status: 403 });
    }
    const payload = await request.json();
    const member = await inviteProjectMember(id, String(payload.email || ""), ctx.userId);
    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    const message = error.message || "Unable to invite member";
    const status = message.includes("must sign in") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
