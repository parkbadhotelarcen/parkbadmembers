import assert from "node:assert/strict";

const base = process.argv[2] || "http://localhost:3100";
const routes = [
  ["/", "Goedemiddag, Milan"],
  ["/qr-code", "Mijn QR-code"],
  ["/bezoek", "Nieuw bezoek registreren"],
  ["/boekingen", "Mijn boekingen"],
  ["/beloningen", "Beloningsvoortgang"],
  ["/voordelen", "Mijn voordelen"],
  ["/meer", "Meer"],
  ["/profiel", "Mijn profiel"],
];

for (const [path, expected] of routes) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${path} must return HTTP 200`);
  const html = await response.text();
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]*>/g, "");
  assert.ok(heading?.includes(expected), `${path} must render its own heading, got ${heading}`);
  assert.ok(html.includes('aria-label="Hoofdnavigatie"'), `${path} must render the app navigation`);
  console.log(`PASS ${path} — HTTP 200 — ${heading}`);
}

const missing = await fetch(new URL("/this-route-does-not-exist", base), { redirect: "manual", signal: AbortSignal.timeout(30000) });
assert.equal(missing.status, 404, "Unknown routes must remain 404");
console.log("PASS unknown route — HTTP 404");
