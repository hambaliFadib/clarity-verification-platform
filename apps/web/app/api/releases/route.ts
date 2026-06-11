import { NextResponse } from "next/server";
import { listReleases } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { items, total } = await listReleases();
    return NextResponse.json(items, {
      headers: {
        "X-Total-Count": String(total),
        "Access-Control-Expose-Headers": "X-Total-Count",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
