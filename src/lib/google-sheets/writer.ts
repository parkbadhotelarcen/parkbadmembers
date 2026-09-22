import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { DataError } from "./store";
import { schemas } from "./schema";
import type {
  Identity,
  WriteGateway,
  WriteOperations,
} from "@/services/contracts";

export class AppsScriptWriter implements WriteGateway {
  async execute<K extends keyof WriteOperations>(
    operation: K,
    actor: Identity,
    input: WriteOperations[K]["input"],
  ): Promise<WriteOperations[K]["output"]> {
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
        "WRITER_NOT_CONFIGURED",
        "Registreren is nog niet beschikbaar. Neem contact op met de receptie.",
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
        "WRITE_UNCERTAIN",
        "De bevestiging ontbreekt. Probeer dezelfde boeking opnieuw; deze wordt niet dubbel aangemaakt.",
        503,
      );
    }
    if (!response.ok)
      throw new DataError(
        "WRITER_UNAVAILABLE",
        "Registreren is tijdelijk niet beschikbaar.",
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
        BUSY: [503, "Het is even druk. Probeer dezelfde aanvraag opnieuw."],
      };
      const [status, message] = messages[result?.code] ?? [
        503,
        "De gegevens konden niet worden opgeslagen.",
      ];
      throw new DataError(result?.code ?? "WRITER_ERROR", message, status);
    }
    const schema =
      operation === "createMember"
        ? schemas.Members
        : operation === "assignReward"
          ? schemas.MemberBeloningen
          : schemas.Bezoeken;
    const parsed = schema.safeParse(result.data);
    if (!parsed.success)
      throw new DataError(
        "WRITER_RESPONSE",
        "De bevestiging kon niet worden gelezen.",
        503,
      );
    return parsed.data as WriteOperations[K]["output"];
  }
}
