# Agenturne AI Webapp (MVP)

Internal web app migration from Apps Script/Google Sites.

## Current Status (2026-02-11)
- MVP is running locally and verified end-to-end.
- Google login works with domain/email restrictions.
- Admin role assignment is required after first sign-in.
- Provider keys can be saved from `/nastavenia` (encrypted in DB).
- RSA generation works from `/rsa` and writes history to DB.
- Meta universal generation works from `/meta-universal` and writes history to DB.
- Audit events are written for auth/settings/RSA actions.
- In-memory rate limiting is active on API routes.

## Included
- Google SSO (Auth.js)
- Role-aware API (`admin`, `editor`, `viewer`)
- `POST /api/settings` (agency provider keys)
- `POST /api/rsa` (RSA generation)
- `POST /api/meta-universal` (Meta universal text generation)
- `GET /api/history` (recent runs)
- API rate limiting (per-user, in-memory buckets)
- Audit events for sign-in/sign-out, key updates and RSA runs
- Prisma schema for users/settings/history/audit

## 1. Prerequisites
- Node.js 20+
- PostgreSQL 14+

## 2. Setup
```bash
cd webapp
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## 3. Google OAuth
1. Create OAuth client in Google Cloud Console.
2. Set redirect URI:
- `http://localhost:3000/api/auth/callback/google`
3. Fill `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` in `.env`.

## 4. Access restrictions
Set either:
- `ALLOWED_DOMAIN=agentura.sk`
or
- `ALLOWED_EMAILS=user1@agentura.sk,user2@agentura.sk`

## 5. Encryption key
Generate 32-byte base64 key:
```bash
openssl rand -base64 32
```
Use output as `ENCRYPTION_KEY_BASE64`.

## 6. First admin user
After first sign-in, promote your user in DB:
```sql
update "User" set role = 'admin' where email = 'tvoj.email@agentura.sk';
```

## Verified Smoke Test
1. Login at `/login` with allowed Google account.
2. Save at least one provider key in `/nastavenia`.
3. Generate output in `/rsa`.
4. Confirm rows in `/historia`.
5. Confirm audit logs in DB:
```sql
select event_type, actor_user_id, created_at
from "AuditEvent"
order by created_at desc
limit 30;
```

## Known Limitations
- Rate limiting is in-memory (single-instance only).
- No CSRF token layer yet for mutating API routes.
- No staging deployment documented yet (local-first setup).
- RSA and Meta universal are migrated and available in the app.

## Next Recommended Steps
1. Move rate limiting to Redis/Upstash for multi-instance deploys.
2. Add CSRF protection for state-changing routes.
3. Deploy staging (Vercel/Cloud Run) and run internal UAT.
4. Migrate next tool (`meta_ads_product`) to the same API/service pattern.

## Ad Creative Generator (`/ad-creative`)

> **⚠️ Stav (2026-03-10): NEDOKONČENÉ – odkaz v menu je skrytý**
>
> Kód je pushnutý a stránka `/ad-creative` existuje, ale nástroj nie je aktívny v produkcii.
> Pred spustením je potrebné donastaviť nasledovné:
>
> 1. **Env vars na Verceli** – pridať `ANTHROPIC_API_KEY` a `GEMINI_API_KEY`
> 2. **DB migrácia** – spustiť voči produkcii: `DATABASE_URL="..." npx prisma migrate deploy`
> 3. **Seed klientov** – spustiť voči produkcii: `DATABASE_URL="..." node prisma/seed.mjs`
> 4. **Google Drive API** – zapnúť v Google Cloud Console (rovnaký projekt ako OAuth client)
> 5. **Odkaz v menu** – pridať späť v `src/components/top-nav.tsx`

Nástroj generuje reklamné kreatívy: Claude API konvertuje text brief → JSON prompt → Gemini API vygeneruje obrázok. Obrázky sa ukladajú na Google Drive prihláseného používateľa.

### Modely v Prisma
- `CreativeClient` – klientske profily (štýl, osvetlenie, farby, aspect ratio)
- `AdCreativeRun` – záznamy generovaní (brief, platform, promptJson, imagePath, isWinner)

### Migrations a seed
```bash
npx prisma migrate dev --name add-ad-creative
node prisma/seed.mjs   # vytvorí 3 ukážkových klientov
```

### Env vars
```
ANTHROPIC_API_KEY=        # Claude API (brief → JSON prompt)
GEMINI_API_KEY=           # Gemini API (image generation)
```

### Google Drive – nastavenie
1. **Google Cloud Console → APIs & Services → Library → "Google Drive API" → Enable**
   - Musí byť zapnuté v tom istom projekte ako OAuth client (skontroluj project ID)
2. Scope `drive.file` je pridaný do OAuth konfigurácie
3. Pri každom prihlásení sa čerstvé tokeny (vrátane refresh_token) uložia do DB

### Google Drive – ako to funguje
- Obrázky sa ukladajú do priečinka `AI Kreatívy / {meno klienta}` na Drive používateľa
- `imagePath` v DB má formát `drive:{fileId}`
- Obrázky sa servujú cez auth-chránenú route `/api/ad-creative/outputs/drive:{fileId}`
- Backward kompatibilita: lokálne súbory (`uploads/ad-creative/...`) stále fungujú

### Dôležité poznatky
- **Auth.js PrismaAdapter bug**: `linkAccount` sa volá len pri prvom logine. Čerstvé tokeny (refresh_token) sa neukladajú pri ďalších prihláseniach. Oprava: `signIn` callback manuálne robí `updateMany` na Account tabuľke.
- **Claude wrap do markdown**: Claude niekedy obalí JSON do ` ```json ``` ` blokov aj napriek inštrukcii. Riešenie: strip fences pred `JSON.parse`.
- **Gemini imageGenerationConfig**: Gemini `generateContent` neprijíma `imageGenerationConfig` v `generationConfig` — hodí 400. Aspect ratio sa nastaví textom v prompte: `"-- Important: compose this image as a {ratio} composition"`.
- **Webpack cache**: Po `prisma generate` (zmena node_modules) treba zmazať `.next/` a reštartovať dev server.

### Mazanie obrázkov
Vymaz súbor priamo z Google Drive (priečinok `AI Kreatívy`). Záznam v DB zostane — môžeš ho vymazať:
```sql
DELETE FROM "AdCreativeRun" WHERE "imagePath" = 'drive:FILE_ID';
```

---

## Reporting Google Ads on Vercel
For the `/reporting-google-ads` tool set these env vars in Vercel:
- `REPORTING_GADS_SPREADSHEET_ID`
- `REPORTING_GADS_SERVICE_ACCOUNT_EMAIL`
- `REPORTING_GADS_PRIVATE_KEY` (paste key with escaped newlines `\n`)

Google Sheet requirements:
- tab `daily_account_stats` must be readable via CSV export URL (sheet publish/share mode),
- tab `accounts_config` must allow edit access for the service account email.

Behavior notes:
- Data reading can work even without service account env vars (CSV export path), but config save/update requires `REPORTING_GADS_SERVICE_ACCOUNT_EMAIL` and `REPORTING_GADS_PRIVATE_KEY`.
- Reporting API routes are configured for Node.js runtime (not Edge), because Google service-account JWT signing uses Node crypto.

## Notes
- API keys are encrypted before DB write.
- Provider calls run server-side only.
- Rate limiting is in-memory for MVP (replace with Redis/Upstash in multi-instance deployment).
- This is MVP foundation for migrating remaining tools.

## History Retention
Recent generation history stays in `ToolRun`. For long-term storage, archive old rows into `ToolRunArchive`.

Run archive job manually:
```bash
npm run retention:archive
```

Useful env flags:
- `RETENTION_DAYS` (default `90`)
- `ARCHIVE_BATCH_SIZE` (default `250`)
- `ARCHIVE_MAX_BATCHES` (default `50`)
- `ARCHIVE_DRY_RUN=true` to preview counts without moving data
