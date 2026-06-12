import { NextResponse } from "next/server";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const payload = await request.json();
    if (isGuestContext(ctx)) {
      const rows = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.items) ? payload.items : [];
      return NextResponse.json({
        created: rows.length,
        skipped: 0,
        overwritten: 0,
        errors: [],
        guest: true,
        message: "Guest import is simulated and resets on next guest sign-in.",
      });
    }
    return NextResponse.json(
      { error: "Project-scoped import execute is temporarily disabled for this security hotfix." },
      { status: 403 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
