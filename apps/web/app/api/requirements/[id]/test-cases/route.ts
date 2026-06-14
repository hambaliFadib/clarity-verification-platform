import { NextResponse } from "next/server";
import {
  linkRequirementTestCase,
  listRequirementTestCases,
  unlinkRequirementTestCase,
} from "@/lib/server/qa-repository";
import { guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return NextResponse.json(guestTestCases().slice(0, 1));
    const { id } = await context.params;
    const testCases = await listRequirementTestCases(id, ctx);
    return testCases
      ? NextResponse.json(testCases)
      : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ message: "Guest link simulated" }, { status: 201 });
    }
    const { id } = await context.params;
    const body = await request.json();
    const testCaseId = body.testCaseId || body.test_case_id;
    if (!testCaseId) {
      return NextResponse.json({ success: false, error: "testCaseId is required" }, { status: 400 });
    }
    const linked = await linkRequirementTestCase(id, testCaseId, ctx);
    return linked
      ? NextResponse.json({ message: "Test case linked successfully" }, { status: 201 })
      : NextResponse.json({ success: false, error: "Requirement or test case not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return NextResponse.json({ message: "Guest unlink simulated" });
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get("testCaseId") || searchParams.get("test_case_id");
    if (!testCaseId) {
      return NextResponse.json({ success: false, error: "testCaseId is required" }, { status: 400 });
    }
    const unlinked = await unlinkRequirementTestCase(id, testCaseId, ctx);
    return unlinked
      ? NextResponse.json({ message: "Test case unlinked successfully" })
      : NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
