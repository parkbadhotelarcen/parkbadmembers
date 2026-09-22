import type { Visit } from "./types";
export const loyaltyConfig = {
  visitsRequiredForReward: 4,
  nextRewardName: "Verrassingsbeloning",
};
export function rewardProgress(
  visits: Visit[],
  awardedCycles = 0,
  required = loyaltyConfig.visitsRequiredForReward,
  consumedVisits = awardedCycles * required,
) {
  if (!Number.isInteger(required) || required < 1)
    throw new Error("Ongeldige beloningsconfiguratie");
  const total = visits.filter(
    (v) => v.status === "APPROVED" || v.status === "COMPLETED",
  ).length;
  const current = Math.min(required, Math.max(0, total - consumedVisits));
  return {
    total,
    current,
    required,
    remaining: required - current,
    percent: Math.round((current / required) * 100),
  };
}
export function validateVisit(
  number: string,
  date: string,
  visits: Visit[],
  today = new Date().toLocaleDateString("en-CA"),
): string | null {
  if (!/^[a-zA-Z0-9-]{4,30}$/.test(number.trim()))
    return "Vul een geldig boekingsnummer in (4–30 letters of cijfers).";
  if (
    visits.some(
      (v) => v.bookingNumber.toLowerCase() === number.trim().toLowerCase(),
    )
  )
    return "Dit boekingsnummer is al geregistreerd.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    return "Kies een geldige aankomstdatum.";
  if (date < today) return "De aankomstdatum mag niet in het verleden liggen.";
  return null;
}
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
