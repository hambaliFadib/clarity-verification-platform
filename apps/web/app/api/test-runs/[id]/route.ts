import { NextResponse } from "next/server";
import { getTestRun } from "@/lib/server/qa-repository";
import { guestTestRuns } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const testRun = guestTestRuns().find((item) => item.id === id || item.displayId === id);
      return testRun
        ? NextResponse.json(testRun)
        : NextResponse.json({ success: false, error: "Test run not found" }, { status: 404 });
    }
    const testRun = await getTestRun(id, ctx);
    return testRun
      ? NextResponse.json(testRun)
      : NextResponse.json({ success: false, error: "Test run not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
