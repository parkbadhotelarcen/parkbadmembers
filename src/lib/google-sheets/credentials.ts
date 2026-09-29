export function normalizeGooglePrivateKey(raw: string | undefined) {
  let value = raw?.replace(/^\uFEFF/, "").trim() ?? "";
  const quoted = value.match(/^(["'])([\s\S]*)\1$/);
  if (quoted) value = quoted[2];

  value = value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  const begin = "-----BEGIN PRIVATE KEY-----";
  const end = "-----END PRIVATE KEY-----";
  if (!value.startsWith(begin) || !value.endsWith(end)) return value;

  // PEM whitespace is representational. Re-folding only whitespace makes the
  // value robust when a dashboard turns line breaks into CRLF or spaces while
  // preserving every base64 character exactly.
  const body = value.slice(begin.length, -end.length).replace(/\s/g, "");
  if (!body || !/^[A-Za-z0-9+/=]+$/.test(body)) return value;
  const lines = body.match(/.{1,64}/g) ?? [];
  return `${begin}\n${lines.join("\n")}\n${end}`;
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
