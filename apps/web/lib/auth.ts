import { existsSync } from "fs";
import path from "path";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { loadEnvConfig } from "@next/env";

const envRoot =
  [process.cwd(), path.resolve(process.cwd(), "../..")].find((candidate) =>
    existsSync(path.join(candidate, ".env.local")),
  ) || process.cwd();

loadEnvConfig(envRoot);

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "guest",
    name: "Guest",
    credentials: {},
    async authorize() {
      return {
        id: "guest-user",
        name: "Guest User",
        email: "guest@clarity.local",
        role: "Viewer",
        initials: "GU",
        isGuest: true,
      };
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.unshift(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "guest") {
        try {
          const { ensureGuestSeedData } = await import("@/lib/server/qa-repository");
          await ensureGuestSeedData();
        } catch (e) {
          console.error("Failed to seed guest data during sign in", e);
        }
        return true;
      }
      
      if (account?.provider === "google") {
        if (!profile?.sub || !user.email || !user.name) {
          return false;
        }

        try {
          const { syncGoogleUser } = await import("@/lib/server/qa-repository");
          const dbUser = await syncGoogleUser({
            googleId: profile.sub,
            email: user.email,
            name: user.name,
            avatar: null,
          });
          user.id = dbUser.id;
          (user as any).role = dbUser.role;
          (user as any).initials = dbUser.initials;
          user.image = null;
          return true;
        } catch (e) {
          console.error("Error linking Google account", e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.id === "guest-user" ? "Viewer" : ((user as any).role || "Contributor");
        token.initials = (user as any).initials || "GU";
        token.isGuest = user.id === "guest-user";
      }
      if (!token.isGuest && token.role === "Viewer") token.role = "Contributor";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).initials = token.initials;
        (session.user as any).isGuest = token.isGuest;
        if (!token.isGuest) session.user.image = null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
