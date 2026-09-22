import type { MemberService } from "./member-service";
import type { Identity } from "./contracts";
import type { PortalData, Visit } from "@/lib/types";
import type { Records } from "@/lib/google-sheets/schema";
export function visitToView(v: Records["Bezoeken"]): Visit {
  return {
    id: v.VisitID,
    userId: v.MemberID,
    bookingNumber: v.Boekingsnummer,
    arrivalDate: v.Aankomstdatum,
    status: v.Status,
    createdAt: v.AangemeldOp,
    approvedAt: v.GoedgekeurdOp || undefined,
    approvedBy: v.GoedgekeurdDoor || undefined,
  };
}
export function portalToView(
  data: Awaited<ReturnType<MemberService["getPortal"]>>,
  actor: Identity,
): PortalData {
  const m = data.member;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
  return {
    member: {
      id: m.MemberID,
      memberNumber: m.MemberID,
      firstName: m.Voornaam,
      lastName: m.Achternaam,
      email: m.Email,
      memberSince: m.LidSinds,
      memberLevel: m.Niveau,
      role: actor.isAdmin ? "ADMIN" : "USER",
      status: m.Status,
    },
    visits: data.visits.map(visitToView),
    rewards: data.rewards.map((r) => ({
      id: r.UserRewardID,
      userId: r.MemberID,
      name:
        data.rewardDefinitions.find((d) => d.RewardID === r.RewardID)?.Naam ??
        "Member-beloning",
      earnedAt: r.VerdiendOp,
      status: r.Status,
    })),
    benefits: data.benefits.map((b) => ({
      id: b.BenefitID,
      title: b.Titel,
      description: b.Omschrijving,
      detail: b.Omschrijving,
      category: b.Categorie,
      image: b.Afbeelding || "/images/pool.jpg",
      active: b.Actief,
    })),
    promotions: data.promotions
      .filter((p) => p.StartDatum <= today && p.EindDatum >= today)
      .map((p) => ({
        id: p.PromotionID,
        title: p.Titel,
        description: p.Omschrijving,
        image: p.Afbeelding,
        startDate: p.StartDatum,
        endDate: p.EindDatum,
      })),
    required: data.required,
    consumed: data.consumed,
    nextRewardName:
      data.rewardDefinitions.find((r) => r.Actief)?.Naam ?? "Member-beloning",
    referenceDate: today,
  };
}
