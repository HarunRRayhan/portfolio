# Railway Migration Implementation Plan — harun.dev

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `harun.dev`'s deploy pipeline from AWS Lightsail (SSH-driven blue-green Docker Compose) to Railway (native git-push deploys against Railway's managed Postgres), fully built and validated on Railway-provided/staging subdomains — with production DNS cutover explicitly excluded from this plan's scope.

**Architecture:** Two Railway services per environment (`web` — serves the Laravel/Inertia/React app; `scheduler` — runs the `php artisan schedule:run` loop), both built by Railway's Railpack builder from the same GitHub repo but configured via separate per-service `railway.*.json` config-as-code files, both connected to the already-provisioned Railway Postgres service via discrete reference variables. GitHub Actions is trimmed to a static-asset-only workflow (build → sync to Cloudflare R2 → purge cache); Railway's own GitHub integration handles the app deploy independently. A `staging` Railway environment (mapped to `staging.harun.dev`) validates the whole stack against a restored copy of production data before any production DNS change is considered.

**Tech Stack:** Laravel 13 (PHP ^8.4), Inertia.js + React (TypeScript), Vite, Postgres (`pgsql`), Railway (Railpack builder, managed Postgres, config-as-code), GitHub Actions, Cloudflare R2 + DNS.

## Global Constraints

- Approved spec: `docs/superpowers/specs/2026-07-29-railway-migration-design.md`. This plan implements spec §1–§7 and §8 step 1 only. It does **not** implement spec §8 steps 2–5 (final pre-cutover `pg_dump`, production DNS flip, Lightsail verification window, Lightsail sunset) — those are a separate, later, human-gated piece of work the user greenlights explicitly, per their sequencing instruction. Do not add tasks for them here and do not perform them as a side effect of any task below.
- Do not touch `harun.dev`'s production DNS record at any point in this plan. Only `staging.harun.dev` DNS is created/modified (Task 9).
- No changes to Cloudflare R2's bucket, contents, or credentials (spec §12). No changes to Cloudflare's role as DNS/proxy in front of whichever origin is live, beyond adding the one new `staging.harun.dev` record.
- No trimming, rewriting, or deletion of `docker/Dockerfile`, `docker/docker-compose.yml`, `docker-compose.dev.yml`, or any Traefik/Nginx/SSL files (spec §12, §10). No deletion of `deploy/deploy.sh`, `deploy/cicd/server-deploy.sh`, or other now-unused deploy scripts (spec §12) — they become dead code but stay in the repo.
- No changes to application features, routes, or business logic (spec §12).
- Railway project: `harun.dev`, Project ID `24bc972c-34b3-43d7-ac34-4e1f4eedd5e7`. Production environment ID `e9e1a067-1249-415e-9746-7465bb263062`. Postgres service ID `b50c7e7b-e8a6-4d30-870f-658e4236e40b` (already provisioned — do not recreate it).
- **Builder correction to spec §11.1**: the spec's resolved decision says "Nixpacks." As of this writing, Railway has deprecated Nixpacks in favor of **Railpack** as the default builder. Railpack fulfills the exact rationale the spec gave for choosing Nixpacks (fastest path, auto-detects Laravel via `composer.json`, Dockerfile remains a fallback) — every task below uses `"builder": "RAILPACK"` in place of Nixpacks. This is a technical update to keep the spec's decision working on Railway's current platform, not a reversal of the decision's intent.
- **New grounding finding (not in the spec)**: Railway's Railpack PHP provider auto-detects Laravel (via the `artisan` file) and, by default, automatically runs `composer install`, database migrations, `storage:link`, and cache rebuild commands as part of its own managed lifecycle — separately from whatever `preDeployCommand` a service defines. Left alone, this runs *in addition to* the explicit migrate+cache chain spec §11.3 calls for, on **both** the `web` and `scheduler` services (since both build from the same Laravel repo), which risks redundant or racing `migrate` runs. Every task that touches web/scheduler environment variables sets `RAILPACK_SKIP_MIGRATIONS=true` to disable Railpack's automatic migration step, so the **only** thing that ever runs `php artisan migrate --force` is the `web` service's explicit `preDeployCommand` (Task 1). This keeps the release step exactly as deterministic and fail-loud as spec §9 requires.
- **New grounding finding (not in the spec)**: `.env.example` defaults `DB_CONNECTION=sqlite`; `config/database.php`'s `'default' => env('DB_CONNECTION', 'sqlite')` means the app silently uses SQLite unless `DB_CONNECTION=pgsql` is explicitly set. The spec's §4.2 env var list doesn't call this out. Every task that sets web/scheduler environment variables sets `DB_CONNECTION=pgsql` explicitly.
- **New grounding finding (not in the spec)**: Railway's filesystem is ephemeral and Railway's log viewer only captures stdout/stderr. `.env.example` defaults `LOG_CHANNEL=stack` / `LOG_STACK=single`, which writes to `storage/logs/laravel.log` — a file that won't persist or show up in Railway's logs. Every task that sets web/scheduler environment variables sets `LOG_CHANNEL=stderr` and `LOG_STDERR_FORMATTER=\Monolog\Formatter\JsonFormatter` so application logs are visible in Railway.
- Config file authoring: use `.json` (not `.toml`) throughout — matches the syntax confirmed against Railway's own config-as-code documentation during spec-grounding.

---

### Task 1: Add per-service Railway config-as-code files

A single root-level `railway.json` applies to *every* Railway service connected to this repo, and config-as-code always overrides dashboard settings for the fields it manages. Since the `web` service and `scheduler` service (spec §11.2) need different `startCommand`/`preDeployCommand` values, Railway's documented mechanism is separate config files, each wired to one service via that service's own "Config File Path" setting (Task 3 does the wiring; this task only adds the files).

**Files:**
- Create: `railway.web.json`
- Create: `railway.scheduler.json`

**Interfaces:**
- Produces: `railway.web.json` — build/deploy settings for the Railway `web` service (any environment). Defines `preDeployCommand` (the migrate+cache release chain) and `healthcheckPath: "/health"`.
- Produces: `railway.scheduler.json` — build/deploy settings for the Railway `scheduler` service (any environment). Defines `startCommand` (the schedule-loop) and no `preDeployCommand`, so it never runs migrations.
- Consumes: nothing from earlier tasks (this is the first task).

- [ ] **Step 1: Create `railway.web.json`**

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  },
  "deploy": {
    "preDeployCommand": [
      "php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan storage:link"
    ],
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

This mirrors `deploy/cicd/server-deploy.sh`'s release step, using the order spec §11.3 explicitly resolved on (`migrate` → `config:cache` → `route:cache` → `view:cache` → `storage:link`), chained with `&&` so any non-zero exit stops the chain and fails the deploy before traffic cuts over (spec §9's "Migration failures on deploy" requirement). `healthcheckPath: "/health"` points at the existing route in `routes/web.php` (line 760) that already returns a JSON status payload — no app code changes needed.

- [ ] **Step 2: Create `railway.scheduler.json`**

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  },
  "deploy": {
    "startCommand": "sh -c 'while true; do php artisan schedule:run --no-interaction; sleep 60; done'",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

The `startCommand` is copied verbatim (including `--no-interaction`) from `docker/docker-compose.yml`'s `scheduler` service definition (line 37: `command: ["sh", "-c", "while true; do php artisan schedule:run --no-interaction; sleep 60; done"]`) — same 60-second loop, same known-working behavior, just running on Railway instead of in that container. No `preDeployCommand` or `healthcheckPath` — this service is a background worker, not an HTTP service, so it has nothing to health-check and must never run migrations itself (see Global Constraints).

- [ ] **Step 3: Verify both files are valid JSON**

Run: `python3 -m json.tool railway.web.json > /dev/null && python3 -m json.tool railway.scheduler.json > /dev/null && echo "both valid"`
Expected: `both valid`

- [ ] **Step 4: Commit**

```bash
git add railway.web.json railway.scheduler.json
git commit -m "Add per-service Railway config-as-code for web and scheduler"
```

---

### Task 2: Move R2/Cloudflare/VITE config into GitHub Actions, then trim `.github/workflows/deploy.yml`

Do the secrets/variables migration **before** editing the workflow file, so nothing depends on a downloaded S3 file that the trimmed workflow no longer fetches.

**Files:**
- Modify: `.github/workflows/deploy.yml` (full rewrite — old content spans lines 1–648)

**Interfaces:**
- Consumes: nothing from Task 1 (independent).
- Produces: a GitHub Actions workflow named "Build and Sync Assets to R2" with job `build-and-sync`, triggered on `push` to `main` and `workflow_dispatch`, scoped to the existing `environment: production` GitHub Environment.

- [ ] **Step 1: Retrieve the current production values needed, from the existing S3 config bucket (still reachable — nothing has been torn down yet)**

```bash
aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/docker/.env - | grep -E '^(R2_BUCKET_NAME|R2_S3_ENDPOINT|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|CLOUDFLARE_ZONE_ID|CLOUDFLARE_API_TOKEN)='
aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env - | grep -E '^(VITE_APP_NAME|VITE_ASSET_BASE_URL|ASSET_URL)='
```

`$CONFIG_BUCKET_NAME` is the same S3 bucket the current workflow already reads (`deploy.yml` line 54-55, before this task's rewrite). Keep this output private — do not paste real key values into any committed file, PR description, or chat log.

- [ ] **Step 2: Set GitHub Actions secrets (sensitive R2/Cloudflare credentials), scoped to the existing "production" Environment**

```bash
gh secret set R2_BUCKET_NAME --env production
gh secret set R2_S3_ENDPOINT --env production
gh secret set R2_ACCESS_KEY_ID --env production
gh secret set R2_SECRET_ACCESS_KEY --env production
gh secret set CLOUDFLARE_ZONE_ID --env production
gh secret set CLOUDFLARE_API_TOKEN --env production
```

Each command prompts interactively for the value (no `--body` flag) — paste the corresponding value from Step 1 when prompted, then press Ctrl-D. This keeps secret material out of shell history and off disk.

Expected after each: `✓ Set Actions secret R2_BUCKET_NAME for harun.dev` (repo name may differ locally — check with `gh repo view --json nameWithOwner`).

- [ ] **Step 3: Set GitHub Actions variables (non-sensitive build-time values), scoped to the same Environment**

```bash
gh variable set VITE_BOOKING_URL --env production --body "https://calendar.app.google/udfiL5QMDefg7SiD6"
gh variable set VITE_BOOKING_EMBED_URL --env production --body "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2WP1vzheZr36_dTSwJ5V6xIrm3bxGnItNcqTCzLxpya9p-yA_mH6uSaKhGA98iTicoYyAoNL7n?gv=true"
gh variable set VITE_ASSET_BASE_URL --env production --body "https://cdn.harun.dev"
gh variable set VITE_APP_NAME --env production --body "$(aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env - | grep '^VITE_APP_NAME=' | cut -d '=' -f2-)"
```

`VITE_BOOKING_URL`/`VITE_BOOKING_EMBED_URL` are copied verbatim from `.env.example` (lines 88-89) — they're public Google Calendar booking links, not secrets. `VITE_ASSET_BASE_URL` is `https://cdn.harun.dev`, confirmed from `deploy/cicd/server-deploy.sh`'s own reference to `https://cdn.harun.dev/build/$css_file` (around line 323) — the R2 CDN's actual public hostname. `VITE_APP_NAME`'s real current value is pulled live from the still-reachable S3 file rather than guessed, since `.env.example`'s own default (`Laravel`) is a placeholder, not the real site name.

Expected after each: `✓ Set Actions variable VITE_BOOKING_URL for harun.dev`

- [ ] **Step 4: Replace `.github/workflows/deploy.yml` in full**

```yaml
name: Build and Sync Assets to R2

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      force_deploy:
        description: 'Force deployment even if no changes detected'
        required: false
        default: 'false'
        type: boolean

jobs:
  build-and-sync:
    name: Build Frontend Assets and Sync to R2
    runs-on: ubuntu-latest
    environment: production
    timeout-minutes: 30
    if: |
      github.event_name == 'push' ||
      github.event_name == 'workflow_dispatch'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Build Frontend Assets
        env:
          VITE_APP_NAME: ${{ vars.VITE_APP_NAME }}
          VITE_ASSET_BASE_URL: ${{ vars.VITE_ASSET_BASE_URL }}
          VITE_BOOKING_URL: ${{ vars.VITE_BOOKING_URL }}
          VITE_BOOKING_EMBED_URL: ${{ vars.VITE_BOOKING_EMBED_URL }}
        run: |
          echo "Building frontend assets..."
          npm ci
          npm run build
          echo "Frontend assets built successfully"

      - name: Upload Assets to Cloudflare R2
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        run: |
          echo "Uploading static assets to Cloudflare R2..."

          upload_assets() {
            R2_BUCKET_NAME="${{ secrets.R2_BUCKET_NAME }}"
            R2_S3_ENDPOINT="${{ secrets.R2_S3_ENDPOINT }}"

            if [ -z "$R2_BUCKET_NAME" ] || [ -z "$R2_S3_ENDPOINT" ]; then
              echo "Error: R2 configuration missing. Required: R2_BUCKET_NAME, R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
              return 1
            fi

            aws s3 sync public/build "s3://$R2_BUCKET_NAME/build" --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read

            echo "Setting proper content types for JavaScript files..."
            find public/build -name "*.js" -type f | while read -r file; do
              relative_path="${file#public/}"
              aws s3 cp "$file" "s3://$R2_BUCKET_NAME/$relative_path" --endpoint-url "$R2_S3_ENDPOINT" --content-type "application/javascript" --acl public-read
            done

            echo "Setting proper content types for CSS files..."
            find public/build -name "*.css" -type f | while read -r file; do
              relative_path="${file#public/}"
              aws s3 cp "$file" "s3://$R2_BUCKET_NAME/$relative_path" --endpoint-url "$R2_S3_ENDPOINT" --content-type "text/css" --acl public-read
            done

            aws s3 sync public/fonts "s3://$R2_BUCKET_NAME/fonts" --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
            aws s3 sync public/images "s3://$R2_BUCKET_NAME/images" --endpoint-url "$R2_S3_ENDPOINT" --delete --acl public-read
          }

          max_attempts=3
          attempt=1
          until upload_assets; do
            if [ "$attempt" -ge "$max_attempts" ]; then
              echo "Error: Cloudflare R2 upload failed after $max_attempts attempts"
              exit 1
            fi

            attempt=$((attempt + 1))
            sleep $((attempt * 15))
            echo "Retrying Cloudflare R2 upload (attempt $attempt/$max_attempts)..."
          done

          echo "Static assets uploaded to Cloudflare R2"

      - name: Purge Cloudflare Cache
        run: |
          echo "Purging Cloudflare cache..."
          CLOUDFLARE_ZONE_ID="${{ secrets.CLOUDFLARE_ZONE_ID }}"
          CLOUDFLARE_API_TOKEN="${{ secrets.CLOUDFLARE_API_TOKEN }}"

          if [[ -n "$CLOUDFLARE_ZONE_ID" && -n "$CLOUDFLARE_API_TOKEN" ]]; then
            curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
              -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
              -H "Content-Type: application/json" \
              --data '{"purge_everything":true}'
            echo "CDN cache purged"
          else
            echo "Warning: Cloudflare credentials not found, skipping cache purge"
          fi

      - name: Deployment summary
        if: always()
        run: |
          echo "## Asset Build & Sync Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- **Trigger:** ${{ github.event_name }}" >> $GITHUB_STEP_SUMMARY
          if [[ "${{ github.event_name }}" == "push" ]]; then
            echo "- **Branch:** ${{ github.ref_name }}" >> $GITHUB_STEP_SUMMARY
          fi
          echo "- **Commit:** ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Status:** ${{ job.status }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Links" >> $GITHUB_STEP_SUMMARY
          echo "- [Production Site](https://harun.dev)" >> $GITHUB_STEP_SUMMARY
          echo "- [Railway Project](https://railway.com/project/24bc972c-34b3-43d7-ac34-4e1f4eedd5e7)" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### What this workflow does" >> $GITHUB_STEP_SUMMARY
          echo "- NPM build and asset compilation" >> $GITHUB_STEP_SUMMARY
          echo "- Cloudflare R2 asset upload (build, fonts, images)" >> $GITHUB_STEP_SUMMARY
          echo "- CDN cache purge" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "The application itself is deployed independently by Railway's native GitHub integration on the same push." >> $GITHUB_STEP_SUMMARY
```

This drops every Lightsail/SSH/S3-secrets step per spec §6.1 (`Setup AWS CLI` for Lightsail creds, `Download deployment configuration`, `Stamp deployment version`, `Ensure server is running and SSH reachable`, `Prepare server directories and upload environment files`, `Backup Current Assets`, `Cleanup Asset Backup`, `Sync Repository to Server`, `Execute Blue-Green Deployment`, `Verify deployment`, `Rollback Assets on Failure`, `Rollback on failure`) and keeps exactly the three things spec §6.2 calls for (build, R2 sync with its existing retry loop, cache purge), reading R2/Cloudflare/VITE config from `secrets.*`/`vars.*` instead of a downloaded `.env.deploy`/`.env.appprod`. The `aws` CLI itself needs no separate setup step — it's preinstalled on `ubuntu-latest` runners, and these steps only ever export R2 credentials into their own step's environment (never Lightsail's AWS account credentials), so removing the `aws-actions/configure-aws-credentials` step doesn't break the R2 upload. Per spec §6.2's own explicit read of "keep only build+sync, including its retry logic", the asset backup/cleanup/rollback-on-failure mechanism is intentionally dropped along with the SSH pieces (Railway now owns app-level rollback independently, per spec §9).

- [ ] **Step 5: Validate workflow YAML syntax locally**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "valid yaml"`
Expected: `valid yaml`

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Trim deploy workflow to build+R2-sync only; move R2/Cloudflare/VITE config to GitHub Actions secrets/variables"
```

- [ ] **Step 7: Push the branch and confirm the workflow runs successfully before merging to `main`**

```bash
git push -u origin HEAD
gh workflow run "Build and Sync Assets to R2" --ref $(git branch --show-current)
gh run watch $(gh run list --workflow="Build and Sync Assets to R2" --limit 1 --json databaseId --jq '.[0].databaseId')
```

Expected: run completes with conclusion `success`, and the "Deployment summary" step's output shows `NPM build and asset compilation`, `Cloudflare R2 asset upload`, `CDN cache purge` all listed. If it fails on a missing secret/variable, re-check Steps 2-3 — this confirms the new secrets/variables are wired correctly before this branch merges to `main` and becomes the only path that syncs assets.

---

### Task 3: [BLOCKED ON USER] Create Railway `web` and `scheduler` services, and the `staging` environment, via the Railway dashboard

This is spec's tracked item (§11.5, resolved): a project-scoped Railway API token failed to create services via `railway add`/`railway link`, so service creation has to happen manually through the dashboard — the same way Postgres was provisioned. This task cannot be executed by an agent; it requires the user's direct action in the Railway dashboard. Tasks 1-2 above do not depend on this and can proceed in parallel while this is pending. Tasks 4 onward depend on this being complete.

**Files:** none (Railway dashboard only).

**Interfaces:**
- Consumes: `railway.web.json`, `railway.scheduler.json` (Task 1) — their paths are wired into the two new services here.
- Produces: two new Railway services in the `production` environment (`web`, `scheduler`), plus a new `staging` Railway environment, all inside the existing `harun.dev` project (`24bc972c-34b3-43d7-ac34-4e1f4eedd5e7`). Task 4/5/6/8/9/10 all consume these by name.

- [ ] **Step 1: Create the `web` service (production environment)**

In the Railway dashboard: open the `harun.dev` project → ensure the `production` environment is selected → **New → GitHub Repo** → select this repository, `main` branch. Name the resulting service `web`. Do not deploy yet if Railway offers to deploy immediately with defaults — the environment variables (Task 4) need to be set first, or the first deploy will fail on a missing `APP_KEY`/`DB_*`.

- [ ] **Step 2: Point the `web` service at its config file**

In the `web` service's **Settings → Build** tab, find **Config File Path** (or "Config as Code" path override) and set it to `railway.web.json`. This is required — without it, Railway falls back to the repo-root `railway.json` (which doesn't exist) or pure dashboard defaults, and the `preDeployCommand`/`healthcheckPath` from Task 1 won't take effect.

- [ ] **Step 3: Create the `scheduler` service (production environment)**

Same project, same `production` environment → **New → GitHub Repo** → same repository, `main` branch. Name it `scheduler`. In its **Settings → Build** tab, set **Config File Path** to `railway.scheduler.json`.

- [ ] **Step 4: Create the `staging` environment**

In the Railway dashboard's **Environments** tab (top of the project view), create a new environment named `staging`. When prompted whether to start empty or duplicate from `production`, choose to duplicate — this gives `staging` its own `web` and `scheduler` service instances with the same config-file wiring as production, which Task 8 then reconfigures with staging-specific variables. If the dashboard only offers an empty environment (no duplicate option), that's fine too — Task 8 creates the two services from scratch in that case, repeating Steps 1-3 above with the `staging` environment selected instead of `production`.

- [ ] **Step 5: Confirm the four services now exist**

```bash
railway status
```

Expected output includes `Project: harun.dev` and lists services under both the `production` and `staging` environments. If `railway status` doesn't show a service list, confirm visually in the dashboard: **Project → production** environment should show `Postgres`, `web`, `scheduler`; **Project → staging** environment should show `web`, `scheduler` (and possibly its own `Postgres`, depending on what Step 4's duplicate produced — Task 8 handles this explicitly either way).

---

### Task 4: Configure the `web` service's environment variables (production environment)

**Files:** none (Railway dashboard, plus one local command to generate `APP_KEY`).

**Interfaces:**
- Consumes: Task 3's `web` service (production environment); Postgres service ID `b50c7e7b-e8a6-4d30-870f-658e4236e40b` (already provisioned, Global Constraints).
- Produces: a fully configured `web` service ready to deploy. Task 6 consumes this directly. Task 8 reuses the same variable list (with different `APP_URL`/OAuth redirect values) for the `staging` environment's `web` service.

- [ ] **Step 1: Generate a production `APP_KEY`**

```bash
php artisan key:generate --show
```

Expected: a single line like `base64:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=`. `--show` only prints the key, it does not write to the local `.env` — copy this value for Step 3. This same key is reused for the `staging` environment in Task 8 (not a fresh one), because staging is validated against a restored copy of production's actual data (Task 7) and needs to decrypt the same session/encrypted-cast data production would.

- [ ] **Step 2: Confirm the Postgres service's exact reference variable names**

In the Railway dashboard, open the `Postgres` service (production environment) → **Variables** tab. Confirm it exposes `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` (spec §4.1 states Railway injects these as "standard connection variables"). If any name differs from what's listed here, use the dashboard's actual names in place of the ones in Step 3's reference-variable values.

- [ ] **Step 3: Set the `web` service's environment variables**

In the `web` service's **Variables** tab (production environment), add each of the following. Values written as `${{Postgres.NAME}}` are Railway **reference variables** — type them literally as shown; Railway resolves them to the Postgres service's live values and keeps them in sync if Postgres's own values ever rotate.

| Variable | Value |
|---|---|
| `APP_NAME` | (current production value — pull via `aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env - \| grep '^APP_NAME='`) |
| `APP_ENV` | `production` |
| `APP_KEY` | (the value generated in Step 1) |
| `APP_DEBUG` | `false` |
| `APP_TIMEZONE` | `UTC` |
| `APP_URL` | `https://harun.dev` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `${{Postgres.PGHOST}}` |
| `DB_PORT` | `${{Postgres.PGPORT}}` |
| `DB_DATABASE` | `${{Postgres.PGDATABASE}}` |
| `DB_USERNAME` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `LOG_CHANNEL` | `stderr` |
| `LOG_STDERR_FORMATTER` | `\Monolog\Formatter\JsonFormatter` |
| `RAILPACK_PHP_ROOT_DIR` | `/app/public` |
| `RAILPACK_SKIP_MIGRATIONS` | `true` |
| `MAIL_MAILER` | (current production value from S3, same lookup pattern as `APP_NAME`) |
| `MAIL_SCHEME` | (current production value) |
| `MAIL_HOST` | (current production value) |
| `MAIL_PORT` | (current production value) |
| `MAIL_USERNAME` | (current production value) |
| `MAIL_PASSWORD` | (current production value) |
| `MAIL_FROM_ADDRESS` | (current production value) |
| `MAIL_FROM_NAME` | (current production value) |
| `RESEND_API_KEY` | (current production value) |
| `GITHUB_CLIENT_ID` | (current production value) |
| `GITHUB_CLIENT_SECRET` | (current production value) |
| `GITHUB_REDIRECT_URI` | `https://harun.dev/auth/github/callback` |
| `GOOGLE_CLIENT_ID` | (current production value) |
| `GOOGLE_CLIENT_SECRET` | (current production value) |
| `GOOGLE_REDIRECT_URI` | `https://harun.dev/auth/google/callback` |
| `SUPER_ADMIN_EMAILS` | `harun.b13@gmail.com,me@harun.dev` |
| `MAXMIND_LICENSE_KEY` | (current production value, if set) |
| `MAXMIND_ACCOUNT_ID` | (current production value, if set) |
| `VITE_APP_NAME` | `${{APP_NAME}}` (Railway resolves same-service self-references too) |
| `ASSET_URL` | `https://cdn.harun.dev` |
| `VITE_ASSET_BASE_URL` | `https://cdn.harun.dev` |
| `VITE_BOOKING_URL` | `https://calendar.app.google/udfiL5QMDefg7SiD6` |
| `VITE_BOOKING_EMBED_URL` | `https://calendar.google.com/calendar/appointments/schedules/AcZssZ2WP1vzheZr36_dTSwJ5V6xIrm3bxGnItNcqTCzLxpya9p-yA_mH6uSaKhGA98iTicoYyAoNL7n?gv=true` |

Values marked "(current production value)" should be pulled the same way as Task 2 Step 1 — `aws s3 cp s3://$CONFIG_BUCKET_NAME/secrets/envs/app/.env - | grep '^VAR_NAME='` — and pasted directly into the Railway dashboard's Variables editor, never into a committed file. `GITHUB_REDIRECT_URI`/`GOOGLE_REDIRECT_URI` are the eventual production values (`harun.dev`, not the temporary Railway subdomain) — Task 6's smoke test only checks the health endpoint and basic page loads, not the OAuth flow itself, since a full OAuth round-trip needs a stable public hostname that matches the registered redirect URI (that's what `staging.harun.dev` is for — Task 10).

- [ ] **Step 4: Enable public networking so the service is reachable for Task 6's smoke test**

In the `web` service's **Settings → Networking** tab, click **Generate Domain**. Railway assigns a `*.up.railway.app` subdomain. Note the exact hostname — Task 6 uses it.

---

### Task 5: Configure the `scheduler` service's environment variables (production environment)

**Files:** none (Railway dashboard).

**Interfaces:**
- Consumes: Task 3's `scheduler` service (production environment); Task 4's env var values (subset, listed explicitly below rather than "same as Task 4" per the plan's no-placeholder rule).
- Produces: a fully configured `scheduler` service ready to deploy.

- [ ] **Step 1: Set the `scheduler` service's environment variables**

In the `scheduler` service's **Variables** tab (production environment), add:

| Variable | Value |
|---|---|
| `APP_NAME` | same value used in Task 4 |
| `APP_ENV` | `production` |
| `APP_KEY` | same value used in Task 4 (identical key — both services must decrypt the same encrypted data) |
| `APP_DEBUG` | `false` |
| `APP_TIMEZONE` | `UTC` |
| `APP_URL` | `https://harun.dev` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `${{Postgres.PGHOST}}` |
| `DB_PORT` | `${{Postgres.PGPORT}}` |
| `DB_DATABASE` | `${{Postgres.PGDATABASE}}` |
| `DB_USERNAME` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `LOG_CHANNEL` | `stderr` |
| `LOG_STDERR_FORMATTER` | `\Monolog\Formatter\JsonFormatter` |
| `RAILPACK_SKIP_MIGRATIONS` | `true` |
| `MAIL_MAILER` | same value used in Task 4 |
| `MAIL_SCHEME` | same value used in Task 4 |
| `MAIL_HOST` | same value used in Task 4 |
| `MAIL_PORT` | same value used in Task 4 |
| `MAIL_USERNAME` | same value used in Task 4 |
| `MAIL_PASSWORD` | same value used in Task 4 |
| `MAIL_FROM_ADDRESS` | same value used in Task 4 |
| `MAIL_FROM_NAME` | same value used in Task 4 |
| `RESEND_API_KEY` | same value used in Task 4 |
| `SUPER_ADMIN_EMAILS` | `harun.b13@gmail.com,me@harun.dev` |

No `VITE_*`/`ASSET_URL`/`GITHUB_*`/`GOOGLE_*`/`MAXMIND_*`/`RAILPACK_PHP_ROOT_DIR` — the scheduler never serves HTTP, builds frontend assets, handles OAuth callbacks, or needs a document root (its `startCommand` from `railway.scheduler.json` replaces Railpack's default web-serving process entirely). It does need `DB_*`/`APP_KEY`/mail config because `schedule:run` executes real Artisan commands (queued jobs, scheduled tasks) that touch the database and could send mail.

- [ ] **Step 2: No public networking needed**

Leave **Settings → Networking** alone for the `scheduler` service — it's a background worker, not an HTTP service, and doesn't need a domain or healthcheck. Railway monitors it via the `restartPolicyType: ON_FAILURE` set in `railway.scheduler.json`.

---

### Task 6: First production-environment deploy — infra sanity check on the Railway subdomain (no DNS change)

This validates that the `web` and `scheduler` services build and boot correctly on Railway, using their eventual production configuration, reachable only at their Railway-provided subdomain — `harun.dev`'s DNS still points at Lightsail throughout this task and the rest of this plan. Full user-facing validation (including OAuth) happens on `staging.harun.dev` in Task 10.

**Files:** none.

**Interfaces:**
- Consumes: Tasks 3, 4, 5 (both services created and configured).
- Produces: a confirmed-working `web` service reachable at its `*.up.railway.app` domain, and a confirmed-running `scheduler` service. Task 7's restore targets this same Postgres instance.

- [ ] **Step 1: Trigger the first deploy**

In the Railway dashboard, open the `web` service (production environment) → **Deployments** tab → **Deploy** (or push any commit to `main`, since the service is now connected to the repo and will auto-deploy). Repeat for the `scheduler` service if it doesn't auto-deploy alongside.

- [ ] **Step 2: Watch the build logs for the Railpack Laravel auto-detection and the `preDeployCommand`**

In the `web` service's **Deployments** tab, open the active deployment's logs. Expected to see, in order: Railpack detecting PHP/Laravel (`Using Railpack` / `Detected Laravel`), `composer install`, the `npm`/asset steps Railpack's PHP provider runs if any, then the pre-deploy command chain: `php artisan migrate --force`, `config:cache`, `route:cache`, `view:cache`, `storage:link`, all with exit code 0, then `Starting Container` and finally a passing healthcheck (`Healthcheck succeeded` or equivalent, hitting `/health`).

If the deploy fails on the pre-deploy command, check that `RAILPACK_PHP_ROOT_DIR`/`DB_CONNECTION`/`DB_HOST` etc. (Task 4 Step 3) are set correctly first — a wrong `DB_*` reference variable name (Task 4 Step 2) is the most likely cause of a migration failure at this stage.

- [ ] **Step 3: Verify the health endpoint from outside Railway**

```bash
curl -s https://<web-service>.up.railway.app/health | python3 -m json.tool
```

(Substitute `<web-service>.up.railway.app` with the exact hostname noted in Task 4 Step 4.)

Expected: JSON body with `"status": "ok"` (per `routes/web.php` line 760's existing implementation), HTTP 200, and response headers including `X-App-Version` and `X-Deployment-Id`.

- [ ] **Step 4: Verify the scheduler service is running its loop, not crash-looping**

In the `scheduler` service's **Deployments → Logs**, confirm the container stays up (no repeated restarts) and that `php artisan schedule:run --no-interaction` output appears roughly once a minute without a fatal error. A `RAILPACK_SKIP_MIGRATIONS=true` misconfiguration here would show up as an unexpected `Nothing to migrate` or a duplicate migration attempt in the very first minute of logs — expected to see neither, since it should never run `migrate` at all.

- [ ] **Step 5: Verify the homepage renders (static content only — DB-backed content may still be empty until Task 7)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<web-service>.up.railway.app/
```

Expected: `200`.

---

### Task 7: Initial database dump and restore (spec §5, step 1)

Restores a realistic dataset into the already-provisioned Railway Postgres service, so Tasks 8-10 test against real data instead of an empty schema. Per spec §5, Lightsail's Postgres remains the untouched source of truth throughout — this is a read-only dump from Lightsail and a write-only restore into Railway; nothing is deleted or migrated out of Lightsail.

**Files:** none.

**Interfaces:**
- Consumes: Task 6 (confirms Railway Postgres already has the migrated schema from the `web` service's first successful `preDeployCommand` run).
- Produces: a populated Railway Postgres database. Tasks 8 and 10 read/write against it.

- [ ] **Step 1: Dump the current production database from Lightsail**

```bash
ssh -i deploy/portfolio-key.pem ubuntu@$PUBLIC_IP \
  "docker compose -f /opt/portfolio/docker/docker-compose.yml exec -T db \
   pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB --no-owner --no-acl -F c -f /tmp/harun_dev_initial.dump"
scp -i deploy/portfolio-key.pem ubuntu@$PUBLIC_IP:/tmp/harun_dev_initial.dump ./harun_dev_initial.dump
ssh -i deploy/portfolio-key.pem ubuntu@$PUBLIC_IP "rm -f /tmp/harun_dev_initial.dump"
```

`$PUBLIC_IP` and the key path match what `.github/workflows/deploy.yml` used before Task 2's rewrite (`deploy/portfolio-key.pem`, `ubuntu@$PUBLIC_IP`) — retrieve `$PUBLIC_IP` the same way that workflow did, from `deploy/.env.deploy` (`grep '^PUBLIC_IP=' deploy/.env.deploy`) if not already exported. `-F c` (custom format) is required for `pg_restore` in the next step; `--no-owner --no-acl` avoids restore failures from role/owner mismatches between the Lightsail Postgres role and Railway's.

Expected: `harun_dev_initial.dump` exists locally and is non-trivial in size (`ls -lh harun_dev_initial.dump`).

- [ ] **Step 2: Temporarily enable public networking on the Railway Postgres service**

In the Railway dashboard, open the `Postgres` service (production environment) → **Settings → Networking → TCP Proxy** (or the equivalent public-networking toggle in that tab) → enable it. Railway shows a public host and port (distinct from the internal `PGHOST`/`PGPORT`, which only resolve inside Railway's private network).

- [ ] **Step 3: Restore into Railway Postgres**

```bash
railway variables --service Postgres --environment production --kv | grep -E '^(PGUSER|PGPASSWORD|PGDATABASE)='
```

Note the values, then, using the public host/port from Step 2 (call them `$RAILWAY_PG_PUBLIC_HOST` / `$RAILWAY_PG_PUBLIC_PORT`):

```bash
PGPASSWORD="<PGPASSWORD from above>" pg_restore \
  --host="$RAILWAY_PG_PUBLIC_HOST" \
  --port="$RAILWAY_PG_PUBLIC_PORT" \
  --username="<PGUSER from above>" \
  --dbname="<PGDATABASE from above>" \
  --no-owner --no-acl --clean --if-exists \
  ./harun_dev_initial.dump
```

`--clean --if-exists` drops conflicting objects before recreating them, so this is safe to re-run if it needs a retry. Expected: `pg_restore` completes with only `NOTICE`-level output (about objects that didn't exist yet to drop) — no `ERROR` lines. If it errors on a specific table already having Railway's own freshly-migrated schema in a slightly different state than Lightsail's, that's expected on the very first restore (Railway's schema came from `migrate` in Task 6, Lightsail's from its own migration history) — `--clean` handles this by dropping and recreating rather than merging.

- [ ] **Step 4: Spot-check the restored data**

```bash
PGPASSWORD="<PGPASSWORD>" psql --host="$RAILWAY_PG_PUBLIC_HOST" --port="$RAILWAY_PG_PUBLIC_PORT" \
  --username="<PGUSER>" --dbname="<PGDATABASE>" -c "\dt" -c "SELECT count(*) FROM users;"
```

Expected: the same table list as Lightsail's production schema, and a `users` row count matching production (not zero).

- [ ] **Step 5: Disable public networking on Postgres again**

Back in **Settings → Networking → TCP Proxy**, disable it. The `web`/`scheduler` services don't need it — they connect over Railway's private network via `${{Postgres.PGHOST}}` etc. (Task 4/5). Leaving public networking on is unnecessary exposure once the restore is done.

- [ ] **Step 6: Re-verify the `web` service still serves correctly against the newly-restored data**

```bash
curl -s https://<web-service>.up.railway.app/health | python3 -m json.tool
curl -s -o /dev/null -w "%{http_code}\n" https://<web-service>.up.railway.app/blog
```

Expected: both `200`. The blog index route now reflects real restored content instead of an empty database.

---

### Task 8: Configure the `staging` environment's `web` and `scheduler` services

**Files:** none (Railway dashboard).

**Interfaces:**
- Consumes: Task 3 Step 4 (the `staging` environment and its duplicated or freshly-created `web`/`scheduler` services); Task 4/5's variable values (staging uses the same secrets, different `APP_URL`/redirect URIs); Task 7 (staging points at the same restored Postgres data).
- Produces: a configured, deployable `staging` environment. Task 9 gives it a real hostname; Task 10 validates it end-to-end.

- [ ] **Step 1: Confirm the `staging` environment's `web`/`scheduler` services exist and are wired to their config files**

In the Railway dashboard, switch to the `staging` environment. If Task 3 Step 4's "duplicate from production" carried over the `Config File Path` settings from the `production` services, confirm each service's **Settings → Build → Config File Path** still reads `railway.web.json` / `railway.scheduler.json` respectively. If `staging` was created empty instead, repeat Task 3 Steps 1-3 here (same repo/branch, `staging` environment selected, same config file paths).

- [ ] **Step 2: Determine whether `staging` got its own Postgres or none**

In the `staging` environment, check whether a `Postgres` service exists. If Task 3 Step 4's duplicate included Postgres, `staging` now has its own separate Postgres instance with its own empty schema — for the pre-cutover validation this plan targets, `staging` needs to point at the **same already-restored data** from Task 7, not a fresh empty database. Two valid outcomes, pick based on what actually exists:
  - If `staging` has no Postgres service of its own: proceed to Step 3, which points `staging`'s `web`/`scheduler` at the `production` environment's Postgres using copied literal values (Railway reference variables like `${{Postgres.PGHOST}}` only resolve within the same environment, so cross-environment reference syntax isn't used here).
  - If `staging` does have its own Postgres service: delete it (Railway dashboard → that Postgres service → **Settings → Danger Zone → Remove Service**) so `staging` shares the one Postgres instance already populated in Task 7, keeping this pre-cutover phase's data consistent with what's validated in Task 6/7. Then proceed to Step 3.

- [ ] **Step 3: Set the `staging` `web` service's environment variables**

Same table as Task 4 Step 3, with these differences:

| Variable | Value |
|---|---|
| `APP_ENV` | `staging` |
| `APP_URL` | `https://staging.harun.dev` |
| `DB_HOST` | literal copy of the production Postgres's current `PGHOST` value (from Task 7 Step 3's lookup) — not a `${{Postgres.PGHOST}}` reference, since `staging` is a different Railway environment than where that Postgres service lives |
| `DB_PORT` | literal copy of `PGPORT` |
| `DB_DATABASE` | literal copy of `PGDATABASE` |
| `DB_USERNAME` | literal copy of `PGUSER` |
| `DB_PASSWORD` | literal copy of `PGPASSWORD` |
| `GITHUB_REDIRECT_URI` | `https://staging.harun.dev/auth/github/callback` |
| `GOOGLE_REDIRECT_URI` | `https://staging.harun.dev/auth/google/callback` |

All other variables (`APP_NAME`, `APP_KEY` — same key as production, per Task 4 Step 1's rationale, `DB_CONNECTION=pgsql`, `SESSION_DRIVER`/`CACHE_STORE`/`QUEUE_CONNECTION=database`, `LOG_CHANNEL=stderr`, `LOG_STDERR_FORMATTER`, `RAILPACK_PHP_ROOT_DIR=/app/public`, `RAILPACK_SKIP_MIGRATIONS=true`, `MAIL_*`, `RESEND_API_KEY`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `SUPER_ADMIN_EMAILS`, `MAXMIND_*`, `VITE_APP_NAME`, `ASSET_URL`, `VITE_ASSET_BASE_URL`, `VITE_BOOKING_URL`, `VITE_BOOKING_EMBED_URL`) are identical to Task 4 Step 3's values — same OAuth app credentials (spec §11.6: reuse existing OAuth apps, don't create separate staging ones), same R2 CDN, same mail provider.

Since `staging`'s `preDeployCommand` (inherited from `railway.web.json` via its Config File Path) runs `php artisan migrate --force` on every deploy too, and it's now pointed at the same Postgres instance production uses, this is intentional and safe — migrations are idempotent (Laravel tracks applied migrations in the `migrations` table), so a `staging` deploy re-running `migrate --force` against already-migrated schema is a no-op.

- [ ] **Step 4: Set the `staging` `scheduler` service's environment variables**

Same table as Task 5 Step 1, with `APP_ENV=staging`, `APP_URL=https://staging.harun.dev`, and the same literal (non-reference) `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` values used in Step 3 above. To avoid running the schedule loop **twice** against the same data (once from `production`'s scheduler, once from `staging`'s), and since `staging` is a pre-cutover validation environment rather than a second production, do not enable public networking or deploy this service continuously — deploy it only when actively testing scheduler-dependent behavior in Task 10, then stop it (Railway dashboard → service → **Settings → Danger Zone → Sleep/Remove**, or simply leave its deploy un-triggered) once validation is done. Note this explicitly in Task 10's steps.

- [ ] **Step 5: Deploy the `staging` `web` service and enable its Railway-provided domain**

Same as Task 6 Steps 1-3, but for the `staging` environment's `web` service. Note the `*.up.railway.app` hostname it gets — Task 9 adds a real `staging.harun.dev` domain on top of this, but the Railway-provided one keeps working as a fallback.

- [ ] **Step 6: Add `staging.harun.dev`'s callback URLs to the existing GitHub and Google OAuth apps**

Per spec §11.6 (resolved: reuse existing apps, don't create new ones):
- GitHub: **github.com/settings/developers** → the existing OAuth App used for `GITHUB_CLIENT_ID` → **Authorization callback URL** — GitHub only supports one callback URL per app in the classic OAuth Apps UI, so if `https://harun.dev/auth/github/callback` is already set as the single value, either use a GitHub App (which supports multiple callback URLs) or, if using the classic flow, add `https://staging.harun.dev/auth/github/callback` as an **additional** authorized redirect URI if the app's settings UI shows a multi-value list (newer GitHub OAuth Apps support this); otherwise this is a known GitHub OAuth App limitation to flag back before Task 10's auth-flow validation, not something to silently work around by creating a second app (that would contradict the resolved decision).
- Google: **console.cloud.google.com** → **APIs & Services → Credentials** → the existing OAuth 2.0 Client ID used for `GOOGLE_CLIENT_ID` → **Authorized redirect URIs** → **Add URI** → `https://staging.harun.dev/auth/google/callback`. Google's console supports multiple redirect URIs per client natively — no limitation here.

Expected: Google's console shows both `https://harun.dev/auth/google/callback` and `https://staging.harun.dev/auth/google/callback` listed. For GitHub, confirm whether the existing app is a "GitHub App" or an "OAuth App" (classic) — only the latter has the single-callback-URL limitation described above.

---

### Task 9: Add the `staging.harun.dev` custom domain

**Files:** none (Railway dashboard + Cloudflare dashboard). This is the only DNS change this plan makes — it targets the `staging` subdomain only, never `harun.dev` itself.

**Interfaces:**
- Consumes: Task 8 Step 5 (the `staging` `web` service's Railway-provided domain).
- Produces: `staging.harun.dev` resolving to the `staging` `web` service. Task 10 tests against this hostname.

- [ ] **Step 1: Add a custom domain in Railway**

In the `staging` `web` service's **Settings → Networking → Custom Domain**, click **Add Domain**, enter `staging.harun.dev`. Railway shows a CNAME target (typically `<something>.up.railway.app` or a Railway-specific edge hostname) — note it exactly.

- [ ] **Step 2: Add the CNAME record in Cloudflare**

In the Cloudflare dashboard, `harun.dev` zone → **DNS** → **Add record**: Type `CNAME`, Name `staging`, Target = the exact value Railway showed in Step 1, Proxy status = Proxied (orange cloud) to keep it behind Cloudflare like the rest of the site.

- [ ] **Step 3: Verify DNS propagation and TLS**

```bash
dig +short staging.harun.dev
curl -sI https://staging.harun.dev/health | head -5
```

Expected: `dig` resolves to a Cloudflare IP (proxied), and `curl` returns `HTTP/2 200` once Railway finishes issuing/attaching a certificate for the custom domain (this can take a few minutes — Railway shows the domain's status as "Active" in the dashboard once ready).

---

### Task 10: End-to-end validation on staging

**Files:** none.

**Interfaces:**
- Consumes: Tasks 7, 8, 9 (populated database, configured services, working `staging.harun.dev` domain).
- Produces: a validated, real-domain rehearsal of the full production stack. Nothing downstream in this plan consumes this — this is the plan's terminal task; the production DNS cutover (spec §8 steps 2-5) is a separate, later, human-gated piece of work per Global Constraints.

- [ ] **Step 1: Health check**

```bash
curl -s https://staging.harun.dev/health | python3 -m json.tool
```

Expected: `"status": "ok"`, HTTP 200.

- [ ] **Step 2: Homepage and static-content routes**

```bash
for path in / /blog /bio; do
  echo "$path:"; curl -s -o /dev/null -w "  %{http_code}\n" "https://staging.harun.dev$path"
done
```

Expected: `200` for all three.

- [ ] **Step 3: Asset loading from R2 CDN**

```bash
curl -s https://staging.harun.dev/ | grep -o 'https://cdn.harun.dev/build/[^"]*\.js' | head -1
```

Expected: at least one match — confirms the built page references `cdn.harun.dev` assets (via `VITE_ASSET_BASE_URL`, Task 8 Step 3), and that reference resolves:

```bash
ASSET_URL=$(curl -s https://staging.harun.dev/ | grep -o 'https://cdn.harun.dev/build/[^"]*\.js' | head -1)
curl -s -o /dev/null -w "%{http_code}\n" "$ASSET_URL"
```

Expected: `200`.

- [ ] **Step 4: GitHub OAuth login flow**

Manually, in a browser: visit `https://staging.harun.dev/auth/github/redirect` (or the app's login page, whichever route Laravel Socialite is wired to), complete the GitHub OAuth consent screen, and confirm redirect back to `https://staging.harun.dev/auth/github/callback` succeeds and results in an authenticated session (not an error page). This depends on Task 8 Step 6's GitHub callback-URL registration actually accepting the staging callback — if GitHub's classic OAuth App only allows one callback URL and it's still set to the production one, this step will fail with a `redirect_uri_mismatch`-style error, which is the expected signal to resolve that registration gap before continuing.

- [ ] **Step 5: Google OAuth login flow**

Same as Step 4, via `https://staging.harun.dev/auth/google/redirect`. Google supports multiple redirect URIs (Task 8 Step 6), so this should succeed without the same caveat.

- [ ] **Step 6: Database read confirmed against Task 7's restored data**

In the browser session from Step 4/5 (now authenticated), visit an admin/authenticated route that reads real data (e.g. the admin dashboard, if `SUPER_ADMIN_EMAILS` includes the logged-in account) and confirm it shows the same content as production — the row counts and content should match what Task 7 Step 4's `psql` spot-check showed.

- [ ] **Step 7: Database write confirmed**

Perform one small, reversible write through the app's UI while authenticated (e.g. update a profile field, or whatever low-risk authenticated write path exists), then confirm it persisted:

```bash
PGPASSWORD="<PGPASSWORD>" psql --host="$RAILWAY_PG_PUBLIC_HOST" --port="$RAILWAY_PG_PUBLIC_PORT" \
  --username="<PGUSER>" --dbname="<PGDATABASE>" -c "SELECT updated_at FROM users ORDER BY updated_at DESC LIMIT 1;"
```

(Re-enable Postgres's public networking toggle from Task 7 Step 2 temporarily if it was left disabled, then disable it again afterward.) Expected: a very recent `updated_at` timestamp matching when the write was made.

- [ ] **Step 8: Scheduler sanity check (staging)**

Per Task 8 Step 4, trigger a one-off deploy of the `staging` `scheduler` service, watch its logs for one `schedule:run` cycle completing without error, then stop it again so it isn't running continuously alongside `production`'s scheduler against the same data.

---

## Out of Scope for This Plan (explicitly deferred, human-gated)

The following are described in the approved spec but are **not** tasks in this plan, per the user's explicit sequencing instruction — they happen later, only after the user separately reviews Task 10's validation results and greenlights the cutover:

- Spec §5 step 3: the final `pg_dump`/restore immediately before cutover (captures writes made between Task 7's initial dump and the actual cutover moment).
- Spec §8 step 3: flipping `harun.dev`'s Cloudflare DNS record from the Lightsail IP to Railway's production `web` service.
- Spec §8 step 4: the 48-hour Lightsail verification window post-cutover (spec §11.7, resolved).
- Spec §8 step 5: sunsetting the Lightsail instance once the verification window passes.

Do not schedule or begin any of these as a continuation of this plan's completion. They require a separate, explicit go-ahead from the user.

---

## Self-Review

**1. Spec coverage** — walked every numbered section of `docs/superpowers/specs/2026-07-29-railway-migration-design.md` against the tasks above:
- §2 (current architecture), §3 (target architecture): grounding only, reflected in Global Constraints and task rationale — no task needed.
- §4.1 (Postgres, already provisioned): referenced, not recreated (Global Constraints, Task 4 Step 2, Task 7).
- §4.2 (web service + env vars): Tasks 3-6.
- §4.3 (DB variable mapping gap): resolved via §11.4's discrete-variables decision, implemented in Task 4/5/8.
- §4.4 (R2 unchanged): Task 2 (VITE_*/ASSET_URL values preserved), no R2-side changes anywhere — confirmed against Global Constraints.
- §4.5 (DNS): Task 9 (staging only) — production DNS explicitly excluded, see Out of Scope section.
- §5 (DB cutover sequence): step 1 → Task 7; step 2 (iterate/validate) → Task 10; steps 3-4 → Out of Scope section.
- §6.1 (what's dropped from deploy.yml): Task 2 Step 4, itemized against every dropped step name.
- §6.2 (what's kept): Task 2 Step 4, itemized against every kept step, including the explicit backup/rollback-steps interpretation call.
- §6.3 (secrets/vars migration): Task 2 Steps 1-3.
- §6.4 (app deploy trigger): reflected in Architecture summary and Task 3 (connecting the repo is what causes this).
- §7 (staging environment): Tasks 3 Step 4, 8, 9, 10.
- §8 step 1 (staging validated against restored data): Task 10. Steps 2-5: Out of Scope section, explicitly.
- §9 (rollback posture): app-level rollback is Railway-native (no task needed, it's platform behavior); asset rollback trade-off accepted per §6.2's read (Task 2); DB rollback posture preserved by never touching Lightsail's DB (Task 7 Step 1 is read-only against it); migration-failure-must-fail-loud requirement is what `preDeployCommand`'s `&&`-chaining in Task 1 Step 1 implements.
- §10 (Docker/build): explicitly out of scope per Global Constraints (no Dockerfile/compose changes) — confirmed no task touches `docker/Dockerfile`, `docker/docker-compose.yml`, or `docker-compose.dev.yml`.
- §11.1-§11.7 (all seven resolved decisions): Nixpacks→Railpack correction (Global Constraints, Task 1); second service for scheduler (Task 1, 3, 5, 8); release command (Task 1 Step 1); discrete DB_* reference vars (Task 4/5/8); manual dashboard service creation (Task 3, marked BLOCKED ON USER); reused OAuth apps with staging redirect URIs added (Task 8 Step 6); 48h verification window (Out of Scope section, since it's part of the excluded cutover phase).
- §12 (non-goals): every bullet mapped to a Global Constraints line.
Gaps found and closed during this review: none outstanding — the three "new grounding finding" items (Railpack auto-migration double-run risk, `DB_CONNECTION=pgsql` default gap, ephemeral-filesystem logging gap) were folded into Global Constraints and every relevant task's variable table rather than left as spec-only footnotes.

**2. Placeholder scan** — searched for "TBD"/"TODO"/"similar to Task N"/"add appropriate": none found. Every "(current production value)" cell in Task 4/5/8's variable tables is paired with the exact `aws s3 cp ... | grep '^VAR='` command to retrieve the real value (Task 2 Step 1, Task 4 Step 3) rather than left unresolved — this is a deliberate real value handled at execution time (production credentials), the same pattern used for the R2/Cloudflare secrets in Task 2, not a placeholder. Every code/command block contains complete, runnable content, not sketches.

**3. Type/name consistency** — cross-checked identifiers used across tasks:
- `railway.web.json` / `railway.scheduler.json` (Task 1) referenced by identical filenames in Task 3 Steps 2/3 and Task 8 Step 1.
- Service names `web`, `scheduler`, environment names `production`, `staging` used identically from Task 3 onward.
- Reference variable syntax `${{Postgres.PGHOST}}` etc. (Task 4 Step 3) matches the exact variable names confirmed in Task 4 Step 2 and referenced again identically in Task 5 Step 1; Task 8 Step 3 correctly switches these to literal copied values with an explicit rationale (cross-environment references don't resolve), rather than reusing the `${{}}` syntax incorrectly.
- `/health` route behavior (Task 1 Step 1's `healthcheckPath`, Task 6 Step 3, Task 10 Step 1) consistently described as returning `"status": "ok"` JSON — matches `routes/web.php` line 760's actual implementation, not assumed.
- `RAILPACK_SKIP_MIGRATIONS=true` appears on both `web` (Task 4) and `scheduler` (Task 5, Task 8) — consistent with the Global Constraints rationale that only the `web` service's explicit `preDeployCommand` should ever run `migrate`.
- `APP_KEY` value: generated once in Task 4 Step 1, explicitly reused (not regenerated) in Task 5 Step 1 and Task 8 Step 3, each with the rationale stated inline rather than assumed silently.
