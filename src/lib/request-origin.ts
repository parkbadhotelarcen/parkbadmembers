export const PARKBAD_PRODUCTION_ORIGIN = "https://parkbadmembers.vercel.app";

export function hasValidMutationOrigin(request: Request) {
  return (
    request.headers.get("origin") === PARKBAD_PRODUCTION_ORIGIN &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
