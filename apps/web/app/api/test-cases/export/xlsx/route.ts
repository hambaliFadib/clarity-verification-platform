import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const upstream = await fetch(`${API_BASE}/api/v1/test-cases/export/xlsx`, {
      headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Export failed" }, { status: upstream.status });
    }
    const buffer = await upstream.arrayBuffer();
    const contentDisposition =
      upstream.headers.get("content-disposition") ??
      `attachment; filename="test-cases-export.xlsx"`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
