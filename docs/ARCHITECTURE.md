# Data- en API-contracten

Browser → Next.js API → geverifieerde Google-sessie → MemberService.
Lezen: GoogleSheetsStore → officiële Sheets API (readonly serviceaccount).
Schrijven: AppsScriptWriter → HMAC-webhook → LockService → officiële Sheets API batchUpdate.
Sheets is de enige datastore; OAuth gebruikt een versleutelde sessiecookie.

## Grenzen

- Het server-only composition root staat in src/services/index.ts. De pure MemberService kent SheetStore en WriteGateway; SQL kan deze adapters later vervangen.
- De zeven tabellen, headers en types staan in src/lib/google-sheets/schema.ts. services/portal.ts vertaalt Google-records naar UI-types.
- GET /api/member doet één batchread en filtert persoonlijke records server-side. Geen permanente PII-cache; responses zijn private,no-store. Het Google-token wordt kortlevend server-side hergebruikt.
- Identiteit komt uit Google-login met email_verified=true. Geen client-MemberID, e-mailadres of rol bij persoonlijke mutaties. Adminrollen komen bij ieder request uit de server-allowlist.
- Mutaties: JSON, maximaal 8 KiB, exacte Origin uit NEXTAUTH_URL, strikte invoer. Sessies verlopen na acht uur. De gateway controleert HMAC en tijdvenster vóór datatoegang. Ondersteunde mutaties zijn idempotent: replay kan geen tweede member/bezoek/beloning maken.
- De scriptlock omvat lezen, valideren en atomisch schrijven. Herhaal bij onzekere bevestiging dezelfde aanvraag met dezelfde Idempotency-Key. ScriptProperties bevatten alleen spreadsheet-ID en secret; zakelijke data en tellers staan in Sheets.
- Locks gelden niet voor handmatige editors of andere scriptprojecten. Laat transactionele tabbladen uitsluitend via deze gateway schrijven. Bescherm headers, identiteitkolommen en technische tellers tegen handmatige edits.

## Endpoints

| Endpoint | Invoer | Toegang |
| --- | --- | --- |
| GET /api/member | geen | eigen portaldata |
| POST /api/members | firstName, lastName | eigen membership; email uit sessie |
| GET /api/visits | geen | eigen bezoeken |
| POST /api/visits | bookingNumber, arrivalDate; Idempotency-Key = UUIDv4 | eigen actieve membership |
| PATCH /api/admin/visits/:id | status | admin |
| POST /api/admin/rewards | memberId, rewardId; Idempotency-Key = UUIDv4 | admin |
| /api/auth/* | NextAuth Google OAuth / CSRF / sessie | NextAuth |

Mutaties gebruiken same-origin fetch met Content-Type application/json en sessiecookie. Genereer één stabiele UUIDv4 per logische registratie/uitgifte met crypto.randomUUID(). Een admin kan de endpoints vanuit een geauthenticeerde same-origin beheertool aanroepen. Een volledig admin-scherm is vervolgwerk.

Statusovergangen: PENDING → APPROVED of REJECTED; APPROVED → COMPLETED. Dezelfde status herhalen doet niets. Alleen APPROVED/COMPLETED tellen. Goedkeuring krijgt serverdatum en geverifieerd admin-e-mailadres. Een goedgekeurd bezoek wordt niet alsnog afgewezen: zo worden reeds uitgegeven beloningen niet achteraf ongeldig. Een correctieworkflow is vervolgwerk.

Beloningen worden expliciet toegekend door een admin bij voldoende bezoeken. De uitgifte consumeert de actuele drempel uit Instellingen. Exact verbruikte bezoeken blijven behouden als de drempel wijzigt. AVAILABLE/REDEEMED/EXPIRED worden gelezen en getoond. Inwisselen/vervallen via een beveiligde workflow is vervolgwerk.

Voordelen: BenefitID is een unieke lowercase slug zoals thermaalbad; Titel/Omschrijving/Categorie zijn tekst; Afbeelding is een lokaal pad of HTTPS-afbeelding; Actief TRUE/FALSE. Externe afbeeldingen worden door de browser geladen, niet door de Next-imageproxy. Gebruik vertrouwde publieke afbeeldingen. Acties verschijnen alleen wanneer Actief TRUE en de Amsterdamse datum tussen StartDatum/EindDatum ligt, inclusief beide grenzen.

Voer datums in als ISO-tekst YYYY-MM-DD en timestamps als ISO-tekst. De gateway schrijft waarden als letterlijke tekst, nooit als formules. Instellingen: visitsRequiredForReward (1–100), lastMemberSequence (automatisch), rewardVisitsConsumed.KV-xxx (automatisch). Behoud technische tellers bij opschonen. Importeer geen historische beloningen zonder de bijbehorende verbruiksteller te migreren.

## Verificatie

Voer npm run lint, npm run typecheck, npm test en npm run build uit. Start de productiebuild met npm run start -- --port 3300. Voer npm run test:routes -- http://localhost:3300 uit in demostand. Tests simuleren Sheets-batches en Apps Script zonder credentials; providerquota en live Google-configuratie zijn hiermee niet getest.

De App Router staat uitsluitend in app/. app/page.tsx definieert expliciet /. Alle hoofdschermen hebben eigen page.tsx; details zijn dynamisch. Geen redirects, rewrites, middleware of export-only configuratie onderscheppen de homepage.
