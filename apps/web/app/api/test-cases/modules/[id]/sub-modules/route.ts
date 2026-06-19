import { NextResponse } from "next/server";
import { listSubModules, createSubModule } from "@/lib/server/qa-repository";
import { guestSubModules } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: moduleId } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const filtered = guestSubModules().filter(sm => sm.moduleId === moduleId);
      return NextResponse.json(filtered);
    }
    const subModules = await listSubModules(moduleId, ctx);
    return NextResponse.json(subModules);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: moduleId } = await params;
    const ctx = await getRequestContext();
    const body = await req.json();
    if (isGuestContext(ctx)) {
      const newSub = {
        id: `guest-submod-${Date.now()}`,
        name: body.name,
        description: body.description || "",
        code: body.code || null,
        moduleId,
        testCaseCount: 0,
      };
      return NextResponse.json(newSub);
    }
    const newSub = await createSubModule({ ...body, moduleId }, ctx);
    return NextResponse.json(newSub);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
