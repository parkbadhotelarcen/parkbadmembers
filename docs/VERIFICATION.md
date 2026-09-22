# Verificatie — 22 september 2026

- Dependencies geïnstalleerd; lint en TypeScript slagen.
- 11 tests slagen: beloningsvoortgang, drempelwijziging, invoer/schema, persoonsgegevensfilter, adminrechten, HMAC/tijdvenster, lockconflict, sequentiële nummers, dubbele boeking, idempotente retries, atomische uitgifte/teller, letterlijke celwaarden en lockvrijgave bij fouten.
- Production build slaagt. Next.js genereert expliciet `/`, `/qr-code`, `/bezoek`, `/boekingen`, `/beloningen`, `/voordelen`, `/meer` en `/profiel`. Detailroutes `/boekingen/[id]` en `/voordelen/[id]` en zes API-routefamilies zijn dynamisch.
- Alle acht hoofdschermen geven lokaal HTTP 200 met de juiste h1 en navigatie. Onbekende route geeft HTTP 404.
- Browsercontrole van alle acht schermen op 375×812, 390×844 en 430×932: geen horizontale overflow of kapotte afbeeldingen. Home visueel bekeken; vaste navigatie blijft aanwezig. Fictief bezoek in demostand succesvol aangemeld.
- GET /api/member, GET/POST /api/visits, POST /api/members, POST /api/admin/rewards en PATCH /api/admin/visits/test geven zonder sessie HTTP 401 met private,no-store. Hiervoor zijn uitsluitend lokale niet-werkende OAuth-testwaarden gebruikt; geen verzoeken naar Google.
- Git-bestanden gecontroleerd op herkenbare private-key-, Google-, GitHub- en OAuth-secretpatronen: geen treffers. `.env.local` is genegeerd; `.env.example` bevat placeholders.

De providerintegratie is getest met een gesimuleerde Sheets/Apps Script-runtime. Er is geen live Google-project, serviceaccount, OAuth-client of Apps Script-deployment aangemaakt. Echte login, providerrechten, quota en Vercel-runtimeconfiguratie moeten na de [handmatige setup](GOOGLE-SHEETS-SETUP.md) nog worden geverifieerd. De lokale build bewijst de homepage-route; ze bewijst niet zelfstandig dat het productiedomein naar het juiste Vercel-project wijst.
