import { NextResponse } from "next/server";
import { deleteDefect, getDefect, updateDefect } from "@/lib/server/qa-repository";
import { guestDefects } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const defect = isGuestContext(ctx)
      ? (guestDefects().find((item) => item.id === id) || { ...guestDefects()[0], id })
      : await getDefect(id, ctx);
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
    const ctx = await getRequestContext();
    const payload = await request.json();
    const defect = isGuestContext(ctx)
      ? { ...guestDefects()[0], ...payload, id }
      : await updateDefect(id, payload, ctx);
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
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return new Response(null, { status: 204 });
    const deleted = await deleteDefect(id, ctx);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Defect not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
