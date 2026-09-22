"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { signIn, signOut } from "next-auth/react";
import {
  initialVisits,
  member,
  benefits,
  rewards,
  demoReferenceDate,
} from "@/lib/mock-data";
import { loyaltyConfig, rewardProgress } from "@/lib/loyalty";
import type { PortalData, Visit } from "@/lib/types";
interface State extends PortalData {
  mode: "demo" | "sheets";
  progress: ReturnType<typeof rewardProgress>;
  createVisit: (
    input: { bookingNumber: string; arrivalDate: string },
    requestId: string,
  ) => Promise<Visit>;
  reset: () => void;
}
const demo: PortalData = {
  member,
  visits: initialVisits,
  benefits,
  rewards,
  promotions: [],
  required: loyaltyConfig.visitsRequiredForReward,
  consumed: 0,
  nextRewardName: loyaltyConfig.nextRewardName,
  referenceDate: demoReferenceDate,
};
const AppContext = createContext<State | null>(null);
async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
  });
  const body = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(body.message ?? "Probeer het opnieuw."), {
      code: body.code,
    });
  return body;
}
export function AppProvider({
  children,
  mode = "demo",
}: {
  children: React.ReactNode;
  mode?: "demo" | "sheets";
}) {
  const [data, setData] = useState<PortalData | null>(
    mode === "demo" ? demo : null,
  );
  const [issue, setIssue] = useState({ code: "", message: "" });
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const next: PortalData = await api("/api/member");
      setData(next);
      setIssue({ code: "", message: "" });
    } catch (e) {
      setData(null);
      setIssue({
        code: (e as { code?: string }).code ?? "UNAVAILABLE",
        message:
          e instanceof Error ? e.message : "Je gegevens zijn niet beschikbaar.",
      });
    }
  }, []);
  useEffect(() => {
    if (mode !== "sheets") return;
    // load only updates state after the external API request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const refresh = () => {
      void load();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [mode, load]);
  if (!data)
    return (
      <div className="app-shell">
        <main className="main-content">
          <section className="card detail-card access-gate">
            <div className="brand">
              <span>
                PARKBAD<small>MEMBERS</small>
              </span>
            </div>
            <h1>
              {issue.code === "MEMBER_MISSING"
                ? "Word Parkbad Member"
                : "Welkom bij Parkbad Members"}
            </h1>
            <p role="status">{issue.message || "Je membership laden…"}</p>
            {issue.code === "UNAUTHORIZED" && (
              <button
                className="primary"
                onClick={() => void signIn("google", { callbackUrl: "/" })}
              >
                Inloggen met Google
              </button>
            )}
            {issue.code === "MEMBER_MISSING" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy) return;
                  const form = new FormData(e.currentTarget);
                  setBusy(true);
                  try {
                    await api("/api/members", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        firstName: form.get("firstName"),
                        lastName: form.get("lastName"),
                      }),
                    });
                    await load();
                  } catch (e) {
                    setIssue({
                      code: "MEMBER_MISSING",
                      message:
                        e instanceof Error ? e.message : "Aanmelden mislukt.",
                    });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label htmlFor="firstName">Voornaam</label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  maxLength={100}
                  autoComplete="given-name"
                />
                <label htmlFor="lastName">Achternaam</label>
                <input
                  id="lastName"
                  name="lastName"
                  maxLength={100}
                  autoComplete="family-name"
                />
                <button className="primary" disabled={busy}>
                  {busy ? "Aanmelden…" : "Membership aanmaken"}
                </button>
              </form>
            )}
            {issue.code && issue.code !== "UNAUTHORIZED" && (
              <button className="secondary" onClick={() => void load()}>
                Opnieuw laden
              </button>
            )}
            {issue.code && issue.code !== "UNAUTHORIZED" && (
              <button
                className="text-button"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                Uitloggen
              </button>
            )}
          </section>
        </main>
      </div>
    );
  return (
    <AppContext.Provider
      value={{
        ...data,
        mode,
        progress: rewardProgress(data.visits, 0, data.required, data.consumed),
        createVisit: async (input, requestId) => {
          const visit: Visit =
            mode === "demo"
              ? {
                  id: requestId,
                  userId: data.member.id,
                  ...input,
                  status: "PENDING",
                  createdAt: new Date().toISOString(),
                }
              : (
                  await api("/api/visits", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Idempotency-Key": requestId,
                    },
                    body: JSON.stringify(input),
                  })
                ).visit;
          setData((current) =>
            current
              ? {
                  ...current,
                  visits: [
                    visit,
                    ...current.visits.filter((v) => v.id !== visit.id),
                  ],
                }
              : current,
          );
          return visit;
        },
        reset: () => {
          if (mode === "demo") setData(demo);
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useMembers() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider ontbreekt");
  return context;
}
