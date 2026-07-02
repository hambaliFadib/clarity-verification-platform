import { NextResponse } from "next/server";
import { getAccessibleProjectIds, listProjectMembers, inviteProjectMember } from "@/lib/server/qa-repository";
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

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const { email } = await request.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    if (isGuestContext(ctx)) {
      const cleanEmail = email.trim();
      const namePart = cleanEmail.split("@")[0];
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const initials = namePart.slice(0, 2).toUpperCase();
      return NextResponse.json({
        id: `guest-invited-${Date.now()}`,
        name,
        email: cleanEmail,
        role: "Contributor",
        initials,
      });
    }

    const [projectId] = await getAccessibleProjectIds(ctx);
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    const invitedMember = await inviteProjectMember(projectId, email, ctx.userId);
    return NextResponse.json(invitedMember);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Unable to invite user." },
      { status: 500 }
    );
  }
}


