import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    seeded: false,
    message: "Guest data is served from isolated fixtures and is never written to NeonDB.",
  });
}
