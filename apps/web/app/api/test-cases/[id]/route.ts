import { NextResponse } from "next/server";
import { deleteTestCase, getTestCase, updateTestCase } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const testCase = await getTestCase(id);
    if (!testCase) {
      return NextResponse.json({ success: false, error: "Test case not found" }, { status: 404 });
    }
    return NextResponse.json(testCase);
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
    const testCase = await updateTestCase(id, payload);
    if (!testCase) {
      return NextResponse.json({ success: false, error: "Test case not found" }, { status: 404 });
    }
    return NextResponse.json(testCase);
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
    const deleted = await deleteTestCase(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Test case not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
