import { z } from "zod";
export const chatInput = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(1200) }).strict()).min(1).max(6),
}).strict().refine(v => v.messages.at(-1)?.role === "user", "Last message must be user");
export type ChatMessage = z.infer<typeof chatInput>["messages"][number];
export type Language = "nl" | "de" | "en";
export function language(text: string): Language {
  if (/\b(wann|welche|gibt|frühstück|ist|ich|kann|öffnungszeiten|parken)\b/i.test(text)) return "de";
  if (/\b(what|when|where|how|breakfast|can|which|please|parking|hello)\b/i.test(text)) return "en";
  return "nl";
}
export const unavailable = {
  nl: "Daar heb ik op dit moment geen betrouwbare informatie over. Neem hiervoor contact op met de receptie.",
  de: "Dazu habe ich derzeit keine zuverlässigen Informationen. Bitte wenden Sie sich an die Rezeption.",
  en: "I don’t currently have reliable information about that. Please contact reception.",
};
export const technical = {
  nl: "Het lukt me op dit moment niet om je vraag te beantwoorden. Probeer het later opnieuw of neem contact op met de receptie.",
  de: "Ich kann Ihre Frage gerade nicht beantworten. Bitte versuchen Sie es später erneut oder wenden Sie sich an die Rezeption.",
  en: "I can’t answer your question right now. Please try again later or contact reception.",
};
export function redact(text: string) {
  return text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]").replace(/\b(?:\+?\d[\d ()-]{6,}\d)\b/g, "[number]");
}
