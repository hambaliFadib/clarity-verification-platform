import { NextResponse } from "next/server";
import { listScenarios, createScenario } from "@/lib/server/qa-repository";
import { guestScenarios } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json(guestScenarios());
    }
    const scenarios = await listScenarios(ctx);
    return NextResponse.json(scenarios);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    if (isGuestContext(ctx)) {
      const newScen = {
        id: `guest-scen-${Date.now()}`,
        name: body.name,
        description: body.description || "",
        moduleId: body.moduleId || null,
        moduleName: body.moduleName || null,
        testCaseCount: 0,
      };
      return NextResponse.json(newScen);
    }
    const newScen = await createScenario(body, ctx);
    return NextResponse.json(newScen);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
