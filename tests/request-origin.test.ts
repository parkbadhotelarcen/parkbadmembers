import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedMutationOrigins,
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

const deploymentEnv = {
  VERCEL_PROJECT_PRODUCTION_URL: "parkbadmembers-nvgw-seven.vercel.app",
  VERCEL_URL: "parkbadmembers-nvgw-8eropb2qv-parkhotelarcen.vercel.app",
};

test("accepts mutations from the canonical and active Vercel production origins", () => {
  assert.equal(hasValidMutationOrigin(request(PARKBAD_PRODUCTION_ORIGIN)), true);
  for (const origin of allowedMutationOrigins(deploymentEnv)) {
    assert.equal(hasValidMutationOrigin(request(origin), deploymentEnv), true);
  }
});

test("rejects missing, unknown, malformed and cross-site origins", () => {
  assert.equal(hasValidMutationOrigin(request(null)), false);
  assert.equal(
    hasValidMutationOrigin(
      request("https://unknown-preview.vercel.app"),
      deploymentEnv,
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
  assert.deepEqual(
    [...allowedMutationOrigins({ VERCEL_URL: "https://attacker.example/path" })],
    [PARKBAD_PRODUCTION_ORIGIN],
  );
});
