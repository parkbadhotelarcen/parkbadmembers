import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { DataError } from "./store";
import { schemas, type Table, type Tables } from "./schema";
import type { SheetStore } from "./store";
import type {
  Identity,
  WriteGateway,
  WriteOperations,
} from "@/services/contracts";

type GatewayOperation = keyof WriteOperations | "readTables" | "readKnowledge";

export class AppsScriptGateway implements WriteGateway, SheetStore {
  async readKnowledge(actor: Identity): Promise<unknown> {
    return this.request("readKnowledge", actor, {});
  }
  private async request(
    operation: GatewayOperation,
    actor: Identity,
    input: unknown,
  ): Promise<unknown> {
    const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
    const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
    if (
      !endpoint ||
      !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(
        endpoint,
      ) ||
      !secret ||
      secret.length < 32
    )
      throw new DataError(
        "GATEWAY_NOT_CONFIGURED",
        "De gegevenskoppeling is nog niet ingesteld.",
        503,
      );
    const payload = JSON.stringify({
      operation,
      actor,
      input,
      issuedAt: Date.now(),
      nonce: randomUUID(),
    });
    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, signature }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      throw new DataError(
        "GATEWAY_UNAVAILABLE",
        "De gegevens zijn tijdelijk niet beschikbaar.",
        503,
      );
    }
    if (!response.ok)
      throw new DataError(
        "GATEWAY_UNAVAILABLE",
        "De gegevens zijn tijdelijk niet beschikbaar.",
        503,
      );
    const result = await response.json().catch(() => null);
    if (!result?.ok) {
      const messages: Record<string, [number, string]> = {
        DUPLICATE_BOOKING: [409, "Dit boekingsnummer is al geregistreerd."],
        CONFLICT: [409, "Deze aanvraag is al met andere gegevens verwerkt."],
        INELIGIBLE: [
          409,
          "Deze Member heeft nog onvoldoende geldige bezoeken voor een beloning.",
        ],
        FORBIDDEN: [403, "Je hebt geen toegang tot deze bewerking."],
        MEMBER_MISSING: [404, "Er is nog geen membership voor je account."],
        INVALID_INPUT: [400, "Controleer de ingevulde gegevens."],
        SCHEMA: [503, "De datastructuur moet worden gecontroleerd."],
        SCHEMA_AUTHUSERID: [503, "AuthUserID komt meer dan eenmaal voor."],
        SCHEMA_EMAIL: [503, "Het geverifieerde e-mailadres komt meer dan eenmaal voor."],
        SCHEMA_MEMBER_ID: [503, "Een MemberID heeft niet het verwachte KV-formaat."],
        SCHEMA_MEMBER_SEQUENCE: [503, "De MemberID-teller is ongeldig."],
        SCHEMA_REWARD_SETTINGS: [503, "De beloningsinstellingen zijn ongeldig."],
        BUSY: [503, "Het is even druk. Probeer dezelfde aanvraag opnieuw."],
      };
      const schemaCode = String(result?.code ?? "");
      if (schemaCode.startsWith("SCHEMA_HEADERS_"))
        throw new DataError(schemaCode, `De headers van ${schemaCode.slice(15)} wijken af.`, 503);
      if (schemaCode.startsWith("SCHEMA_PRIMARY_"))
        throw new DataError(schemaCode, `De primaire sleutel in ${schemaCode.slice(15)} ontbreekt of is dubbel.`, 503);
      const [status, message] = messages[result?.code] ?? [
        503,
        "De gegevens konden niet worden verwerkt.",
      ];
      throw new DataError(result?.code ?? "GATEWAY_ERROR", message, status);
    }
    return result.data;
  }

  async read(tables: Table[], actor: Identity): Promise<Partial<Tables>> {
    const data = await this.request("readTables", actor, { tables });
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new DataError("GATEWAY_RESPONSE", "De gegevens konden niet worden gelezen.", 503);
    const source = data as Record<string, unknown>;
    const parsed: Partial<Tables> = {};
    for (const table of tables) {
      const rows = source[table];
      if (!Array.isArray(rows))
        throw new DataError("GATEWAY_RESPONSE", "De gegevens konden niet worden gelezen.", 503);
      const values = rows.map((row) => schemas[table].parse(row));
      Object.assign(parsed, {
        [table]: values.map((value, index) => ({ row: index + 2, value })),
      });
    }
    return parsed;
  }

  async execute<K extends keyof WriteOperations>(
    operation: K,
    actor: Identity,
    input: WriteOperations[K]["input"],
  ): Promise<WriteOperations[K]["output"]> {
    const data = await this.request(operation, actor, input);
    const schema =
      operation === "activateMember"
        ? schemas.Members
        : operation === "assignReward"
          ? schemas.MemberBeloningen
          : schemas.Bezoeken;
    const parsed = schema.safeParse(data);
    if (!parsed.success)
      throw new DataError(
        "WRITER_RESPONSE",
        "De bevestiging kon niet worden gelezen.",
        503,
      );
    return parsed.data as WriteOperations[K]["output"];
  }
}
