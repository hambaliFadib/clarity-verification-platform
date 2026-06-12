import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteProject, getProject, updateProject } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const project = await getProject(
      id,
      (session?.user as any)?.id,
      Boolean((session?.user as any)?.isGuest),
    );
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const payload = await request.json();
    const project = await updateProject(
      id,
      payload,
      (session?.user as any)?.id,
      Boolean((session?.user as any)?.isGuest),
    );
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const deleted = await deleteProject(
      id,
      (session?.user as any)?.id,
      Boolean((session?.user as any)?.isGuest),
    );
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
