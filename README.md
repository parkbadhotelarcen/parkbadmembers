# Parkbad Members

Mobile-first Next.js App Router + TypeScript + Tailwind CSS application for Vercel, with Lucide icons and qrcode.react. Phase 1 is a **mock-data demonstration**, not a live loyalty service.

## Development

Node.js 22 LTS recommended. Run `npm ci`, `npm run dev`. Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Serve production with `npm start`.

## Structure

- `app/`: App Router at the repository root, shared layout, validated screen routes, loading/error/not-found boundaries, manifest and temporary typographic app icon.
- `src/components`: app shell/screens, reusable cards and navigation, in-memory mock repository provider.
- `src/lib/types.ts`: domain contracts for members, visits, benefits and rewards.
- `src/lib/mock-data.ts`: fictitious member, visits, configurable benefit content and brand asset location.
- `src/lib/loyalty.ts`: configurable reward progress and visit validation.
- `tests`: reward eligibility, cycle boundaries and booking validation.
- `public/images`: illustrative photography (not verified photographs of the hotel).

## Demo behavior

Visits added during the current client session appear in bookings with PENDING status. A full reload or demo logout restores seed data. There is no API, database, authentication, messaging or admin access. As requested for this first version, the QR code encodes the stable demo member number `KV-001`; it does not authorize access. Member numbers are seeded, not generated yet. Historical perks are separate from completed reward cycles. Progress remains at 100% until a future backend transaction awards the reward and advances the cycle. The supplied example dates are retained exactly, including the 2025 stay before the 2026 membership date. `demoReferenceDate` fixes the Home snapshot after 6 October so 21 November is the next visit.

## Routes

`/`, `/qr-code`, `/bezoek`, `/boekingen`, `/boekingen/[id]`, `/beloningen`, `/voordelen`, `/voordelen/thermaalbad`, `/voordelen/eten-drinken`, `/voordelen/verblijf`, `/voordelen/acties`, `/meer`, `/profiel`, `/gegevens`, `/instellingen`, `/privacy`, `/contact`, `/voorwaarden`, `/hotel`, `/welkom`.

Unknown routes return 404. Unknown demo booking IDs show a recovery state. `/admin` is intentionally absent until server-side authentication is implemented.

No environment variables or secrets are required. Do not enter real guest data in the demonstration. Forms currently validate on the client only, appropriate for this non-persistent demonstration.

## Original logo

Only a composite screen reference was supplied, not an original standalone logo. No logo was reconstructed. The UI therefore uses a typographic PARKBAD MEMBERS name and a temporary typographic app icon. Place the original asset under `public/brand/` and set `brand.logoSrc` in `src/lib/mock-data.ts`. The image component preserves aspect ratio using contain sizing. Replace the temporary app icon with approved assets before launch.

## Vercel

Import `parkbadhotelarcen/parkbadmembers` into Vercel, choose Next.js, project root `.`, build command `npm run build`. No environment variables required in this phase. This repository does not create a Vercel deployment automatically. The web manifest, viewport, theme color and icon provide the PWA foundation; offline caching/service worker and device install verification remain later work.

## Next phase: real service

Replace the mock provider with authenticated server-side reads/mutations. Add USERS, VISITS, REWARDS, USER_REWARDS, BENEFITS and PROMOTIONS storage, role-based server authorization, unique case-normalized booking numbers, atomic member-number allocation, audited moderation and transactional/idempotent reward cycle awards. Never rely on client-provided member IDs or roles. Members may only read their own records; admins require server-side authorization. Add approved hotel photography, original logo, final terms/privacy content, OAuth and deletion policies before opening to real guests.
