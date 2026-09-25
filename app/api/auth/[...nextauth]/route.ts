import NextAuth from "next-auth";
import {
  legacyGoogleAuthConfigured,
  legacyGoogleAuthOptions,
} from "@/lib/legacy-google-auth";
import { json } from "@/lib/api";
const handler = NextAuth(legacyGoogleAuthOptions);
function guarded(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return legacyGoogleAuthConfigured()
    ? handler(request, context)
    : json({ message: "De oude Google-login is uitgeschakeld." }, 404);
}
export { guarded as GET, guarded as POST };
export const runtime = "nodejs";
