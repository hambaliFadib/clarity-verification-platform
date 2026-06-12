import { NextResponse } from "next/server";
import { deleteEnvironment, getEnvironment, updateEnvironment } from "@/lib/server/qa-repository";
import { guestEnvironments } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const environment = isGuestContext(ctx)
      ? (guestEnvironments().find((item) => item.id === id) || { ...guestEnvironments()[0], id })
      : await getEnvironment(id, ctx);
    if (!environment) {
      return NextResponse.json({ success: false, error: "Environment not found" }, { status: 404 });
    }
    return NextResponse.json(environment);
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
    const environment = isGuestContext(ctx)
      ? { ...guestEnvironments()[0], ...payload, id }
      : await updateEnvironment(id, payload, ctx);
    if (!environment) {
      return NextResponse.json({ success: false, error: "Environment not found" }, { status: 404 });
    }
    return NextResponse.json(environment);
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
    const deleted = await deleteEnvironment(id, ctx);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Environment not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
