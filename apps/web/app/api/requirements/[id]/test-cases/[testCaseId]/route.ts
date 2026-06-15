import { NextResponse } from "next/server";
import { unlinkRequirementTestCase } from "@/lib/server/qa-repository";
import { guestRequirements, guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; testCaseId: string }>;
};

function guestRequirementExists(id: string) {
  return id.startsWith("guest-")
    || guestRequirements().some((item) => item.id === id || item.displayId === id);
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, testCaseId } = await context.params;
    const ctx = await getRequestContext();

    if (isGuestContext(ctx)) {
      const testCase = guestTestCases().find((item) => item.id === testCaseId || item.displayId === testCaseId);
      if (!guestRequirementExists(id) || !testCase) {
        return NextResponse.json({ success: false, error: "Requirement or test case not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Guest unlink simulated", testCaseId: testCase.id });
    }

    const unlinked = await unlinkRequirementTestCase(id, testCaseId, ctx);
    return unlinked
      ? NextResponse.json({ message: "Test case unlinked successfully", testCaseId })
      : NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
