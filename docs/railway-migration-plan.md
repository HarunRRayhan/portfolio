# Railway Migration Plan — harun.dev

## Current Architecture (AWS)
```
GitHub push → Deploy script → S3 (assets) + SSH → Lightsail EC2
  → Docker Compose (traefik, nginx×2, php×2, postgres)
  → Cloudflare (DNS + proxy)
```

## Target Architecture (Railway)
```
GitHub push → Railway auto-deploy
  → Web service (PHP-FPM + Nginx)
  → Railway Postgres (managed)
  → Cloudflare (DNS only)
```

## Migration Steps

### Step 1: Prepare the codebase
- Simplify Dockerfile for single-service Railway deploy (remove blue-green/traefik complexity)
- Or configure Nixpacks (Railway's auto-detect for Laravel)
- Update `.env.example` with Railway-compatible defaults
- Remove S3 dependency for assets — serve from the app's `public/` directory

### Step 2: Set up Railway
- Create a new Railway project linked to your GitHub repo
- Provision a **PostgreSQL** database (Railway managed)
- Add all env vars in Railway dashboard:
  - `APP_KEY`, `APP_URL=https://harun.dev`
  - `DB_*` (Railway provides these automatically)
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION` (all `database`)
  - `MAIL_*`, `RESEND_API_KEY`
  - `VITE_ASSET_BASE_URL` (empty — serve locally)

### Step 3: Database migration
- `pg_dump` from Lightsail → download → import to Railway Postgres

### Step 4: Update DNS
- In Cloudflare: change `harun.dev` A record from Lightsail IP → Railway's generated URL (or CNAME)
- Railway provides `*.railway.app` URL

### Step 5: First deploy
- Push `main` → Railway builds + deploys
- Verify all routes: home, blog, login, admin, case-studies, feeds

### Step 6: Sunset Lightsail
- Once verified, stop Lightsail instance
- No rush — can keep it running side-by-side for rollback

## What needs *your* input
| Item | Who |
|------|-----|
| Create Railway project + link GitHub | You |
| Add env vars in Railway dashboard | You (or I can guide) |
| OAuth credentials (GitHub/Google client secrets) | You — provide them |
| Cloudflare DNS change | You |
| Database credentials for pg_dump | I can get from server |

## What I can do right now
- Prepare the codebase (Dockerfile, config, asset serving)
- Dump the database from Lightsail
- Guide each Railway dashboard step

Want me to start preparing the codebase while you create the Railway project?
