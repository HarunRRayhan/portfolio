# Railway Migration Design Spec — harun.dev

**Date:** 2026-07-29
**Status:** Approved — all open decisions resolved, moving to implementation plan
**Supersedes:** `docs/railway-migration-plan.md` (stale — written before the staging-environment model and CI/CD-trimming decisions below were made; do not follow that doc going forward)

## 1. Summary

Migrate `harun.dev` (Laravel + Inertia + React) from AWS Lightsail — a hand-rolled blue-green Docker Compose deployment reached over SSH — to Railway, using Railway's managed Postgres and its native git-push deploy mechanism. The goal is to delete an entire layer of custom orchestration (Traefik, dual nginx/php containers, S3-based secrets distribution, SSH-based rollout) in favor of Railway's own rolling, health-checked, zero-downtime deploys, while leaving the parts of the stack that have nothing to do with the host — Cloudflare R2 as the asset CDN, Cloudflare DNS/proxy — untouched.

This document describes the target design: architecture, the services involved, the database cutover sequence, the CI/CD changes, rollback posture, and the decisions that are still open. It does not implement anything — codebase changes (trimming the Dockerfile, writing Railway-specific config, editing `deploy.yml`) are a later "codebase prep" phase.

## 2. Current Architecture (AWS Lightsail)

Grounded in `.github/workflows/deploy.yml`, `deploy/deploy.sh`, `deploy/cicd/server-deploy.sh`, `docker/docker-compose.yml`, and `docker/Dockerfile`.

```
GitHub push (main)
  → GitHub Actions "Blue-Green Zero-Downtime Deployment" workflow (.github/workflows/deploy.yml)
      - pulls SSH key + two secret .env files from an S3 "config bucket" (CONFIG_BUCKET_NAME)
      - starts/wakes the Lightsail instance, waits for SSH
      - builds frontend assets (npm ci && npm run build)
      - syncs public/build, public/fonts, public/images to Cloudflare R2 (with a pre-upload
        backup-to-timestamped-prefix step and a restore-from-backup step on failure)
      - purges the Cloudflare cache
      - rsyncs the repo to the server over SSH, uploads deploy/cicd/server-deploy.sh, and runs it
  → deploy/cicd/server-deploy.sh (on the Lightsail box)
      - rebuilds Docker images, brings up the "other" color (blue/green) alongside the live one
      - health-checks the new color, flips Traefik's dynamic config to point at it
      - drains and stops the old color
  → docker/docker-compose.yml stack on the instance:
      php_blue / php_green (PHP-FPM), nginx_blue / nginx_green, traefik (edge router +
      Let's Encrypt), scheduler (a loop container running `php artisan schedule:run` every
      60s), db (postgres:15-alpine, local Docker volume)
  → Cloudflare (DNS + proxy) → Lightsail public IP
```

`deploy/deploy.sh` (970 lines) is a related but distinct script: a fuller, more defensive version of the same blue-green rollout, meant to be run by hand or as a bootstrap, also pulling secrets from the same S3 config bucket, installing Docker/AWS CLI on a fresh instance, managing SSL certs via `ssl-manager.sh` + a systemd renewal timer, and driving the same `docker/docker-compose.yml` stack. It duplicates most of what `deploy/cicd/server-deploy.sh` does for the CI path.

Key properties of the current setup worth carrying into the new design:
- The R2 upload step already runs **before** the app is redeployed — CDN assets and the running app version are not deployed atomically today, so this migration does not introduce a new class of skew.
- Postgres runs as a single container on a local Docker volume on the Lightsail instance — no managed backups beyond whatever `pg_dump` is run manually.
- A dedicated `scheduler` container is the only thing invoking Laravel's scheduler; there is no separate queue worker container (see §11.2 — the app has no queued jobs today, `QUEUE_CONNECTION=database` is configured but unused).

## 3. Target Architecture (Railway)

```
GitHub push (main)
  → Railway's native GitHub integration builds and deploys the "web" service directly
    (no GitHub Actions involvement in the app deploy itself)
  → Railway performs its own rolling, health-checked deploy — no blue-green, no Traefik,
    no SSH, no S3-distributed secrets
  → Railway "web" service (Laravel/Inertia/React app) ← reads/writes → Railway "Postgres"
    service (managed, same project)
  → Cloudflare DNS (proxied) → Railway-provided public endpoint
  → Cloudflare R2 continues to serve build/fonts/images, uploaded by a separate,
    trimmed-down GitHub Actions workflow triggered by the same push to main
```

Dropped entirely: Traefik, the blue/green container pairs, the S3 "config bucket" for secret distribution, SSH-based deployment, the on-server `docker compose up`/health-check/rollback dance, and the Lightsail-specific instance-state/port-management logic. Railway's platform already provides zero-downtime rolling deploys with health checks, so none of that hand-rolled machinery needs to be reproduced.

Kept unchanged: Cloudflare R2 as the CDN for built assets, fonts, and images; the `ASSET_URL` / `VITE_ASSET_BASE_URL` build-time configuration that points the app at R2 (see §4.4); Cloudflare as the DNS/proxy layer in front of whichever origin is live.

## 4. Components / Services

### 4.1 Railway Postgres (already provisioned)

Provisioned operationally, ahead of this document:

| Property | Value |
|---|---|
| Railway project | `harun.dev` |
| Project ID | `24bc972c-34b3-43d7-ac34-4e1f4eedd5e7` |
| Environment | `production` |
| Environment ID | `e9e1a067-1249-415e-9746-7465bb263062` |
| Service | Postgres |
| Service ID | `b50c7e7b-e8a6-4d30-870f-658e4236e40b` |
| Image | `ghcr.io/railwayapp-templates/postgres-ssl:18` |
| Volume | 5 GB |
| Status | RUNNING |

Railway injects standard connection variables (`DATABASE_URL`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, etc.) into any service linked to this one. No secret values are recorded in this document — only variable names.

### 4.2 Railway "web" service (not yet created)

The app itself still needs its own Railway service. Two things are unresolved about how it gets created, both already surfaced during Postgres provisioning:

- Railway's project-scoped API token was tested against `railway add` / `railway link` and **failed** to create a new service. Railway's own documentation does not say whether project-scoped tokens are able to create services at all.
- Because of that, the working assumption is that the "web" service will be created manually through the Railway dashboard — the same way the Postgres service was — unless an account-level token is obtained later that proves capable of scripted service creation. See open decision §11.5.

Once created, the web service needs:
- **Source**: connected to this GitHub repo, `main` branch, for Railway's native git-push auto-deploy.
- **Build**: either a Dockerfile-based build or Nixpacks — genuinely undecided, see §11.1.
- **A migration/setup step** that runs `php artisan migrate --force` (plus `config:cache`, `route:cache`, `view:cache`, `storage:link`) on every deploy, equivalent to what `deploy/cicd/server-deploy.sh` does today after bringing up the new color. See open decision §11.3.
- **A way to run the Laravel scheduler**, replacing the standalone `scheduler` container in `docker/docker-compose.yml`. See open decision §11.2.
- **Environment variables**, set directly in the Railway dashboard (not distributed via S3 the way they are today). Based on `.env.example`, the categories needed are: `APP_*` (name, env, key, debug, timezone, URL), `SESSION_*`/`CACHE_STORE`/`QUEUE_CONNECTION` (all currently `database`-backed, no separate Redis/Memcached service), `MAIL_*` and `RESEND_API_KEY`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`/`GITHUB_REDIRECT_URI`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`, `SUPER_ADMIN_EMAILS`, `MAXMIND_LICENSE_KEY`/`MAXMIND_ACCOUNT_ID`, `VITE_ASSET_BASE_URL`/`ASSET_URL`/`VITE_APP_NAME`/`VITE_BOOKING_URL`/`VITE_BOOKING_EMBED_URL`, and the database variables described next.

### 4.3 Database connection variable mapping

This is a concrete gap found while grounding this spec, not previously called out: `config/database.php`'s `pgsql` connection reads `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, and optionally a single `DB_URL` — it does **not** read Railway's `DATABASE_URL` directly (those are different variable names). The web service's environment needs one of:
- Discrete `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD`, each set as a Railway reference variable pointing at the Postgres service's `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`, or
- A single `DB_URL` set as a reference variable pointing at the Postgres service's `DATABASE_URL`.

Either is mechanically straightforward with Railway's cross-service variable references; which style to use is a small open decision (§11.4).

### 4.4 Cloudflare R2 (unchanged)

`ASSET_URL` and `VITE_ASSET_BASE_URL` (`.env.example`) continue to point at the R2 CDN regardless of which host serves the app. `vite.config.js` bakes `VITE_ASSET_BASE_URL` into the client bundle at build time via `define`, and `resources/js/lib/imageUtils.ts` reads `import.meta.env.VITE_ASSET_BASE_URL` at runtime to prefix asset paths. None of this changes with the host migration — R2 stays the CDN, its bucket/credentials stay the same, and no code changes are needed here.

### 4.5 DNS (Cloudflare)

`harun.dev` stays on Cloudflare. The only change at cutover is what the DNS record points at — Railway's provided endpoint instead of the Lightsail public IP (see §8).

## 5. Data Flow — Database Cutover Sequence

Approach: **dump-now-for-testing, re-sync-at-actual-cutover.**

1. **Initial dump (now, for early testing)**: `pg_dump` the current production database from Lightsail; restore it into the Railway Postgres service described in §4.1. This gives a realistic dataset to test the new environment against — staging, and eventually the production web service — well before DNS changes.
2. **Iterate and validate** against that restored data: bring up the Railway web service (or the staging environment, §7) pointed at Railway Postgres, and confirm routes, auth flows, and data reads/writes behave correctly.
3. **Final dump (immediately before cutover)**: once staging has validated and the team is ready to flip DNS, take a second `pg_dump` from the still-live Lightsail production database and restore it into Railway Postgres, overwriting the test data. This captures every write made between the first dump and the actual cutover, so no production data is lost.
4. **Flip DNS** (§8) only after the final restore completes successfully.

Between steps 1 and 3, Lightsail's Postgres remains the single source of truth for production data — nothing is deleted or migrated destructively out of it until after the final dump is taken.

## 6. CI/CD Changes

### 6.1 What gets dropped from `.github/workflows/deploy.yml`

Everything tied to reaching and orchestrating the Lightsail box over SSH, and everything tied to the S3 secrets bucket:

- `Setup AWS CLI` (AWS account credentials for Lightsail/S3, not R2)
- `Download deployment configuration` (pulls `.env.deploy`, `.env.appprod`, and the SSH private key from `s3://$CONFIG_BUCKET_NAME`)
- `Stamp deployment version` (writes `APP_BUILD_VERSION`/`APP_DEPLOYMENT_ID` back to the S3-hosted app env)
- `Ensure server is running and SSH reachable` (Lightsail start/state/port checks, SSH polling with a forced reboot fallback)
- `Prepare server directories and upload environment files` (SSH + scp of env files onto the box)
- `Sync Repository to Server` (SSH `git fetch`/`reset --hard` on the box)
- `Execute Blue-Green Deployment` (uploads and runs `deploy/cicd/server-deploy.sh` on the box, then polls for completion)
- `Verify deployment` (curl checks against the Lightsail IP and `harun.dev` over HTTP)
- `Rollback on failure` (Traefik-config-rewrite blue/green rollback over SSH)
- The Lightsail/Traefik-specific parts of `Deployment summary` (Traefik dashboard link, blue-green feature bullets)

`deploy/deploy.sh` and `deploy/cicd/server-deploy.sh` become dead code once this lands — they are not referenced by anything once the SSH path is removed from `deploy.yml`. Actually deleting them (and the Docker/Traefik/SSL files they depend on) is out of scope for this spec; see §3 and §10.

### 6.2 What gets kept — trimmed to build + R2 sync only

The surviving workflow does exactly three things: build frontend assets, sync them to R2, purge the Cloudflare cache. Specifically kept, with existing logic preserved:

- `Checkout code`, `Setup Node.js`, and the `npm ci && npm run build` step (currently under `Build Frontend Assets`, lines 208–240 of the existing workflow)
- `Upload Assets to Cloudflare R2` (lines 291–347) — `aws s3 sync`/`cp` of `public/build`, `public/fonts`, `public/images` to R2 via the S3-compatible endpoint, including the correct-content-type handling for `.js`/`.css` files and the existing `until upload_assets; do ...; done` retry loop (3 attempts, backoff via `sleep $((attempt * 15))`)
- `Purge Cloudflare Cache` (lines 349–365)

**Explicit call on an ambiguous point**: the existing workflow also has a `Backup Current Assets` step (times-tamps and copies the current R2 objects to a backup prefix before overwriting, lines 242–289), a `Cleanup Asset Backup` step on success (lines 367–402), and a `Rollback Assets on Failure` step that restores from that backup (lines 505–561). The instruction to keep "ONLY" the build-and-sync-to-R2 logic, "including its existing retry-on-failure logic," is read here as referring specifically to the upload retry loop, not this separate backup/restore-on-failure mechanism — that mechanism exists to keep R2 assets in sync with a coordinated app-level rollback, which no longer applies the same way once Railway owns app rollback independently (§9). This spec's trimmed workflow therefore drops the backup/cleanup/rollback-on-failure steps along with the SSH pieces. If that read turns out to be wrong, it's a small, self-contained addition to restore later — it doesn't affect the rest of the design.

### 6.3 A knock-on change the trim requires: where R2/Cloudflare credentials come from

Today, `R2_BUCKET_NAME`, `R2_S3_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_API_TOKEN` are all read out of `deploy/.env.deploy`, which itself is downloaded from the S3 config bucket at the start of the job. Once that S3 download step is removed, these need to become GitHub Actions secrets (repository or environment-scoped) directly, referenced as `secrets.R2_BUCKET_NAME` etc. instead of being `grep`'d out of a downloaded file. The values themselves don't change — only where the workflow reads them from.

Similarly, the `npm run build` step currently builds against a `.env` copied from the S3-downloaded `.env.appprod` (which carries the full production app config, including `VITE_ASSET_BASE_URL`/`ASSET_URL`). The trimmed workflow only needs the handful of `VITE_*` build-time variables actually consumed by `vite.config.js` and the frontend (`VITE_APP_NAME`, `VITE_ASSET_BASE_URL`, `VITE_BOOKING_URL`, `VITE_BOOKING_EMBED_URL`) — these should also move to GitHub Actions secrets/variables rather than being pulled in as a side effect of downloading the full app env file.

### 6.4 App deploy trigger

The app itself is no longer deployed by GitHub Actions at all. Connecting the GitHub repo to the Railway "web" service (§4.2) makes Railway watch `main` directly and build+deploy on every push, independent of the trimmed workflow above. Both triggers fire off the same push event but run as two unrelated pipelines — the GitHub Actions workflow handles static assets, Railway handles the app.

## 7. Staging Environment

`staging.harun.dev` is a second Railway **environment** inside the same `harun.dev` project — not a separate project. Railway environments share the project but get isolated resources and variables, so staging gets its own web service instance and can either share or fork the Postgres service depending on how Railway's environment model is configured; either way, it mirrors production's service topology (one web service, one Postgres) without needing a second project to manage. The staging web service is the natural place to validate against the initial (step 1, §5) database restore before the final cutover.

## 8. DNS / Cutover / Sunset Sequence

1. Staging environment (§7) is validated against a Railway-restored copy of the production database.
2. The final `pg_dump`/restore (§5, step 3) is performed immediately before cutover, capturing all writes since the initial test dump.
3. Cloudflare DNS for `harun.dev` is updated to point at Railway's provided endpoint for the production environment's web service, replacing the Lightsail A record.
4. Lightsail is left running, unchanged, for a verification window after cutover — long enough to catch anything staging didn't surface and to have a fast, no-drama rollback path (point DNS back at the still-running Lightsail instance). The length of that window is not yet decided; see §11.7.
5. Once the verification window passes without issues, the Lightsail instance is sunset (stopped/terminated).

## 9. Error Handling / Rollback Considerations

**App-level rollback.** The current design's safety net is blue-green traffic shifting via Traefik plus an SSH-driven rollback step that reverts the Traefik config to the previous color. Railway replaces this with its own deploy history and rollback: a failed or bad deploy can be rolled back to the last known-good build directly through Railway, without any bespoke scripting. This is a net simplification, not a gap — it's the core reason blue-green complexity is being dropped (§3).

**Asset rollback.** With the R2 backup/restore-on-failure steps dropped (§6.2), a failed app deploy no longer automatically reverts R2 to a prior asset snapshot. This is an acceptable trade because R2 assets are already deployed independently of and ahead of the app today (§2) — a failed Railway app deploy simply means Railway keeps serving the previous build, which is still compatible with whatever the last successful R2 sync produced. Manual R2 restore from Cloudflare-side versioning/backups (if any) remains an option if this ever proves insufficient, but scripting that back into CI is out of scope here.

**Database rollback.** Because of the dump-now-for-testing/re-sync-at-cutover approach (§5), Lightsail's Postgres is never modified or decommissioned until after the final restore and DNS cutover succeed. If something goes wrong post-cutover during the verification window (§8), rolling back is: point DNS back at Lightsail. No database migration needs to be undone, since Lightsail's data was never touched.

**Migration failures on deploy.** `php artisan migrate --force` runs as part of every deploy today, after the new color is healthy but before it takes traffic. The equivalent step on Railway (§4.2, §11.3) needs to fail the deploy loudly enough that Railway does not cut traffic over to a build with a broken schema — this is a requirement to carry into whatever pre-deploy/release mechanism gets chosen, not yet a fully specified mechanism.

## 10. Docker / Build Considerations

`docker/Dockerfile` currently produces three targets — `builder`, `php-fpm`, and `nginx-app` — built specifically for the blue-green model: separate PHP-FPM and Nginx images, each duplicated as a blue/green pair, fronted by Traefik, with Nginx proxying to PHP-FPM over the internal Docker network. `docker/docker-compose.yml` wires all of that together (`php_blue`, `php_green`, `nginx_blue`, `nginx_green`, `traefik`, `scheduler`, `db`). None of this is directly suitable for a single-process Railway service — Railway expects one service to run one process and be reachable on one port, health-checked by Railway itself, with no Traefik or blue/green pairing needed.

Trimming or replacing these files (down to a single-process Dockerfile, or switching to Nixpacks) is explicitly **out of scope for this spec** — it's implementation work for a later codebase-prep phase. This spec only records that the current files are not usable as-is and flags the Dockerfile-vs-Nixpacks choice as open (§11.1).

`docker-compose.dev.yml` (local Postgres for development) is unaffected by any of this — it already runs independently of the production blue-green stack and needs no changes for Railway.

## 11. What Needs Your Input / Open Decisions

1. **Dockerfile vs. Nixpacks for the Railway build.** Should Railway build the web service from a trimmed, single-process version of `docker/Dockerfile`, or should it use Nixpacks (Railway's auto-detecting builder for Laravel)? This also affects how a release/migration step (item 3 below) gets wired in, since Dockerfile and Nixpacks builds expose that differently on Railway.

   **RESOLVED — Nixpacks.** Rationale: fastest path to a working staging deploy; Railway's Nixpacks auto-detects Laravel via `composer.json`. A trimmed Dockerfile remains a fallback if Nixpacks can't handle something specific the app needs (e.g. a PHP extension not covered by Nixpacks' defaults).

2. **Where the Laravel scheduler runs.** `docker/docker-compose.yml` runs a dedicated `scheduler` container looping `php artisan schedule:run` every 60 seconds — there is no Railway equivalent decided yet. Options include a second Railway service running the same loop, or Railway's own Cron Job feature (if it can invoke `php artisan schedule:run` on a schedule against the deployed app image).

   **RESOLVED — a second Railway service** in the same project/environment running the same loop as today's `scheduler` container (`php artisan schedule:run` every 60s), rather than Railway's Cron Job feature. Rationale: mirrors current known-working behavior with minimal change; Railway Cron Jobs typically spin a fresh instance per tick, which is a bigger behavioral change to validate.

3. **How the release step (migrations + cache builds) runs on every deploy.** Today `server-deploy.sh` runs `php artisan migrate --force`, `config:cache`, `route:cache`, `view:cache`, and `storage:link` after the new color is up but before it takes traffic. Railway needs an equivalent (e.g. a pre-deploy/release command) that runs before traffic cuts over and fails the deploy if it errors. Depends partly on item 1.

   **RESOLVED** — configure Railway's release/pre-deploy command (specific mechanism depends on the Nixpacks build, to be confirmed during codebase-prep) to run `php artisan migrate --force`, `config:cache`, `route:cache`, `view:cache`, `storage:link`, in that order, before the new deploy takes traffic, failing the deploy on any non-zero exit. Mirrors what `server-deploy.sh` does today.

4. **Database variable mapping style.** Whether the web service's Postgres connection is configured via a single `DB_URL` reference variable (mapped from the Postgres service's `DATABASE_URL`) or via discrete `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` reference variables (mapped from `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`). Both work with `config/database.php` as written.

   **RESOLVED** — discrete `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` reference variables mapped from the Postgres service's `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/`PGPASSWORD`, not a single `DB_URL`. Rationale: matches `config/database.php`'s native pgsql connection config directly, easier to debug individual pieces.

5. **How the "web" service itself gets created.** Confirmed not to work yet: a project-scoped Railway API token failed to create a service via `railway add`/`railway link`, and Railway's docs don't clarify whether project-scoped tokens can ever do this. Default plan is to create the service manually via the Railway dashboard, as was done for Postgres. Open question: whether it's worth obtaining an account-level token first to enable scripted/repeatable service creation instead.

   **RESOLVED** — created manually via the Railway dashboard (New → GitHub Repo, same flow as Postgres), not via CLI/API token. This is the one step requiring the user directly, since the project-scoped token still can't do it.

6. **OAuth redirect URIs for staging.** `GITHUB_REDIRECT_URI` and `GOOGLE_REDIRECT_URI` are environment-specific (`.env.example` shows them pinned to a single host). Not decided whether `staging.harun.dev` gets its own OAuth app registrations (separate client ID/secret per provider) or reuses the production OAuth apps with an additional registered redirect URI.

   **RESOLVED** — reuse the existing GitHub and Google OAuth app registrations; add `staging.harun.dev`'s callback URL to each app's allowed redirect URI list rather than creating separate OAuth apps for staging.

7. **Length of the post-cutover Lightsail verification window.** §8 keeps Lightsail running "for a verification window" after DNS cutover before sunsetting it. No specific duration has been agreed.

   **RESOLVED** — 48 hours after production DNS cutover before sunsetting Lightsail, extendable if anything surfaces during that window.

## 12. Non-Goals

To keep this spec bounded to the migration itself:
- No changes to the R2 CDN, its bucket contents, or its credentials.
- No changes to Cloudflare's role as DNS/proxy in front of whichever origin is live.
- No trimming or rewriting of `docker/Dockerfile`, `docker/docker-compose.yml`, or related Traefik/Nginx/SSL files — that's later codebase-prep work, informed by whichever way §11.1 resolves.
- No deletion of now-unused deploy scripts (`deploy/deploy.sh`, `deploy/cicd/server-deploy.sh`, `deploy/ssl-manager.sh`, etc.) — cleanup is deferred until after cutover is verified.
- No changes to application features, routes, or business logic.
