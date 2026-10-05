import { requireIdentity } from "@/lib/auth";
import { input, json } from "@/lib/api";
import { chatInput, language, redact, technical, unavailable } from "@/lib/chat/core";
import { loadKnowledge } from "@/lib/knowledge/source";
import { retrieve } from "@/lib/knowledge/core";
import { GatewayProvider } from "@/lib/ai/provider";
import { DataError } from "@/lib/google-sheets/store";
export const runtime = "nodejs";
export const maxDuration = 60;
// Best-effort per-instance burst protection; configure a Vercel WAF rate limit for a global limit.
const limits = new Map<string, { count: number; until: number; busy: boolean }>();
export async function POST(request: Request) {
  let lang: "nl" | "de" | "en" = "nl";
  let slot: { count: number; until: number; busy: boolean } | undefined;
  try {
    const parsed = chatInput.safeParse(await input(request));
    if (!parsed.success) return json({ message: "Stel een kortere vraag en probeer opnieuw." },400);
    const messages = parsed.data.messages.map(m => ({ ...m, content: redact(m.content) }));
    lang = language(messages.at(-1)!.content);
    const actor = await requireIdentity();
    const now = Date.now();
    for (const [key,value] of limits) if (value.until < now && !value.busy) limits.delete(key);
    const previous = limits.get(actor.authUserId);
    if (previous?.busy || (previous && previous.count >= 10)) return json({ message: technical[lang] },429);
    if (limits.size >= 10000 && !previous) return json({ message: technical[lang] },429);
    slot = previous ?? {count:0,until:now+60000,busy:false};
    slot.count++; slot.busy=true; limits.set(actor.authUserId,slot);
    const knowledge = retrieve(await loadKnowledge(actor), messages);
    if (!knowledge.length) return json({ answer: unavailable[lang], sources: [] });
    const answer = await new GatewayProvider().answer(messages,knowledge,lang);
    return json({ answer, sources: knowledge.map(k => ({id:k.id,title:k.question})) });
  } catch (error) {
    console.warn("[assistant] REQUEST_FAILED", error instanceof DataError ? error.code : "UNAVAILABLE");
    return json({message:technical[lang]}, error instanceof DataError && error.status < 500 ? error.status : 503);
  } finally { if (slot) slot.busy=false; }
}
