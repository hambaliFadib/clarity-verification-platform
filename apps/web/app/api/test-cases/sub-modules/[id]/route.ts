import { NextResponse } from "next/server";
import { getSubModule, updateSubModule, deleteSubModule } from "@/lib/server/qa-repository";
import { guestSubModules } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const found = guestSubModules().find(sm => sm.id === id);
      if (!found) return NextResponse.json({ success: false, error: "Sub-module not found" }, { status: 404 });
      return NextResponse.json(found);
    }
    const subModule = await getSubModule(id, ctx);
    if (!subModule) return NextResponse.json({ success: false, error: "Sub-module not found" }, { status: 404 });
    return NextResponse.json(subModule);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const body = await req.json();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ id, ...body });
    }
    const updated = await updateSubModule(id, body, ctx);
    if (!updated) return NextResponse.json({ success: false, error: "Sub-module not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ success: true });
    }
    const success = await deleteSubModule(id, ctx);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
