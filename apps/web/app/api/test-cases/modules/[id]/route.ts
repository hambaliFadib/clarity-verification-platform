import { NextResponse } from "next/server";
import { getModule, updateModule, deleteModule } from "@/lib/server/qa-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ id, name: "Guest Module", description: "Simulation only" });
    }
    const module = await getModule(id, ctx);
    if (!module) return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
    return NextResponse.json(module);
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
    const updated = await updateModule(id, body, ctx);
    if (!updated) return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });
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
    const success = await deleteModule(id, ctx);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
