import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inviteProjectMember, listProjectMembers } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const members = await listProjectMembers(
      id,
      (session?.user as any)?.id,
      Boolean((session?.user as any)?.isGuest),
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
    const session = await getServerSession(authOptions);
    const payload = await request.json();
    const member = await inviteProjectMember(id, String(payload.email || ""), (session?.user as any)?.id);
    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    const message = error.message || "Unable to invite member";
    const status = message.includes("must sign in") ? 404 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
