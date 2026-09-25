import "server-only";
import { z } from "zod";
import { DataError } from "./google-sheets/store";
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
export async function endpoint(run: () => Promise<unknown>) {
  try {
    return json(await run());
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        { code: "INVALID_INPUT", message: "Controleer de ingevulde gegevens." },
        400,
      );
    if (error instanceof DataError)
      return json({ code: error.code, message: error.message }, error.status);
    if (error instanceof Error) {
      const schemaFailure = error.message.match(
        /^(Ongeldige kolomkoppen|Ongeldige gegevens) in ([A-Za-z]+)(?:, rij (\d+))?$/,
      );
      if (schemaFailure) {
        const [, reason, table, row] = schemaFailure;
        const location = row ? `, rij ${row}` : "";
        const message =
          reason === "Ongeldige kolomkoppen"
            ? `Controleer de kolomkoppen van ${table}.`
            : `Controleer de gegevens in ${table}${location}.`;
        return json({ code: "SHEET_SCHEMA_INVALID", message }, 503);
      }
    }
    return json(
      {
        code: "UNAVAILABLE",
        message:
          "Je gegevens zijn tijdelijk niet beschikbaar. Probeer het opnieuw of neem contact op met de receptie.",
      },
      503,
    );
  }
}
export async function input(request: Request): Promise<unknown> {
  const origin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : null;
  if (
    !origin ||
    request.headers.get("origin") !== origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new DataError("FORBIDDEN", "Ongeldige herkomst.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new DataError("INVALID_INPUT", "JSON verwacht.");
  const reader = request.body?.getReader();
  if (!reader) throw new DataError("INVALID_INPUT", "Invoer ontbreekt.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      throw new DataError("INVALID_INPUT", "Invoer te groot.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new DataError("INVALID_INPUT", "Ongeldige JSON.");
  }
}
export function requestId(request: Request) {
  return z.uuid().parse(request.headers.get("idempotency-key"));
}
