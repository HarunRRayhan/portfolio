---
name: local-verify
description: Use before shipping any frontend/backend change in this repo that needs a real browser check (UI tweaks, layout fixes, auth-gated pages). Spins up the app locally against the sqlite fixture DB instead of the real Postgres config, so you can log in as the admin user and click around, then cleanly reverts everything.
---

# local-verify

`.env` in this repo is configured for `pgsql` against a local Postgres
instance. For a one-off local check, swap to the `sqlite` fixture DB instead
of touching the real Postgres config — no server process to manage, already
seeded with an admin user.

## Steps

1. **Back up and swap** `.env`:
   ```bash
   cp .env .env.verify-backup
   ```
   Set both of these — **not just `DB_CONNECTION`**:
   ```
   DB_CONNECTION=sqlite
   DB_DATABASE=/absolute/path/to/repo/database/database.sqlite
   ```
   Leaving `DB_DATABASE=portfolio` (the pgsql database name) throws
   `SQLiteDatabaseDoesNotExistException: Database file at path [portfolio]
   does not exist` — the sqlite driver treats `DB_DATABASE` as a file path,
   not a name.

2. **Clear cached config** — Laravel caches config, so a running/previous
   `artisan serve` process (or a stale config cache) keeps using the old DB
   connection until cleared:
   ```bash
   php artisan config:clear
   ```

3. **Build frontend assets, don't run a dev server.** `.env` has
   `APP_ENV=production`, so Laravel serves the built `public/build` assets
   via the Vite manifest, not a live dev server:
   ```bash
   npm run build
   ```

4. **Serve and drive it with a real browser** (Playwright MCP tools):
   ```bash
   php artisan serve --port=8321
   ```
   The sqlite fixture already has a promoted admin user
   (`harun.b13@gmail.com`, `role=admin`) — session cookies from prior runs
   in the same browser context often carry over, so `/dashboard` may
   already be authenticated without a fresh login.

   Prefer `browser_evaluate` (`getBoundingClientRect()`,
   `getComputedStyle()`, DOM queries) over `browser_take_screenshot` for
   verification — screenshots have been flaky in this environment (timeout
   waiting for fonts to load).

5. **Always clean up**, even if the check found a problem:
   ```bash
   pkill -f "artisan serve --port=8321"
   mv .env.verify-backup .env
   rm -rf .playwright-mcp
   ```
   Confirm `DB_CONNECTION=pgsql` is restored before moving on.

## Why this matters here

This repo's admin area (`/dashboard`, `/profile`, `/admin/*`) is a distinct
product surface from the public marketing site — no public nav, footer, or
popups should leak into it (see the `feedback_pr_and_deploy_workflow` /
`project_admin_area_separation` memories). Verifying UI changes in a real
logged-in browser session, not just `tsc --noEmit`/`npm run build`, is what
catches that class of regression before it ships.
