import { NextResponse } from "next/server";
import { getTestCaseModules } from "@/lib/server/qa-repository";
import { getRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const modules = await getTestCaseModules(ctx);
    return NextResponse.json(modules);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
