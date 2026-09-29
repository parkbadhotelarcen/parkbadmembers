import assert from "node:assert/strict";
import test from "node:test";
import {
  hasValidMutationOrigin,
  PARKBAD_PRODUCTION_ORIGIN,
} from "../src/lib/request-origin";

function request(origin: string | null, site = "same-origin") {
  const headers = new Headers({ "sec-fetch-site": site });
  if (origin) headers.set("origin", origin);
  return new Request(`${PARKBAD_PRODUCTION_ORIGIN}/api/members`, {
    method: "POST",
    headers,
  });
}

test("accepts mutations only from the fixed production origin", () => {
  assert.equal(hasValidMutationOrigin(request(PARKBAD_PRODUCTION_ORIGIN)), true);
});

test("rejects missing, preview, foreign and cross-site origins", () => {
  assert.equal(hasValidMutationOrigin(request(null)), false);
  assert.equal(
    hasValidMutationOrigin(
      request("https://parkbadmembers-nvgw-seven.vercel.app"),
    ),
    false,
  );
  assert.equal(
    hasValidMutationOrigin(request("https://attacker.example")),
    false,
  );
  assert.equal(
    hasValidMutationOrigin(request(PARKBAD_PRODUCTION_ORIGIN, "cross-site")),
    false,
  );
});
