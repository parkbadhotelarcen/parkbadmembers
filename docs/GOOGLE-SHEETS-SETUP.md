# Google instellen voor Parkbad Members

De integratiecode werkt standaard in demostand. Zet Sheets pas aan na deze handmatige stappen. Deel geen private key, JSON-sleutelbestand, OAuth-secret of scriptgeheim in chat of Git.

## 1. Cloud-project en spreadsheet

1. Open https://console.cloud.google.com/ → projectselector bovenaan → **Nieuw project**. Naam: Parkbad Members. Selecteer dit project.
2. **API's en services → Bibliotheek → Google Sheets API → Inschakelen**.
3. Open https://sheets.google.com/ → **Leeg**. Naam: **Parkbad Members Database**.
4. Kopieer uit de URL het deel tussen `/d/` en `/edit`. Dit is **SPREADSHEET_ID** in Apps Script. Maak de spreadsheet niet openbaar.

## 2. Apps Script-gateway met LockService

Alle schrijvers moeten hetzelfde Apps Script-project gebruiken. Locks werken niet tussen verschillende scriptprojecten en blokkeren geen handmatige Sheets-edits. Laat Members, Bezoeken, MemberBeloningen en technische tellers uitsluitend via deze gateway wijzigen. Gebruik de admin-API voor goedkeuring en beloningen; beperk bewerkrechten tot vertrouwde beheerders.

1. Spreadsheet → **Extensies → Apps Script**. Naam: Parkbad Members Gateway.
2. Vervang **Code.gs** door [google-apps-script/Code.gs](../google-apps-script/Code.gs) uit deze repository.
3. Links **Services + → Google Sheets API → Toevoegen** (v4, identifier Sheets). Bij een standaard Cloud-project wordt de API automatisch geactiveerd; bij een eigen gekoppeld Cloud-project moet de Sheets API daar ook aanstaan.
4. **Projectinstellingen** (tandwiel) → **Manifestbestand appsscript.json weergeven** aanvinken. Open het bestand in de editor en gebruik [appsscript.json](../google-apps-script/appsscript.json).
5. Genereer lokaal een geheim met dit terminalcommando. Bewaar het in je wachtwoordmanager, niet in de repository:

   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`

6. **Projectinstellingen → Scriptproperties → Scriptproperty toevoegen**:
   - **SPREADSHEET_ID**: ID uit stap 1.
   - **WRITE_SECRET**: het willekeurige geheim, minimaal 32 tekens. Exact dezelfde waarde komt in Vercel als **GOOGLE_APPS_SCRIPT_SECRET**.
7. Voer `initializeDatabase` alleen uit bij een aantoonbaar lege, nieuwe database. Voer deze functie niet uit op de bestaande Parkbad Members-spreadsheet.
8. **Implementeren → Nieuwe implementatie → Type selecteren → Web-app**. **Uitvoeren als: Ik**. **Wie heeft toegang: Iedereen**. Klik **Implementeren** en autoriseer indien gevraagd. Het endpoint accepteert uitsluitend tijdgebonden HMAC-verzoeken vanuit de Next.js-server.
9. Kopieer de **Web-app-URL**, eindigend op `/exec`, naar **GOOGLE_APPS_SCRIPT_URL** in Vercel. Gebruik niet `/dev`. De publiek bereikbare gateway accepteert uitsluitend HMAC-ondertekende serververzoeken; URL-kennis geeft geen toegang tot gegevens.
10. Bij toekomstige scriptwijzigingen: **Implementeren → Implementaties beheren → Bewerken → Versie: Nieuwe versie → Implementeren**. Behoud hetzelfde scriptproject en dezelfde deployment-URL.

`lastMemberSequence` en `rewardVisitsConsumed.KV-...` worden automatisch in Instellingen aangemaakt. Wijzig of verwijder ze niet. Uitgifte en bezoekenteller worden in één atomische Sheets-batch geschreven. Unieke nummers zijn gegarandeerd voor aanvragen via deze gateway, mits de enige-schrijverregel wordt gevolgd. Providerquota blijven van toepassing; bij drukte kan een aanvraag veilig herhaald worden.

## 3. Authenticatie

Clerk beheert registratie, e-mailverificatie, wachtwoorden en sessies. Next.js haalt de Clerk-identiteit server-side op en ondertekent daarna iedere Apps Script-request. Apps Script vertrouwt nooit een MemberID uit de browser en filtert persoonlijke records op `AuthUserID`.

## 4. Vercel-variabelen en deployment

Open https://vercel.com/ → het project gekoppeld aan **parkbadhotelarcen/parkbadmembers** → **Settings → Environment Variables**. Voeg onderstaande waarden toe voor **Production**. Gebruik voor Development/Preview passende eigen configuratie. Markeer secrets als Sensitive waar de interface dit ondersteunt.

| Variabele | Waarde / bron |
| --- | --- |
| GOOGLE_APPS_SCRIPT_URL | Web-app-URL op /exec |
| GOOGLE_APPS_SCRIPT_SECRET | Exact de WRITE_SECRET-scriptproperty |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk publishable key |
| CLERK_SECRET_KEY | Clerk secret key |
| PARKBAD_ADMIN_EMAILS | Optioneel: geverifieerde e-mails van beheerders, kommagescheiden |
| PARKBAD_DATA_MODE | **sheets**, pas als alles hierboven is ingesteld |

Geen credential krijgt een NEXT_PUBLIC_-prefix. Lokaal staan waarden alleen in `.env.local`, dat door Git wordt genegeerd. `.env.example` bevat placeholders.

Controleer **Settings → Build and Deployment → Root Directory**: de repository-root waar package.json en app/ staan. Framework **Next.js**; build `npm run build`; Output Directory op frameworkstandaard. Afhankelijk van de interface kan dit onder **General** staan. Controleer **Settings → Git**: juiste repo en Production Branch **main**. Daarna **Deployments → laatste deployment → … → Redeploy**, zodat gewijzigde servervariabelen actief worden.

## 5. Controle na jouw configuratie

1. Open productie: in Sheets-stand verschijnt Google-login, nooit het demo-account.
2. Log in met een toegestaan Google-account met geverifieerd e-mailadres. Vul voornaam/achternaam in. Controleer één Members-rij met KV-001 of het eerstvolgende nummer.
3. Herlaad/log opnieuw in: hetzelfde MemberID blijft behouden.
4. Registreer een testbezoek met toekomstige datum. Controleer één PENDING-rij, zichtbaar bij Mijn boekingen, zonder extra beloningsvoortgang.
5. Probeer hetzelfde boekingsnummer in andere lettergrootte en vanuit een tweede account. Er mag geen tweede rij ontstaan.
6. Alleen de admin-allowlist mag via de admin-API goedkeuren en beloningen toekennen. Een admin-scherm en automatisch e-mailen zijn vervolgwerk. Zie [API-contracten](ARCHITECTURE.md).
7. Controleer na goedkeuring/vernieuwing voortgang, beloningen, actieve voordelen en acties binnen hun datumbereik. Open ook alle acht hoofd-URL's rechtstreeks.

Een configuratiefout toont een melding en opnieuw-ladenknop. Sheets-stand valt nooit terug op mockdata. Echte OAuth, Sheets-toegang en Apps Script moeten na deze handmatige stappen nog end-to-end worden geverifieerd.

Referenties: [Sheets batchGet](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet), [atomische batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate) en [LockService](https://developers.google.com/apps-script/reference/lock/lock-service).
