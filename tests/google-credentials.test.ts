import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import {
  googleCredentialFailure,
  hasPrivateKeyEnvelope,
  normalizeGooglePrivateKey,
} from "../src/lib/google-sheets/credentials";

const pem = generateKeyPairSync("rsa", { modulusLength: 1024 })
  .privateKey.export({ format: "pem", type: "pkcs8" })
  .toString()
  .trim();

test("private key normalization supports real and escaped newlines", () => {
  assert.equal(normalizeGooglePrivateKey(pem), pem);
  assert.equal(normalizeGooglePrivateKey(pem.replaceAll("\n", "\\n")), pem);
  assert.equal(
    normalizeGooglePrivateKey(`"${pem.replaceAll("\n", "\\n")}"`),
    pem,
  );
  assert.equal(
    normalizeGooglePrivateKey(pem.replaceAll("\n", "\r\n")),
    pem,
  );
  assert.equal(
    normalizeGooglePrivateKey(pem.replaceAll("\n", "\\r\\n")),
    pem,
  );
});

test("private key normalization restores PEM whitespace without changing data", () => {
  assert.equal(normalizeGooglePrivateKey(pem.replaceAll("\n", " ")), pem);
});

test("private key normalization preserves empty and damaged values for rejection", () => {
  assert.equal(normalizeGooglePrivateKey(undefined), "");
  assert.equal(normalizeGooglePrivateKey(""), "");
  assert.equal(normalizeGooglePrivateKey("damaged"), "damaged");
  assert.equal(hasPrivateKeyEnvelope(normalizeGooglePrivateKey("damaged")), false);
});

test("private key envelope rejects partial or unrelated values", () => {
  assert.equal(hasPrivateKeyEnvelope(pem), true);
  assert.equal(hasPrivateKeyEnvelope("REDACTED_TEST_MATERIAL"), false);
  assert.equal(
    hasPrivateKeyEnvelope("-----BEGIN PRIVATE KEY-----\nPARTIAL"),
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
