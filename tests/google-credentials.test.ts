import assert from "node:assert/strict";
import test from "node:test";
import {
  googleCredentialFailure,
  hasPrivateKeyEnvelope,
  normalizeGooglePrivateKey,
} from "../src/lib/google-sheets/credentials";

const body = "REDACTED_TEST_MATERIAL";
const pem = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;

test("private key normalization supports real and escaped newlines", () => {
  assert.equal(normalizeGooglePrivateKey(pem), pem);
  assert.equal(normalizeGooglePrivateKey(pem.replaceAll("\n", "\\n")), pem);
  assert.equal(
    normalizeGooglePrivateKey(`"${pem.replaceAll("\n", "\\n")}"`),
    pem,
  );
  assert.equal(
    normalizeGooglePrivateKey(pem.replaceAll("\n", "\\r\\n")),
    pem,
  );
});

test("private key envelope rejects partial or unrelated values", () => {
  assert.equal(hasPrivateKeyEnvelope(pem), true);
  assert.equal(hasPrivateKeyEnvelope(body), false);
  assert.equal(
    hasPrivateKeyEnvelope(`-----BEGIN PRIVATE KEY-----\n${body}`),
    false,
  );
});

test("credential failures distinguish key parsing from rejected credentials", () => {
  assert.equal(
    googleCredentialFailure(new Error("error:1E08010C:DECODER routines")),
    "GOOGLE_PRIVATE_KEY_INVALID_FORMAT",
  );
  assert.equal(
    googleCredentialFailure(new Error("invalid_grant")),
    "GOOGLE_CREDENTIALS_REJECTED",
  );
});
