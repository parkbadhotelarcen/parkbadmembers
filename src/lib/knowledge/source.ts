import "server-only";
import { AppsScriptGateway } from "../google-sheets/writer";
import type { Identity } from "@/services/contracts";
import { parseKnowledge } from "./core";
import { fallbackKnowledge } from "./fallback";
export async function loadKnowledge(actor: Identity) {
  try { return parseKnowledge(await new AppsScriptGateway().readKnowledge(actor)); }
  catch { console.warn("[assistant] KNOWLEDGE_FALLBACK"); return fallbackKnowledge; }
}
