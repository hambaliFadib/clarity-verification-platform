import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ProjectAccessContext } from "@/lib/server/qa-repository";

export async function getRequestContext(): Promise<ProjectAccessContext> {
  const session = await getServerSession(authOptions);
  return {
    userId: (session?.user as any)?.id,
    isGuest: Boolean((session?.user as any)?.isGuest),
  };
}

export function isGuestContext(ctx: ProjectAccessContext) {
  return Boolean(ctx.isGuest || ctx.userId === "guest-user");
}
