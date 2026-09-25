import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DataError } from "./google-sheets/store";
import type { Identity } from "@/services/contracts";

export function authConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );
}

export async function requireIdentity(): Promise<Identity> {
  if (process.env.PARKBAD_DATA_MODE !== "sheets" || !authConfigured())
    throw new DataError(
      "NOT_CONFIGURED",
      "Inloggen is nog niet ingesteld.",
      503,
    );

  const { userId } = await auth();
  if (!userId)
    throw new DataError(
      "UNAUTHORIZED",
      "Log in om je membership te bekijken.",
      401,
    );

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  const email = primaryEmail?.emailAddress.toLowerCase().trim();
  if (
    !user ||
    user.id !== userId ||
    !primaryEmail ||
    !email ||
    primaryEmail.verification?.status !== "verified"
  )
    throw new DataError(
      "EMAIL_NOT_VERIFIED",
      "Verifieer eerst je e-mailadres.",
      403,
    );

  const admins = (process.env.PARKBAD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);

  return {
    authUserId: userId,
    email,
    firstName: user.firstName?.trim() ?? "",
    lastName: user.lastName?.trim() ?? "",
    isAdmin: admins.includes(email),
  };
}

export async function requireAdmin(): Promise<Identity> {
  const actor = await requireIdentity();
  if (!actor.isAdmin) throw new DataError("FORBIDDEN", "Geen toegang.", 403);
  return actor;
}
