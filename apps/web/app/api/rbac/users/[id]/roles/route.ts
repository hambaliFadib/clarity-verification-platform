import { NextResponse } from "next/server";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const ctx = await getRequestContext();
  if (isGuestContext(ctx)) return NextResponse.json([]);

  const { id } = await context.params;
  if (!ctx.userId || ctx.userId !== id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json([{ id: "contributor", name: "Contributor", is_system: true }]);
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "RBAC role management is locked until the RBAC phase is fully implemented." },
    { status: 403 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "RBAC role management is locked until the RBAC phase is fully implemented." },
    { status: 403 },
  );
}
