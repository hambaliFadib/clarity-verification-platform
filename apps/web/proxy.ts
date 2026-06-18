import { existsSync } from "fs";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const envRoot =
  [process.cwd(), path.resolve(process.cwd(), "../..")].find((candidate) =>
    existsSync(path.join(candidate, ".env.local")),
  ) || process.cwd();

loadEnvConfig(envRoot);

export default withAuth(
  function proxy(req) {
    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon\\.ico|login).*)",
  ],
};
