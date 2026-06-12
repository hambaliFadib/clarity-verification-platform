import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const { items, total } = await listProjects(
      searchParams,
      (session?.user as any)?.id,
      Boolean((session?.user as any)?.isGuest),
    );
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
    const session = await getServerSession(authOptions);
    const payload = await request.json();
    const project = await createProject(
      payload,
      (session?.user as any)?.id,
      Boolean((session?.user as any)?.isGuest),
    );
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
