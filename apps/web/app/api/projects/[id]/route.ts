import { NextResponse } from "next/server";
import { deleteProject, getProject, updateProject } from "@/lib/server/qa-repository";
import { guestProjects } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) {
      const project = guestProjects().find((item) => item.id === id) || guestProjects()[0];
      return NextResponse.json(project);
    }
    const project = await getProject(
      id,
      ctx.userId,
      Boolean(ctx.isGuest),
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
    const ctx = await getRequestContext();
    const payload = await request.json();
    if (isGuestContext(ctx)) {
      const project = { ...guestProjects()[0], ...payload, id };
      return NextResponse.json(project);
    }
    const project = await updateProject(
      id,
      payload,
      ctx.userId,
      Boolean(ctx.isGuest),
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
    const ctx = await getRequestContext();
    if (isGuestContext(ctx)) return new Response(null, { status: 204 });
    const deleted = await deleteProject(
      id,
      ctx.userId,
      Boolean(ctx.isGuest),
    );
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
