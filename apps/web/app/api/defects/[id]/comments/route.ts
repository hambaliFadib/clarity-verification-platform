import { NextResponse } from "next/server";
import { createDefectComment } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const comment = await createDefectComment(id, payload);
    if (!comment) {
      return NextResponse.json({ success: false, error: "Defect not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
