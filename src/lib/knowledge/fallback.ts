import type { KnowledgeItem } from "./core";
// Only facts verified in the existing application. Hotel policies require approved Sheets content.
export const fallbackKnowledge: KnowledgeItem[] = [{
  id: "members-app", category: "Members", question: "Hoe werkt de Members-app?",
  answer: "De app bevat een persoonlijke QR-code, bezoekregistratie met boekingsnummer en aankomstdatum, Mijn boekingen, beloningsvoortgang en Mijn voordelen. De receptie controleert aangemelde bezoeken. De actuele voortgang en voordelen staan in de app. Neem voor persoonlijke wijzigingen contact op met de receptie.",
  keywords: "members member app qr beloning rewards bezoeken visits boekingen bookings", active: true, updated_at: "2026-10-05",
}];
