import { NextResponse } from "next/server";
import { ensureGuestSeedData } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await ensureGuestSeedData();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
