import { NextResponse } from "next/server";
import { createTestCase, listTestCases } from "@/lib/server/qa-repository";
import { guestCreated, guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const items = guestTestCases();
      return NextResponse.json(items, {
        headers: {
          "X-Total-Count": String(items.length),
          "Access-Control-Expose-Headers": "X-Total-Count",
        },
      });
    }
    const { items, total } = await listTestCases(searchParams, ctx);
    return NextResponse.json(items, {
      headers: {
        "X-Total-Count": String(total),
        "Access-Control-Expose-Headers": "X-Total-Count",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const payload = await request.json();
    if (isGuestContext(ctx)) {
      const testCase = guestCreated(payload, guestTestCases()[0]);
      return NextResponse.json({ success: true, testCase }, { status: 201 });
    }
    const testCase = await createTestCase(payload, ctx);
    return NextResponse.json({ success: true, testCase }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
