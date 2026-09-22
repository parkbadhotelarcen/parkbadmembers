import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DataError } from "./google-sheets/store";
import type { Identity } from "@/services/contracts";

export function authConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET &&
    process.env.NEXTAUTH_URL,
  );
}
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers:
    process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          }),
        ]
      : [],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async signIn({ account, profile }) {
      return (
        account?.provider === "google" &&
        Boolean(
          profile &&
          "email_verified" in profile &&
          profile.email_verified === true,
        )
      );
    },
    async jwt({ token, account, profile }) {
      if (account)
        token.verifiedEmail =
          account.provider === "google" &&
          Boolean(
            profile &&
            "email_verified" in profile &&
            profile.email_verified === true,
          );
      return token;
    },
    async session({ session, token }) {
      if (session.user)
        session.user.email = token.verifiedEmail === true ? token.email : null;
      return session;
    },
  },
  logger: {
    error() {
      console.error("Google-login mislukt; controleer de serverconfiguratie.");
    },
    warn() {},
    debug() {},
  },
};
export async function requireIdentity(): Promise<Identity> {
  if (process.env.PARKBAD_DATA_MODE !== "sheets" || !authConfigured())
    throw new DataError(
      "NOT_CONFIGURED",
      "Inloggen is nog niet ingesteld.",
      503,
    );
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email)
    throw new DataError(
      "UNAUTHORIZED",
      "Log in om je membership te bekijken.",
      401,
    );
  const admins = (process.env.PARKBAD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.toLowerCase().trim())
    .filter(Boolean);
  return { email, isAdmin: admins.includes(email) };
}
