import { NextResponse } from "next/server";
import { getTestCaseModules } from "@/lib/server/qa-repository";
import { guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const modules = Array.from(new Set(guestTestCases().map((item) => item.module).filter(Boolean))).sort();
      return NextResponse.json(modules);
    }
    const modules = await getTestCaseModules(ctx);
    return NextResponse.json(modules);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
