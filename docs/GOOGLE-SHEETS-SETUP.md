# Google instellen voor Parkbad Members

De integratiecode werkt standaard in demostand. Zet Sheets pas aan na deze handmatige stappen. Deel geen private key, JSON-sleutelbestand, OAuth-secret of scriptgeheim in chat of Git.

## 1. Cloud-project en spreadsheet

1. Open https://console.cloud.google.com/ → projectselector bovenaan → **Nieuw project**. Naam: Parkbad Members. Selecteer dit project.
2. **API's en services → Bibliotheek → Google Sheets API → Inschakelen**.
3. Open https://sheets.google.com/ → **Leeg**. Naam: **Parkbad Members Database**.
4. Kopieer uit de URL het deel tussen `/d/` en `/edit`. Dit is **GOOGLE_SHEETS_SPREADSHEET_ID** in Vercel en **SPREADSHEET_ID** in Apps Script. Maak de spreadsheet niet openbaar.

## 2. Serviceaccount voor lezen

1. Google Cloud → **IAM en beheer → Serviceaccounts → Serviceaccount maken**. Naam: parkbad-members-reader. Projectrollen zijn voor deze toegang niet nodig.
2. Open het account → **Sleutels → Sleutel toevoegen → Nieuwe sleutel maken → JSON → Maken**. Bewaar de download beveiligd, buiten de repository.
3. Kopieer `client_email` uit het JSON-bestand naar **GOOGLE_SERVICE_ACCOUNT_EMAIL** in Vercel.
4. Kopieer de volledige `private_key`-waarde naar **GOOGLE_PRIVATE_KEY** in Vercel, inclusief begin/eindregels. Echte nieuwe regels en letterlijke `\n` worden ondersteund. Kopieer niet het hele JSON-document.
5. Spreadsheet → **Delen** → voeg dit serviceaccount-e-mailadres toe als **Kijker**. Next.js gebruikt alleen de readonly Sheets-scope. Apps Script schrijft onder de eigenaar.

## 3. Apps Script met LockService

Alle schrijvers moeten hetzelfde Apps Script-project gebruiken. Locks werken niet tussen verschillende scriptprojecten en blokkeren geen handmatige Sheets-edits. Laat Members, Bezoeken, MemberBeloningen en technische tellers uitsluitend via deze gateway wijzigen. Gebruik de admin-API voor goedkeuring en beloningen; beperk bewerkrechten tot vertrouwde beheerders.

1. Spreadsheet → **Extensies → Apps Script**. Naam: Parkbad Members Writer.
2. Vervang **Code.gs** door [google-apps-script/Code.gs](../google-apps-script/Code.gs) uit deze repository.
3. Links **Services + → Google Sheets API → Toevoegen** (v4, identifier Sheets). Bij een standaard Cloud-project wordt de API automatisch geactiveerd; bij een eigen gekoppeld Cloud-project moet de Sheets API daar ook aanstaan.
4. **Projectinstellingen** (tandwiel) → **Manifestbestand appsscript.json weergeven** aanvinken. Open het bestand in de editor en gebruik [appsscript.json](../google-apps-script/appsscript.json).
5. Genereer lokaal twee verschillende geheimen door tweemaal dit terminalcommando uit te voeren. Bewaar ze in je wachtwoordmanager, niet in de repository:

   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`

6. **Projectinstellingen → Scriptproperties → Scriptproperty toevoegen**:
   - **SPREADSHEET_ID**: ID uit stap 1.
   - **WRITE_SECRET**: het eerste willekeurige geheim, minimaal 32 tekens. Exact dezelfde waarde komt in Vercel als **GOOGLE_APPS_SCRIPT_SECRET**.
7. Kies bovenaan in de editor de functie **initializeDatabase → Uitvoeren → Machtigingen bekijken**. Selecteer de eigenaar en geef het eigen script Sheets-toegang. De functie maakt zeven tabbladen met exacte headers en `visitsRequiredForReward = 4`. Ze wist geen bestaande data; afwijkende headers geven een fout.
8. **Implementeren → Nieuwe implementatie → Type selecteren → Web-app**. **Uitvoeren als: Ik**. **Wie heeft toegang: Iedereen**. Klik **Implementeren** en autoriseer indien gevraagd. Als Workspace anonieme web-apps verbiedt, moet je beheerder dit toestaan.
9. Kopieer de **Web-app-URL**, eindigend op `/exec`, naar **GOOGLE_APPS_SCRIPT_URL** in Vercel. Gebruik niet `/dev`. De publiek bereikbare gateway accepteert uitsluitend HMAC-ondertekende serververzoeken; URL-kennis geeft geen toegang tot gegevens.
10. Bij toekomstige scriptwijzigingen: **Implementeren → Implementaties beheren → Bewerken → Versie: Nieuwe versie → Implementeren**. Behoud hetzelfde scriptproject en dezelfde deployment-URL.

`lastMemberSequence` en `rewardVisitsConsumed.KV-...` worden automatisch in Instellingen aangemaakt. Wijzig of verwijder ze niet. Uitgifte en bezoekenteller worden in één atomische Sheets-batch geschreven. Unieke nummers zijn gegarandeerd voor aanvragen via deze gateway, mits de enige-schrijverregel wordt gevolgd. Providerquota blijven van toepassing; bij drukte kan een aanvraag veilig herhaald worden.

## 4. Google-login

1. Google Cloud → **Google Auth Platform → Branding** (eventueel eerst **Aan de slag**). Vul appnaam Parkbad Members, supportadres en contactadres in. Configureer **Audience/Doelgroep: External/Extern** voor hotelgasten buiten je organisatie.
2. Vul geautoriseerde domeinen en door Google gevraagde app-/privacygegevens in voor je eigen domein. Publiceer voor lancering het definitieve privacybeleid; de app bevat hiervoor nog voorlopige tekst.
3. Testmodus: **Audience/Doelgroep → Test users/Testgebruikers → Add users**. Voeg de testaccounts toe. Voor alle gasten moet je later de publicatie/vereisten van Google afronden.
4. **Clients → Create client → Web application/Webapplicatie**. Naam: Parkbad Members Web.
5. **Authorized JavaScript origin**: `https://parkbadmembers.vercel.app`.
6. **Authorized redirect URI**: exact `https://parkbadmembers.vercel.app/api/auth/callback/google`.
7. Kopieer **Client ID** naar **GOOGLE_OAUTH_CLIENT_ID** en **Client secret** naar **GOOGLE_OAUTH_CLIENT_SECRET** in Vercel. Deze webclient staat los van het serviceaccount.
8. Lokaal testen: voeg `http://localhost:3000` en `http://localhost:3000/api/auth/callback/google` toe. Gebruik lokaal `NEXTAUTH_URL=http://localhost:3000`. Previews hebben een vast previewdomein met bijpassende callback/config nodig; geef onbekende previews geen productiesecrets.

## 5. Vercel-variabelen en deployment

Open https://vercel.com/ → het project gekoppeld aan **parkbadhotelarcen/parkbadmembers** → **Settings → Environment Variables**. Voeg onderstaande waarden toe voor **Production**. Gebruik voor Development/Preview passende eigen configuratie. Markeer secrets als Sensitive waar de interface dit ondersteunt.

| Variabele | Waarde / bron |
| --- | --- |
| GOOGLE_SHEETS_SPREADSHEET_ID | ID uit spreadsheet-URL |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | client_email uit serviceaccount-JSON |
| GOOGLE_PRIVATE_KEY | volledige private_key uit serviceaccount-JSON |
| GOOGLE_APPS_SCRIPT_URL | Web-app-URL op /exec |
| GOOGLE_APPS_SCRIPT_SECRET | Exact de WRITE_SECRET-scriptproperty |
| GOOGLE_OAUTH_CLIENT_ID | Google Auth Platform → webclient → Client ID |
| GOOGLE_OAUTH_CLIENT_SECRET | Google Auth Platform → webclient → Client secret |
| NEXTAUTH_URL | https://parkbadmembers.vercel.app |
| NEXTAUTH_SECRET | Het tweede, afzonderlijke willekeurige geheim |
| PARKBAD_ADMIN_EMAILS | Optioneel: Google-e-mails van beheerders, kommagescheiden |
| PARKBAD_DATA_MODE | **sheets**, pas als alles hierboven is ingesteld |

Geen credential krijgt een NEXT_PUBLIC_-prefix. Lokaal staan waarden alleen in `.env.local`, dat door Git wordt genegeerd. `.env.example` bevat placeholders.

Controleer **Settings → Build and Deployment → Root Directory**: de repository-root waar package.json en app/ staan. Framework **Next.js**; build `npm run build`; Output Directory op frameworkstandaard. Afhankelijk van de interface kan dit onder **General** staan. Controleer **Settings → Git**: juiste repo en Production Branch **main**. Daarna **Deployments → laatste deployment → … → Redeploy**, zodat gewijzigde servervariabelen actief worden.

## 6. Controle na jouw configuratie

1. Open productie: in Sheets-stand verschijnt Google-login, nooit het demo-account.
2. Log in met een toegestaan Google-account met geverifieerd e-mailadres. Vul voornaam/achternaam in. Controleer één Members-rij met KV-001 of het eerstvolgende nummer.
3. Herlaad/log opnieuw in: hetzelfde MemberID blijft behouden.
4. Registreer een testbezoek met toekomstige datum. Controleer één PENDING-rij, zichtbaar bij Mijn boekingen, zonder extra beloningsvoortgang.
5. Probeer hetzelfde boekingsnummer in andere lettergrootte en vanuit een tweede account. Er mag geen tweede rij ontstaan.
6. Alleen de admin-allowlist mag via de admin-API goedkeuren en beloningen toekennen. Een admin-scherm en automatisch e-mailen zijn vervolgwerk. Zie [API-contracten](ARCHITECTURE.md).
7. Controleer na goedkeuring/vernieuwing voortgang, beloningen, actieve voordelen en acties binnen hun datumbereik. Open ook alle acht hoofd-URL's rechtstreeks.

Een configuratiefout toont een melding en opnieuw-ladenknop. Sheets-stand valt nooit terug op mockdata. Echte OAuth, Sheets-toegang en Apps Script moeten na deze handmatige stappen nog end-to-end worden geverifieerd.

Referenties: [Sheets batchGet](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet), [atomische batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service), [serviceaccounts](https://developers.google.com/identity/protocols/oauth2/service-account), [Google-login](https://next-auth.js.org/providers/google).
