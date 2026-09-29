export const PARKBAD_PRODUCTION_ORIGIN = "https://parkbadmembers.vercel.app";

type VercelOrigins = {
  [key: string]: string | undefined;
  VERCEL_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

function vercelOrigin(host: string | undefined) {
  const normalized = host?.trim().toLowerCase();
  return normalized && /^[a-z0-9][a-z0-9.-]*\.vercel\.app$/.test(normalized)
    ? `https://${normalized}`
    : null;
}

export function allowedMutationOrigins(env: VercelOrigins = process.env) {
  return new Set(
    [
      PARKBAD_PRODUCTION_ORIGIN,
      vercelOrigin(env.VERCEL_PROJECT_PRODUCTION_URL),
      vercelOrigin(env.VERCEL_URL),
    ].filter((origin): origin is string => Boolean(origin)),
  );
}

export function hasValidMutationOrigin(
  request: Request,
  env: VercelOrigins = process.env,
) {
  const origin = request.headers.get("origin")?.toLowerCase();
  return Boolean(
    origin &&
      allowedMutationOrigins(env).has(origin) &&
      request.headers.get("sec-fetch-site") !== "cross-site",
  );
}
