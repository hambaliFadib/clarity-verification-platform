import { NextResponse } from "next/server";
import { getRequirement, updateRequirement } from "@/lib/server/qa-repository";
import { guestRequirements } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const requirement = guestRequirements().find((item) => item.id === id || item.displayId === id);
      return requirement
        ? NextResponse.json(requirement)
        : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }
    const requirement = await getRequirement(id, ctx);
    return requirement
      ? NextResponse.json(requirement)
      : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const current = guestRequirements().find((item) => item.id === id || item.displayId === id);
      return current
        ? NextResponse.json({ ...current, ...payload, updatedAt: new Date().toISOString() })
        : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }
    const requirement = await updateRequirement(id, payload, ctx);
    return requirement
      ? NextResponse.json(requirement)
      : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
