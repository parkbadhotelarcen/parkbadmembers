import "server-only";
import { JWT } from "google-auth-library";
import { headers, parseTable, type Table, type Tables } from "./schema";
import { DataError, type SheetStore } from "./store";

let auth: JWT | undefined;
function connection() {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!id || !/^[\w-]+$/.test(id) || !email || !key)
    throw new DataError(
      "CONFIGURATION",
      "De gegevenskoppeling is nog niet ingesteld.",
      503,
    );
  auth ??= new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return { id, auth };
}
async function request<T>(
  suffix: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const { id, auth } = connection();
  const token = await auth.getAccessToken();
  // Never log Google errors: those can contain request bodies and credentials.
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}${suffix}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    void error;
    throw new DataError(
      "DATASTORE_UNAVAILABLE",
      "De gegevens kunnen tijdelijk niet worden verwerkt. Probeer later opnieuw.",
      503,
    );
  }
  return response.json() as Promise<T>;
}
export class GoogleSheetsStore implements SheetStore {
  async read(tables: Table[]): Promise<Partial<Tables>> {
    const query = new URLSearchParams({
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    for (const table of tables)
      query.append(
        "ranges",
        `'${table}'!A:${String.fromCharCode(64 + headers[table].length)}`,
      );
    const data = await request<{ valueRanges: { values?: unknown[][] }[] }>(
      `/values:batchGet?${query}`,
    );
    return Object.fromEntries(
      tables.map((table, i) => [
        table,
        parseTable(table, data.valueRanges[i]?.values ?? []),
      ]),
    );
  }
}
