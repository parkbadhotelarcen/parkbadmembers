import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Word Parkbad Member"
      description="Maak je persoonlijke account aan en ontdek je voordelen."
    >
      <SignUp
        path="/register"
        routing="path"
        signInUrl="/login"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
}
