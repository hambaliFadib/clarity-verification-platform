import { NextResponse } from "next/server";
import { listRequirementTestCases, listRequirements } from "@/lib/server/qa-repository";
import { guestRequirements, guestTestCases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const testCases = guestTestCases();
      return NextResponse.json(
        guestRequirements().map((requirement) => ({
          requirement,
          testCases: testCases.slice(0, 1),
          defects: [],
          coverage: testCases.length > 0 ? 100 : 0,
        })),
      );
    }

    const { searchParams } = new URL(request.url);
    const { items } = await listRequirements(searchParams, ctx);
    const matrix = await Promise.all(
      items.map(async (requirement) => {
        const testCases = await listRequirementTestCases(requirement.displayId, ctx);
        const total = testCases?.length || 0;
        const covered = testCases?.filter((item: any) => ["Ready", "Approved"].includes(item.status)).length || 0;
        return {
          requirement,
          testCases: testCases || [],
          defects: [],
          coverage: total > 0 ? Math.round((covered / total) * 100) : 0,
        };
      }),
    );

    return NextResponse.json(matrix);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
