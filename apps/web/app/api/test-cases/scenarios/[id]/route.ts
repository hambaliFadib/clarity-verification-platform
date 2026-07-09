import { NextResponse } from "next/server";
import { updateScenario, deleteScenario } from "@/lib/server/qa-repository";
import { query } from "@/lib/server/db";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ id, name: "Guest Scenario", description: "Simulation only", moduleId: "guest-mod-auth", moduleName: "Authentication", subModuleId: "guest-submod-login", subModuleName: "Login Flow" });
    }
    const result = await query(
      `select sc.id, sc.name, sc.description, sc.type,
              sc.module_id as "moduleId", m.name as "moduleName",
              sc.sub_module_id as "subModuleId", sm.name as "subModuleName",
              sc.parent_scenario_id as "parentScenarioId"
       from tc_scenarios sc
       left join tc_modules m on m.id = sc.module_id
       left join tc_sub_modules sm on sm.id = sc.sub_module_id
       where sc.id = $1 and sc.deleted_at is null`,
      [id]
    );
    if (!result.rows[0]) return NextResponse.json({ success: false, error: "Scenario not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    const body = await req.json();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ id, ...body });
    }
    const updated = await updateScenario(id, body, ctx);
    if (!updated) return NextResponse.json({ success: false, error: "Scenario not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json({ success: true });
    }
    const success = await deleteScenario(id, ctx);
    return NextResponse.json({ success });
  } catch (error: any) {
    const status = error.message.includes("contains test cases") ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

