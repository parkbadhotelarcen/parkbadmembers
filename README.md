# Parkbad Members

Mobile-first Next.js App Router + TypeScript + Tailwind CSS application for Vercel, with Lucide icons and qrcode.react. Includes a server-only Google Sheets integration, Google login and an Apps Script LockService write gateway. The default remains **demo** until you complete the [manual Google/Vercel setup](docs/GOOGLE-SHEETS-SETUP.md).

## Development

Node.js 22 LTS recommended. Run `npm ci`, `npm run dev`. Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Serve production with `npm start`.

## Structure

- `app/`: App Router at the repository root, shared layout, validated screen routes, loading/error/not-found boundaries, manifest and temporary typographic app icon.
- `src/components`: app shell/screens, reusable cards and navigation, provider with demo and authenticated Sheets modes.
- `src/lib/types.ts`: domain contracts for members, visits, benefits and rewards.
- `src/lib/mock-data.ts`: fictitious member, visits, configurable benefit content and brand asset location.
- `src/lib/loyalty.ts`: configurable reward progress and visit validation.
- `src/services/` and `src/lib/google-sheets/`: typed service layer, server-only adapters, validation and API mapping.
- `google-apps-script/`: signed, serialized write gateway and seven-tab initializer.
- `docs/`: [Google setup](docs/GOOGLE-SHEETS-SETUP.md) and [API/architecture](docs/ARCHITECTURE.md).
- `tests`: authorization, allocation/idempotency, reward eligibility, schema and booking validation.
- `public/images`: illustrative photography (not verified photographs of the hotel).

## Demo behavior

Visits added during the current client session appear in bookings with PENDING status. A full reload or demo logout restores seed data. Demo mode does not call the API or persist guest data. Sheets mode uses Google authentication and the server API; messaging and an admin screen are future work. As requested for this first version, the QR code encodes the stable demo member number `KV-001`; it does not authorize access. Demo member numbers are seeded; Sheets mode allocates sequential unique numbers under the script lock. Historical perks are separate from completed reward cycles. Progress remains at 100% until an admin award consumes the eligible visits. The supplied example dates are retained exactly, including the 2025 stay before the 2026 membership date. `demoReferenceDate` fixes the Home snapshot after 6 October so 21 November is the next visit.

## Routes

`/`, `/qr-code`, `/bezoek`, `/boekingen`, `/boekingen/[id]`, `/beloningen`, `/voordelen`, `/voordelen/thermaalbad`, `/voordelen/eten-drinken`, `/voordelen/verblijf`, `/voordelen/acties`, `/meer`, `/profiel`, `/gegevens`, `/instellingen`, `/privacy`, `/contact`, `/voorwaarden`, `/hotel`, `/welkom`.

Unknown routes return 404. Unknown demo booking IDs show a recovery state. `/admin` is not a screen yet; authenticated admin API endpoints are available.

No environment variables are needed in demo mode. Do not enter real guest data in the demo. Sheets mode validates every operation server-side; see .env.example and the setup guide.

## Original logo

Only a composite screen reference was supplied, not an original standalone logo. No logo was reconstructed. The UI therefore uses a typographic PARKBAD MEMBERS name and a temporary typographic app icon. Place the original asset under `public/brand/` and set `brand.logoSrc` in `src/lib/mock-data.ts`. The image component preserves aspect ratio using contain sizing. Replace the temporary app icon with approved assets before launch.

## Vercel

Import `parkbadhotelarcen/parkbadmembers` into Vercel, choose Next.js, project root `.`, build command `npm run build`. Demo mode requires no environment variables. Sheets mode needs the server variables in the setup guide. A linked Vercel project redeploys when main is pushed. The web manifest, viewport, theme color and icon provide the PWA foundation; offline caching/service worker and device install verification remain later work.

## Remaining launch work

Complete the manual Google configuration and live end-to-end checks. Add an admin screen, reward redemption/correction workflows, messaging, original logo, approved hotel photography, final terms/privacy and deletion policies before opening to real guests. The QR code identifies a member; it is not an authentication token.
