import { NextResponse } from "next/server";
import { deleteWorkItem, getWorkItem, updateWorkItem } from "@/lib/server/qa-repository";
import { guestWorkItems } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const workItem = isGuestContext(ctx)
      ? (guestWorkItems().find((item) => item.id === id) || { ...guestWorkItems()[0], id })
      : await getWorkItem(id, ctx);
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
    const ctx = await getRequestContext();
    const payload = await request.json();
    const workItem = isGuestContext(ctx)
      ? { ...guestWorkItems()[0], ...payload, id }
      : await updateWorkItem(id, payload, ctx);
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
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return new Response(null, { status: 204 });
    const deleted = await deleteWorkItem(id, ctx);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Work item not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
