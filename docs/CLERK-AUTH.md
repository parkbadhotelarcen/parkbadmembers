# Clerk-authenticatie

Parkbad Members gebruikt Clerk als enige actieve sessiebron. Clerk beheert wachtwoorden,
e-mailverificatie, herstelcodes en sessies. Google Sheets bevat geen wachtwoorden,
tokens of hashes en blijft de datastore voor membership, bezoeken en beloningen.

## Memberkoppeling

`Members` gebruikt deze kolomvolgorde:

`MemberID | AuthUserID | Voornaam | Achternaam | Email | LidSinds | Niveau | Status | CreatedAt | UpdatedAt`

`AuthUserID` is leeg voor een bestaand account totdat de member zich met hetzelfde,
door Clerk geverifieerde e-mailadres registreert. De Apps Script-gateway voert onder
`LockService` één van deze acties uit:

- bestaand `AuthUserID`: hetzelfde memberrecord teruggeven;
- bestaande unieke e-mail met leeg `AuthUserID`: de Clerk-ID aan dat record koppelen;
- onbekende e-mail: atomair een nieuw uniek `KV-nummer` en memberrecord maken;
- een e-mail of Clerk-ID die al conflicterend is gekoppeld: weigeren.

Alle memberdata wordt na activatie uitsluitend via `AuthUserID` geselecteerd. URL- of
bodyparameters kunnen daardoor geen ander memberaccount selecteren.

## Handmatige productieconfiguratie

1. Voeg in het bestaande tabblad `Members` kolom B toe met header `AuthUserID`.
   Bestaande rijen blijven leeg; verschuif de overige kolommen zonder gegevensverlies.
2. Vervang Apps Script `Code.gs` door de versie uit deze repository en maak via
   **Implementaties beheren → Bewerken → Nieuwe versie → Implementeren** een nieuwe
   versie van dezelfde web-app. Behoud URL en scriptproperties.
3. Controleer in Vercel Production dat de Marketplace-integratie
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` en `CLERK_SECRET_KEY` heeft toegevoegd.
   De secret key is Sensitive en mag nooit naar de browser, Git of chat.
4. Deploy pas daarna de Next.js-wijziging.

Voer `initializeDatabase()` niet uit. Die functie is alleen behouden voor nieuwe, lege
ontwikkelomgevingen en is niet nodig voor de bestaande productiespreadsheet.

## Accounts en statussen

Clerk blokkeert de applicatiesessie totdat het e-mailadres is geverifieerd. De Sheet
ondersteunt `PENDING`, `ACTIVE` en `BLOCKED`; alleen `ACTIVE` krijgt membertoegang.
Een geverifieerde activatie zet een bestaand `PENDING`-record op `ACTIVE`, maar heft
een blokkade nooit op.

De bestaande NextAuth/Google-route blijft tijdelijk in de code voor een latere migratie,
maar kan geen Parkbad-memberdata autoriseren. Als Google-login wordt heringeschakeld,
moet dat als provider binnen Clerk gebeuren zodat er één sessie- en accountbron blijft.
