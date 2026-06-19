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
      let items = guestTestCases();
      const status = searchParams.get("status");
      const search = searchParams.get("search");
      const module = searchParams.get("module");
      const type = searchParams.get("type");
      const severity = searchParams.get("severity");

      if (status) {
        items = items.filter(tc => tc.status.toLowerCase() === status.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        items = items.filter(tc => tc.title.toLowerCase().includes(q) || tc.id.toLowerCase().includes(q));
      }
      if (module) {
        items = items.filter(tc => tc.module === module);
      }
      if (type) {
        items = items.filter(tc => tc.type === type);
      }
      if (severity) {
        items = items.filter(tc => tc.severity === severity);
      }
      return NextResponse.json({ items, total: items.length });
    }
    const { items, total } = await listTestCases(searchParams, ctx);
    return NextResponse.json({ items, total });
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
