import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Approval decisions are locked until RBAC approval enforcement is implemented.",
    },
    { status: 403 },
  );
}
