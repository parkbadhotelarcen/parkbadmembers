import { z } from "zod";
import {
  newMemberInput,
  newVisitInput,
  visitStatus,
  memberId as memberIdSchema,
  type Table,
  type Tables,
  type Records,
} from "@/lib/google-sheets/schema";
import { DataError, type SheetStore } from "@/lib/google-sheets/store";
import type { Identity, WriteGateway } from "./contracts";

export function ownMember(
  tables: Partial<Tables>,
  actor: Identity,
): Records["Members"] {
  const matches =
    tables.Members?.filter(
      (row) => row.value.Email === actor.email.toLowerCase().trim(),
    ) ?? [];
  if (matches.length > 1)
    throw new DataError(
      "DUPLICATE_EMAIL",
      "Je membership moet door de receptie worden gecontroleerd.",
      409,
    );
  const member = matches[0]?.value;
  if (!member)
    throw new DataError("MEMBER_MISSING", "Je hebt nog geen membership.", 404);
  if (member.Status !== "ACTIVE")
    throw new DataError(
      "FORBIDDEN",
      "Je membership is geblokkeerd. Neem contact op met de receptie.",
      403,
    );
  return member;
}
export function settingsFrom(tables: Partial<Tables>) {
  const values = Object.fromEntries(
    (tables.Instellingen ?? []).map((row) => [row.value.Key, row.value.Value]),
  );
  const required = Number(values.visitsRequiredForReward);
  if (!Number.isInteger(required) || required < 1 || required > 100)
    throw new DataError(
      "SETTING_INVALID",
      "De beloningsinstellingen moeten worden gecontroleerd.",
      503,
    );
  return { values, required };
}
export class MemberService {
  constructor(
    private store: SheetStore,
    private writer: WriteGateway,
  ) {}
  private async own(actor: Identity) {
    return ownMember(await this.store.read(["Members"]), actor);
  }
  async getMember(actor: Identity) {
    return this.own(actor);
  }
  async getMemberByEmail(actor: Identity, email: string) {
    if (
      !actor.isAdmin &&
      email.toLowerCase().trim() !== actor.email.toLowerCase().trim()
    )
      throw new DataError("FORBIDDEN", "Geen toegang.", 403);
    const tables = await this.store.read(["Members"]);
    if (!actor.isAdmin) {
      const found = tables.Members?.some(
        (r) => r.value.Email === actor.email.toLowerCase().trim(),
      );
      return found ? ownMember(tables, actor) : null;
    }
    return (
      tables.Members?.find((r) => r.value.Email === email.toLowerCase().trim())
        ?.value ?? null
    );
  }
  async createMember(actor: Identity, input: unknown) {
    return this.writer.execute(
      "createMember",
      actor,
      newMemberInput.parse(input),
    );
  }
  async getVisitsForMember(actor: Identity) {
    const tables = await this.store.read(["Members", "Bezoeken"]);
    const member = ownMember(tables, actor);
    return (
      tables.Bezoeken?.filter((r) => r.value.MemberID === member.MemberID).map(
        (r) => r.value,
      ) ?? []
    );
  }
  async createVisit(actor: Identity, input: unknown, requestId: string) {
    const parsed = newVisitInput.parse(input);
    z.uuid().parse(requestId);
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Amsterdam",
    }).format(new Date());
    if (parsed.arrivalDate < today)
      throw new DataError(
        "INVALID_DATE",
        "De aankomstdatum mag niet in het verleden liggen.",
      );
    await this.own(actor);
    return this.writer.execute("createVisit", actor, { ...parsed, requestId });
  }
  async updateVisitStatus(actor: Identity, visitId: string, status: unknown) {
    if (!actor.isAdmin) throw new DataError("FORBIDDEN", "Geen toegang.", 403);
    z.string().min(1).max(100).parse(visitId);
    return this.writer.execute("updateVisitStatus", actor, {
      visitId,
      status: visitStatus.parse(status),
    });
  }
  async assignReward(
    actor: Identity,
    memberId: string,
    rewardId: string,
    requestId: string,
  ) {
    if (!actor.isAdmin) throw new DataError("FORBIDDEN", "Geen toegang.", 403);
    memberIdSchema.parse(memberId);
    z.uuid().parse(requestId);
    z.string().min(1).max(100).parse(rewardId);
    return this.writer.execute("assignReward", actor, {
      memberId,
      rewardId,
      requestId,
    });
  }
  async getRewardsForMember(actor: Identity) {
    const tables = await this.store.read([
      "Members",
      "MemberBeloningen",
      "Beloningen",
    ]);
    const member = ownMember(tables, actor);
    return (tables.MemberBeloningen ?? [])
      .filter((r) => r.value.MemberID === member.MemberID)
      .map((r) => ({
        ...r.value,
        reward: tables.Beloningen?.find(
          (b) => b.value.RewardID === r.value.RewardID,
        )?.value,
      }));
  }
  async getBenefits(actor: Identity) {
    await this.own(actor);
    return (
      (await this.store.read(["Voordelen"])).Voordelen?.filter(
        (r) => r.value.Actief,
      ).map((r) => r.value) ?? []
    );
  }
  async getPromotions(actor: Identity) {
    await this.own(actor);
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Amsterdam",
    }).format(new Date());
    return (
      (await this.store.read(["Acties"])).Acties?.filter(
        (r) =>
          r.value.Actief &&
          r.value.StartDatum <= today &&
          r.value.EindDatum >= today,
      ).map((r) => r.value) ?? []
    );
  }
  async getSetting(actor: Identity, key: string) {
    await this.own(actor);
    return (
      (await this.store.read(["Instellingen"])).Instellingen?.find(
        (r) => r.value.Key === key,
      )?.value.Value ?? null
    );
  }
  async getPortal(actor: Identity) {
    // One batch read; no persistent caching of membership/authorization data.
    const tables = await this.store.read([
      "Members",
      "Bezoeken",
      "Beloningen",
      "MemberBeloningen",
      "Voordelen",
      "Acties",
      "Instellingen",
    ] satisfies Table[]);
    const member = ownMember(tables, actor);
    const settings = settingsFrom(tables);
    const consumed = Number(
      settings.values[`rewardVisitsConsumed.${member.MemberID}`] ?? "0",
    );
    if (!Number.isInteger(consumed) || consumed < 0)
      throw new DataError(
        "SETTING_INVALID",
        "Ongeldige beloningsvoortgang.",
        503,
      );
    return {
      member,
      visits: (tables.Bezoeken ?? [])
        .filter((r) => r.value.MemberID === member.MemberID)
        .map((r) => r.value),
      rewards: (tables.MemberBeloningen ?? [])
        .filter((r) => r.value.MemberID === member.MemberID)
        .map((r) => r.value),
      rewardDefinitions: (tables.Beloningen ?? []).map((r) => r.value),
      benefits: (tables.Voordelen ?? [])
        .filter((r) => r.value.Actief)
        .map((r) => r.value),
      promotions: (tables.Acties ?? [])
        .filter((r) => r.value.Actief)
        .map((r) => r.value),
      required: settings.required,
      consumed,
    };
  }
}
