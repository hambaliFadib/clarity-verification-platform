import { NextResponse } from "next/server";
import { getTestCaseTags } from "@/lib/server/qa-repository";
import { getRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const tags = await getTestCaseTags(ctx);
    return NextResponse.json(tags);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
