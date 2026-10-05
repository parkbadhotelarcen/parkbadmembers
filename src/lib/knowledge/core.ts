import { z } from "zod";
import type { ChatMessage } from "../chat/core";
export const knowledgeItem = z.object({ id: z.string().trim().min(1).max(100), category: z.string().max(100), question: z.string().max(500), answer: z.string().trim().min(1).max(2500), keywords: z.string().max(500).default(""), active: z.union([z.boolean(), z.string()]).transform(v => v === true || String(v).trim().toUpperCase() === "TRUE"), updated_at: z.string().max(100).default("") });
export type KnowledgeItem = z.infer<typeof knowledgeItem>;
export function parseKnowledge(rows: unknown): KnowledgeItem[] {
  if (!Array.isArray(rows) || rows.length > 1000) throw new Error("KNOWLEDGE_SCHEMA");
  return rows.flatMap(row => { const p = knowledgeItem.safeParse(row); return p.success && p.data.active ? [p.data] : []; });
}
const groups = ["ontbijt breakfast frühstück", "restaurant restaurants eten diner dinner essen culinair informeel bron brasserie kloosterhoeve", "thermaalbad thermalbad wellness spa", "parkeren parking parken", "uitchecken checkout check-out abreise", "inchecken checkin check-in anreise", "hond dog hund", "receptie reception rezeption", "openingstijden hours öffnungszeiten", "members member beloning rewards bezoeken visits qr boekingen bookings"];
function tokens(text: string) { return text.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}-]{3,}/gu) ?? []; }
export function retrieve(items: KnowledgeItem[], messages: ChatMessage[]) {
  const latest = messages.at(-1)?.content ?? "";
  const prior = messages.filter(m => m.role === "user").slice(-3, -1).map(m => m.content).join(" ");
  const query = new Set(tokens(latest));
  const followup = /daarvan|daar|which|those|davon|welche davon/i.test(latest);
  if (followup) tokens(prior).forEach(t => query.add(t));
  for (const group of groups) { const words = tokens(group); if (words.some(w => query.has(w))) words.forEach(w => query.add(w)); }
  return items.map(item => ({ item, score: tokens(`${item.category} ${item.question} ${item.keywords}`).reduce((n,t) => n + (query.has(t) ? 1 : 0), 0) })).filter(x => x.score >= 2).sort((a,b) => b.score-a.score).slice(0,5).map(x => x.item);
}
