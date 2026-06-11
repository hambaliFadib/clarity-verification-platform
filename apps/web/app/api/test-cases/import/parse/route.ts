import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const upstream = await fetch(`${API_BASE}/api/v1/test-cases/import/parse`, {
      method: "POST",
      body: formData,
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
