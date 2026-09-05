import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "./prisma";

const gitHubId = process.env.AUTH_GITHUB_ID;
const gitHubSecret = process.env.AUTH_GITHUB_SECRET;

/** GitHub sign-in only appears once you've created an OAuth app. */
export const gitHubEnabled = Boolean(gitHubId && gitHubSecret);

/**
 * Dev login exists so the app is usable before any OAuth app is registered.
 * It is hard-gated on NODE_ENV so it cannot be switched on in production by
 * an env var alone.
 */
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.ALLOW_DEV_LOGIN === "true";

const providers: NextAuthConfig["providers"] = [];

if (gitHubEnabled) {
  providers.push(
    GitHub({
      clientId: gitHubId,
      clientSecret: gitHubSecret,
      // `repo` is not requested yet. Phase 3 (GitHub sync) will add it, at
      // which point users re-consent — deliberately not asking for write
      // access to every repo just to log in.
      authorization: { params: { scope: "read:user user:email" } },
    }),
  );
}

if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Development login",
      credentials: {},
      async authorize() {
        const email = process.env.DEV_LOGIN_EMAIL;
        if (!email) return null;

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: "Local Developer" },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  // JWT rather than database sessions: the Credentials provider cannot use
  // database sessions, and we want both providers on the same strategy.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
});

/** Throws rather than returning null, for use inside authenticated routes. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}
