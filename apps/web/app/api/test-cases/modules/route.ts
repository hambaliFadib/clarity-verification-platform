import { NextResponse } from "next/server";
import { listModules, createModule } from "@/lib/server/qa-repository";
import { guestModules } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      return NextResponse.json(guestModules());
    }
    const modules = await listModules(ctx);
    return NextResponse.json(modules);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getRequestContext();
    const body = await req.json();
    if (isGuestContext(ctx)) {
      const newModule = {
        id: `guest-mod-${Date.now()}`,
        name: body.name,
        description: body.description || "",
        code: body.code || null,
        subModuleCount: 0,
        testCaseCount: 0,
      };
      return NextResponse.json(newModule);
    }
    const newModule = await createModule(body, ctx);
    return NextResponse.json(newModule);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
