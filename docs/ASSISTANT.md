# Parkhotel Assistent

De interface staat op `/assistant`, bereikbaar vanaf Home en Meer. De bestaande Clerk-/membertoegang blijft behouden. De chat is algemene gastinformatie en voert geen boekingsacties uit.

## Architectuur
`components/chat/assistant.tsx` → `app/api/chat/route.ts` → `lib/knowledge/source.ts` → bestaande `AppsScriptGateway` → retrieval → `lib/ai/provider.ts`.

De provider gebruikt de officiële Vercel AI Gateway REST API. Alleen server-side. Er wordt geen accountinformatie aan het model toegevoegd. De laatste zes berichten (maximaal 1200 tekens elk), maximaal vijf kennisitems en een strikte systeeminstructie worden verzonden. Veelvoorkomende e-mailadressen en lange nummers worden geredigeerd; dit is geen volledige PII-detectie. Chats blijven alleen in het geheugen van de browser en worden niet in Sheets opgeslagen. Providers kunnen eigen bewaarbeleid hebben.

## Configuratie
Bestaande `GOOGLE_APPS_SCRIPT_URL` en `GOOGLE_APPS_SCRIPT_SECRET` worden hergebruikt. Geen service account.
Nieuwe server-only Production-variabelen:
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway-key, Sensitive.
- `PARKHOTEL_AI_MODEL`: exact model-ID uit de Gateway-catalogus, bijvoorbeeld een door de beheerder gekozen chatmodel. Geen default om onbedoelde kosten te vermijden.

Ontbrekende AI-configuratie breekt de build niet. Bij een relevante bron en ontbrekende provider verschijnt een vriendelijke fout. Bij ontbrekende kennis volgt een receptieverwijzing zonder AI-aanroep.

## Google Sheets
Deploy de gewijzigde `google-apps-script/Code.gs` als nieuwe versie van de bestaande Web App. Behoud URL en WRITE_SECRET. Voer initializeDatabase niet uit. De nieuwe readKnowledge-operatie is HMAC-beveiligd en leest uitsluitend CHATBOT_KNOWLEDGE, zonder andere sheets te veranderen. Deze tabel is bewust niet toegevoegd aan PB_HEADERS zodat oude memberbewerkingen onafhankelijk blijven.

Voeg handmatig, na akkoord, het tabblad `CHATBOT_KNOWLEDGE` toe met rij 1 exact:
`id | category | question | answer | keywords | active | updated_at`
Iedere waarde hoort in een eigen kolom A:G. Maximaal 1000 rijen. Verplicht: unieke id, category, question, answer en active=TRUE. keywords en updated_at mogen leeg zijn. Gebruik ISO-datums voor updated_at. Categorieën: Hotel, Thermaalbad, Restaurants, Park, Members, Contact. Beheer alleen goedgekeurde feiten. Gebruik komma-gescheiden meertalige trefwoorden. Zet active op FALSE om een antwoord uit te schakelen. Geen persoonsgegevens of secrets in deze kennisbank.

## Retrieval en fallback
Eenvoudige meertalige trefwoordgroepen en recente gebruikersvragen selecteren maximaal vijf bronnen. Alleen active=TRUE. Lege/beschadigde regels worden overgeslagen. Bij een bereikbare lege kennisbank wordt geen verouderde fallback toegevoegd. Bij een leesfout wordt `lib/knowledge/fallback.ts` gebruikt: uitsluitend geverifieerde appinformatie, geen verzonnen hotelbeleid of tijden.

NL/DE/EN worden herkend en aan het model doorgegeven; onbekende onderwerpen krijgen een vertaalde vaste receptieverwijzing. De systeeminstructie verbiedt nieuwe feiten en het opvolgen van instructies in kennisdata. Dit vermindert hallucinaties maar een generatief model is niet formeel foutvrij: test goedgekeurde content voor publicatie.

## Beveiliging en grenzen
Clerk vereist een geverifieerd account. Bestaande Origin-/JSON-controle en streaming bodylimiet van 8 KiB worden hergebruikt. Alleen user/assistant-rollen, maximaal zes berichten. Clientlock, timeout en serverlimiet: tien aanvragen per minuut per account per warme serverinstance, maximaal één gelijktijdige aanvraag. Dit is geen gedistribueerde limiet: configureer Vercel WAF rate limiting voor `/api/chat` en een Gateway-budget voor harde productiegrenzen. Geen prompts, accountdata of provider-responsebody in logs.

## Andere provider
Implementeer `ChatProvider.answer` en vervang de constructie in de chatroute. Houd de systeeminstructie, kennisgrenzen, timeouts en server-only grens in stand.

## Verificatie
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
Unit tests controleren grenzen, taal, retrieval, fallback en redactie; bestaande Apps Script-tests controleren memberisolatie/HMAC/idempotentie. Echte modelkwaliteit vereist een geconfigureerde provider en goedgekeurde kennis. iOS/Android-toetsenbordgedrag moet op echte apparaten worden gecontroleerd; de chat gebruikt 100dvh en één scrollgebied met flex-composer.
