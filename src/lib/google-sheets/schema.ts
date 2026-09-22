import { z } from "zod";

export const memberId = z.string().regex(/^KV-\d{3,}$/);
const date = z.iso.date();
const timestamp = z.union([z.iso.datetime({ offset: true }), date]);
const optionalTime = z.union([timestamp, z.literal("")]);
const active = z.preprocess(
  (v) => (typeof v === "string" ? v.toUpperCase() : v),
  z.enum(["TRUE", "FALSE"]).transform((v) => v === "TRUE"),
);
const image = z
  .string()
  .refine(
    (v) => v === "" || /^\/(?!\/)[\w/.-]+$/.test(v) || /^https:\/\//.test(v),
    "Ongeldige afbeelding-URL",
  );
export const visitStatus = z.enum([
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
]);
export const schemas = {
  Members: z.object({
    MemberID: memberId,
    Voornaam: z.string().min(1).max(100),
    Achternaam: z.string().max(100),
    Email: z.email().transform((v) => v.toLowerCase().trim()),
    LidSinds: date,
    Niveau: z.enum(["MEMBER", "SILVER", "GOLD"]),
    Status: z.enum(["ACTIVE", "BLOCKED"]),
    CreatedAt: timestamp,
    UpdatedAt: timestamp,
  }),
  Bezoeken: z.object({
    VisitID: z.string().min(1),
    MemberID: memberId,
    Boekingsnummer: z.string().min(4).max(30),
    Aankomstdatum: date,
    Status: visitStatus,
    AangemeldOp: timestamp,
    GoedgekeurdOp: optionalTime,
    GoedgekeurdDoor: z.string(),
  }),
  Beloningen: z.object({
    RewardID: z.string().min(1),
    Naam: z.string().min(1).max(200),
    Omschrijving: z.string().max(2000),
    Actief: active,
  }),
  MemberBeloningen: z.object({
    UserRewardID: z.string().min(1),
    MemberID: memberId,
    RewardID: z.string().min(1),
    VerdiendOp: timestamp,
    GebruiktOp: optionalTime,
    Status: z.enum(["AVAILABLE", "REDEEMED", "EXPIRED"]),
  }),
  Voordelen: z.object({
    BenefitID: z.string().regex(/^[a-z0-9-]+$/),
    Titel: z.string().min(1).max(200),
    Omschrijving: z.string().max(2000),
    Categorie: z.string().max(100),
    Afbeelding: image,
    Actief: active,
  }),
  Acties: z.object({
    PromotionID: z.string().min(1),
    Titel: z.string().min(1).max(200),
    Omschrijving: z.string().max(2000),
    Afbeelding: image,
    StartDatum: date,
    EindDatum: date,
    Actief: active,
  }),
  Instellingen: z.object({ Key: z.string().min(1), Value: z.string() }),
} as const;
export const headers = {
  Members: [
    "MemberID",
    "Voornaam",
    "Achternaam",
    "Email",
    "LidSinds",
    "Niveau",
    "Status",
    "CreatedAt",
    "UpdatedAt",
  ],
  Bezoeken: [
    "VisitID",
    "MemberID",
    "Boekingsnummer",
    "Aankomstdatum",
    "Status",
    "AangemeldOp",
    "GoedgekeurdOp",
    "GoedgekeurdDoor",
  ],
  Beloningen: ["RewardID", "Naam", "Omschrijving", "Actief"],
  MemberBeloningen: [
    "UserRewardID",
    "MemberID",
    "RewardID",
    "VerdiendOp",
    "GebruiktOp",
    "Status",
  ],
  Voordelen: [
    "BenefitID",
    "Titel",
    "Omschrijving",
    "Categorie",
    "Afbeelding",
    "Actief",
  ],
  Acties: [
    "PromotionID",
    "Titel",
    "Omschrijving",
    "Afbeelding",
    "StartDatum",
    "EindDatum",
    "Actief",
  ],
  Instellingen: ["Key", "Value"],
} as const;
export type Table = keyof typeof schemas;
export type Records = { [K in Table]: z.output<(typeof schemas)[K]> };
export type SheetRow<T extends Table> = { row: number; value: Records[T] };
export type Tables = { [K in Table]: SheetRow<K>[] };
export const newMemberInput = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().max(100),
  })
  .strict();
export const newVisitInput = z
  .object({
    bookingNumber: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{4,30}$/)
      .transform((v) => v.toUpperCase()),
    arrivalDate: date,
  })
  .strict();
export const normalizeBooking = (value: string) => value.trim().toUpperCase();
export function parseTable<T extends Table>(
  table: T,
  rows: unknown[][],
): SheetRow<T>[] {
  const columns = headers[table];
  if (!rows[0] || columns.some((key, i) => rows[0][i] !== key))
    throw new Error(`Ongeldige kolomkoppen in ${table}`);
  const result: SheetRow<T>[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].every((v) => v === "" || v === null || v === undefined))
      continue;
    const raw = Object.fromEntries(
      columns.map((key, column) => [key, String(rows[i][column] ?? "")]),
    );
    const parsed = schemas[table].safeParse(raw);
    if (!parsed.success)
      throw new Error(`Ongeldige gegevens in ${table}, rij ${i + 1}`);
    const id = raw[columns[0]];
    if (seen.has(id)) throw new Error(`Dubbele sleutel in ${table}`);
    seen.add(id);
    result.push({ row: i + 1, value: parsed.data as Records[T] });
  }
  return result;
}
export function serialize<T extends Table>(
  table: T,
  record: Records[T],
): string[] {
  return headers[table].map((key) => {
    const v = (record as Record<string, unknown>)[key];
    return typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v ?? "");
  });
}
