import { NextResponse } from "next/server";
import { listScenarios, createScenario } from "@/lib/server/qa-repository";
import { guestScenarios } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subModuleId = searchParams.get("subModuleId") || undefined;
    const moduleId = searchParams.get("moduleId") || undefined;

    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      let list = guestScenarios();
      if (subModuleId) {
        list = list.filter(sc => sc.subModuleId === subModuleId);
      }
      if (moduleId) {
        list = list.filter(sc => sc.moduleId === moduleId);
      }
      return NextResponse.json(list);
    }
    const scenarios = await listScenarios(ctx, { moduleId, subModuleId });
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
        subModuleId: body.subModuleId || null,
        subModuleName: body.subModuleName || null,
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
