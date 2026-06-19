import { NextResponse } from "next/server";
import { reorderScenario } from "@/lib/server/qa-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ success: true });
    }
    const { id, direction } = await req.json();
    if (!id || !direction) {
      return NextResponse.json({ success: false, error: "Missing id or direction" }, { status: 400 });
    }
    const success = await reorderScenario(id, direction, ctx);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
