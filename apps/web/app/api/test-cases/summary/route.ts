import { NextResponse } from "next/server";
import { getTestCaseSummary } from "@/lib/server/qa-repository";
import { guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const items = guestTestCases();
      const approved = items.filter((t: any) => t.status === "Approved").length;
      const draft = items.filter((t: any) => t.status === "Draft").length;
      const ready = items.filter((t: any) => t.status === "Ready").length;
      const inReview = items.filter((t: any) => t.status === "In Review").length;
      const hasFailures = items.filter((t: any) =>
        t.steps?.some((s: any) => s.status === "Failed")
      ).length;
      return NextResponse.json({
        total: items.length,
        approved,
        draft,
        ready,
        inReview,
        hasFailures,
      });
    }
    const summary = await getTestCaseSummary(ctx);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
