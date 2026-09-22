import NextAuth from "next-auth";
import { authConfigured, authOptions } from "@/lib/auth";
import { json } from "@/lib/api";
const handler = NextAuth(authOptions);
function guarded(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return authConfigured()
    ? handler(request, context)
    : json({ message: "Google-login is nog niet ingesteld." }, 503);
}
export { guarded as GET, guarded as POST };
export const runtime = "nodejs";
