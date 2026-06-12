import { NextResponse } from "next/server";
import { createWorkItem, listWorkItems } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { items, total } = await listWorkItems(searchParams);
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

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const workItem = await createWorkItem(payload);
    return NextResponse.json({ success: true, workItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
