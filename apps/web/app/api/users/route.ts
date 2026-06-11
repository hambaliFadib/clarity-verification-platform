import { NextResponse } from "next/server";
import { listUsers } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await listUsers());
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

