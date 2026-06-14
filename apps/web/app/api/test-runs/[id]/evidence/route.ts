import { NextResponse } from "next/server";
import { listTestRunEvidence } from "@/lib/server/qa-repository";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return NextResponse.json([]);
    const { id } = await context.params;
    const evidence = await listTestRunEvidence(id, ctx);
    return evidence
      ? NextResponse.json(evidence)
      : NextResponse.json({ success: false, error: "Test run not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Evidence upload storage is not configured yet." },
    { status: 501 },
  );
}
