---
name: local-verify
description: Use when a harun.dev change needs a real, authenticated local browser check before release.
---

# Local browser verification

Run the app against an isolated SQLite copy. A worktree's `.env` may be a symlink to the main checkout, so never edit, replace, or back it up for verification.

1. If the check touches an integration or deployment, inspect `/Users/rayhan/Code/haruns-portfolio/.secrets` first. Read secrets only into environment variables and never print them. Do not run live Stripe payments.
2. Build assets with `npm run build`. Confirm the browser loads `/build/assets/...` from localhost; a stale `public/hot` or remote Vite client can break hydration.
3. Copy `database/database.sqlite` to a temporary SQLite file. In worktrees without that fixture, copy `/Users/rayhan/Code/haruns-portfolio/database/database.sqlite`. Create a throwaway admin account in the copy if login is needed; do not change the source fixture or real account credentials.
4. Start a durable local server process with `APP_ENV=local DB_CONNECTION=sqlite DB_DATABASE=<absolute-temp-db-path> php artisan serve --host=127.0.0.1 --port=<free-port>`. Set both database variables. If `bootstrap/cache/config.php` is present, clear that worktree's cached config before starting. Keep the server process attached to a session so it can be stopped precisely.
5. Verify the actual route in a headless Playwright browser. Check the interaction or content the change affects, plus mobile when layout is relevant. For persistent navigation state, follow a child link, reload, close the group, and check the narrow sidebar hover flyout. Prefer DOM state and computed styles for assertions. The admin dashboard is `/admin/dashboard`; it should not include public navigation, footer, or popups.
6. Stop only the server process started for this check and delete only its temporary database and browser artifacts. Leave `.env` and other worktrees untouched.

`BlogRepository` caches post metadata for about 15 minutes. After changing frontmatter or removing a post, use a fresh cache namespace, an isolated cache, or a targeted cache clear before trusting local results. A successful local build does not prove deployment. Check Railway, the asset workflow, and the live response separately; use the published manifest or workflow output for the CI asset hash, which can differ from the local build.
