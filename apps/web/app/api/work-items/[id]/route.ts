import { NextResponse } from "next/server";
import { deleteWorkItem, getWorkItem, updateWorkItem } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workItem = await getWorkItem(id);
    if (!workItem) {
      return NextResponse.json({ success: false, error: "Work item not found" }, { status: 404 });
    }
    return NextResponse.json(workItem);
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
    const workItem = await updateWorkItem(id, payload);
    if (!workItem) {
      return NextResponse.json({ success: false, error: "Work item not found" }, { status: 404 });
    }
    return NextResponse.json(workItem);
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
    const deleted = await deleteWorkItem(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Work item not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
