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

## Notes
- API keys are encrypted before DB write.
- Provider calls run server-side only.
- Rate limiting is in-memory for MVP (replace with Redis/Upstash in multi-instance deployment).
- This is MVP foundation for migrating remaining tools.
