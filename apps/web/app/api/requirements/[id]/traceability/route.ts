import { NextResponse } from "next/server";
import { listRequirementTestCases } from "@/lib/server/qa-repository";
import { guestRequirements, guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function guestRequirementExists(id: string) {
  return id.startsWith("guest-")
    || guestRequirements().some((item) => item.id === id || item.displayId === id);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await getRequestContext();

    if (isGuestContext(ctx)) {
      if (!guestRequirementExists(id)) {
        return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
      }

      return NextResponse.json({
        test_cases: id === "GUEST-REQ-001" ? guestTestCases().slice(0, 1) : [],
        defects: [],
      });
    }

    const testCases = await listRequirementTestCases(id, ctx);
    if (!testCases) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    return NextResponse.json({
      test_cases: testCases,
      defects: [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
