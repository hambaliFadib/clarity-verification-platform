import { NextResponse } from "next/server";
import { listReleases } from "@/lib/server/qa-repository";
import { guestReleases } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const items = guestReleases();
      return NextResponse.json(items, {
        headers: {
          "X-Total-Count": String(items.length),
          "Access-Control-Expose-Headers": "X-Total-Count",
        },
      });
    }
    const { items, total } = await listReleases(ctx);
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
