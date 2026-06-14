import { NextResponse } from "next/server";
import { createRequirementComment, listRequirementComments } from "@/lib/server/qa-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return NextResponse.json([]);
    const { id } = await context.params;
    const comments = await listRequirementComments(id, ctx);
    return comments
      ? NextResponse.json(comments)
      : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;
    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content) {
      return NextResponse.json({ success: false, error: "content is required" }, { status: 400 });
    }
    if (isGuestContext(ctx)) {
      return NextResponse.json({
        id: `guest-comment-${Date.now()}`,
        userId: "guest-user",
        userName: "Guest User",
        content,
        createdAt: new Date().toISOString(),
      }, { status: 201 });
    }
    const comment = await createRequirementComment(id, content, ctx);
    return comment
      ? NextResponse.json(comment, { status: 201 })
      : NextResponse.json({ success: false, error: "Requirement not found or user is not signed in" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
