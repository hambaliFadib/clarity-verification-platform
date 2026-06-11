import { NextResponse } from "next/server";
import { deleteEnvironment, getEnvironment, updateEnvironment } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const environment = await getEnvironment(id);
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
    const payload = await request.json();
    const environment = await updateEnvironment(id, payload);
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
    const deleted = await deleteEnvironment(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Environment not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
