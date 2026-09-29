export function normalizeGooglePrivateKey(raw: string | undefined) {
  let value = raw?.trim() ?? "";
  const quoted =
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")));
  if (quoted) value = value.slice(1, -1);
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function hasPrivateKeyEnvelope(value: string) {
  return (
    value.startsWith("-----BEGIN PRIVATE KEY-----\n") &&
    value.endsWith("\n-----END PRIVATE KEY-----")
  );
}

export function googleCredentialFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  if (
    /pem|private key|decoder|asn1|unsupported|bad decrypt/i.test(message) ||
    code.startsWith("ERR_OSSL_")
  )
    return "GOOGLE_PRIVATE_KEY_INVALID_FORMAT" as const;
  return "GOOGLE_CREDENTIALS_REJECTED" as const;
}
