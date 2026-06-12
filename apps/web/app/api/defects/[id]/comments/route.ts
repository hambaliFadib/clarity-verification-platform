import { NextResponse } from "next/server";
import { createDefectComment } from "@/lib/server/qa-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({
        id: `guest-comment-${Date.now()}`,
        author: "Guest User",
        initials: "GU",
        text: (await request.json()).text,
        timestamp: new Date().toISOString(),
      }, { status: 201 });
    }
    const payload = await request.json();
    const comment = await createDefectComment(id, payload, ctx);
    if (!comment) {
      return NextResponse.json({ success: false, error: "Defect not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
