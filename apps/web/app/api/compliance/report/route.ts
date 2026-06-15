import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/compliance/report`;
    
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
