import { NextResponse } from "next/server";
import { getRequirement, updateRequirement } from "@/lib/server/qa-repository";
import { guestRequirements } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";
import { globalGuestStore } from "@/lib/server/guest-fixtures";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function guestRequirementById(id: string) {
  const items = guestRequirements();
  const requirement = items.find((item) => item.id === id || item.displayId === id);
  if (requirement) return requirement;
  if (!id.startsWith("guest-")) return null;

  return {
    ...items[0],
    id,
    displayId: id,
    title: "Guest draft requirement",
    description: "Guest-created requirement preview. Guest data resets back to the demo fixtures.",
    acceptanceCriteria: undefined,
    businessRules: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...globalGuestStore.requirements[id]
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const requirement = guestRequirementById(id);
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
      const current = guestRequirementById(id);
      if (current) {
        const updated = { ...current, ...payload, updatedAt: new Date().toISOString() };
        globalGuestStore.requirements[id] = {
          ...globalGuestStore.requirements[id],
          ...payload,
        };
        return NextResponse.json(updated);
      }
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }
    const requirement = await updateRequirement(id, payload, ctx);
    return requirement
      ? NextResponse.json(requirement)
      : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
