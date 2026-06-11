import { NextResponse } from "next/server";
import { deleteDefect, getDefect, updateDefect } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const defect = await getDefect(id);
    if (!defect) {
      return NextResponse.json({ success: false, error: "Defect not found" }, { status: 404 });
    }
    return NextResponse.json(defect);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const defect = await updateDefect(id, payload);
    if (!defect) {
      return NextResponse.json({ success: false, error: "Defect not found" }, { status: 404 });
    }
    return NextResponse.json(defect);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = await deleteDefect(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Defect not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
