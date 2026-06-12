import { NextResponse } from "next/server";
import { deleteTestCase, getTestCase, updateTestCase } from "@/lib/server/qa-repository";
import { guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const testCase = isGuestContext(ctx)
      ? (guestTestCases().find((item) => item.id === id) || { ...guestTestCases()[0], id })
      : await getTestCase(id, ctx);
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
    const ctx = await getRequestContext();
    const payload = await request.json();
    const testCase = isGuestContext(ctx)
      ? { ...guestTestCases()[0], ...payload, id }
      : await updateTestCase(id, payload, ctx);
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
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return new Response(null, { status: 204 });
    const deleted = await deleteTestCase(id, ctx);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Test case not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
