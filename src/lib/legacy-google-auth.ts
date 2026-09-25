import "server-only";
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export function legacyGoogleAuthConfigured() {
  return Boolean(
    process.env.PARKBAD_LEGACY_GOOGLE_AUTH_ENABLED === "true" &&
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET &&
      process.env.NEXTAUTH_URL,
  );
}

export const legacyGoogleAuthOptions: NextAuthOptions = {
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
  },
};
