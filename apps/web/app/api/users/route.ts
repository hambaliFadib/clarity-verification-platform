import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${apiBaseUrl}/api/v1/users`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch users from backend" },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

