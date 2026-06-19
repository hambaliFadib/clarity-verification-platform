import { NextResponse } from "next/server";
import { listTestRuns, createTestRun } from "@/lib/server/qa-repository";
import { guestTestRuns, guestTestCases, globalGuestStore } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const items = guestTestRuns();
      return NextResponse.json(items, {
        headers: {
          "X-Total-Count": String(items.length),
          "Access-Control-Expose-Headers": "X-Total-Count",
        },
      });
    }
    const { items, total } = await listTestRuns(searchParams, ctx);
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
      const casesCount = guestTestCases().length;
      const newRun = {
        id: `guest-run-${Date.now()}`,
        displayId: `GUEST-RUN-00${guestTestRuns().length + 1}`,
        name: payload.name || "Unnamed Run",
        description: payload.description || "",
        type: payload.type || "Regression",
        triggerType: "Manual" as const,
        status: "Not Started" as const,
        environment: payload.environment || "Demo Staging",
        release: payload.release || "Guest Release",
        assignedTo: payload.assignedTo || "Guest User",
        totalCases: casesCount,
        passed: 0,
        failed: 0,
        blocked: 0,
        notRun: casesCount,
        createdAt: new Date().toISOString(),
      };
      globalGuestStore.testRuns[newRun.id] = newRun;
      return NextResponse.json(newRun, { status: 201 });
    }
    const testRun = await createTestRun(payload, ctx);
    return NextResponse.json(testRun, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
