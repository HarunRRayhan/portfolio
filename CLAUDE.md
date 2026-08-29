# CLAUDE.md

Project-specific notes for Claude Code sessions working in this repo.

## Infra (Railway + Cloudflare)

- **Railway's `preDeployCommand` runs in a separate, ephemeral container from the actual runtime instance.** Files written there (e.g. a downloaded database) do NOT persist to the serving container's filesystem unless a Railway volume is attached to the service. Don't assume a predeploy write is visible at runtime.
- **`web` and `scheduler` are separate Railway services with no shared volume.** A file downloaded or written on one is invisible to the other.
- **Only `harun.dev` (Cloudflare-proxied) should be a public route to `web`.** The Railway-generated `*.up.railway.app` domain bypasses Cloudflare entirely and must stay removed (service → Settings → Networking) — any code that trusts a Cloudflare-only header (`Cf-Ipcountry`, etc.) depends on this staying true.
- **Visitor country comes from Cloudflare's `Cf-Ipcountry` request header** (`app/Services/CountryResolver.php`), not a local GeoIP database — Cloudflare resolves it free at the edge on every proxied request. Prefer this pattern for any future IP-geo need before reaching for a paid or self-hosted service.

## Claude Code auto-mode permission gate

The auto-mode classifier blocks these Railway/infra actions from Bash even after explicit user go-ahead in chat — don't retry in a loop, ask the user to do it manually (Railway dashboard or their own terminal):
- `railway ssh`
- `railway volume add` / `delete`
- `railway domain delete`
- `railway variable delete`
- `railway connect` (DB tunnel)

`gh pr merge` is sometimes blocked too, inconsistently — one retry often succeeds; if it doesn't, ask the user to merge.

## Blog

- **Weekly topic shortlist** lives outside this repo at
  `~/Code/blog-writer/output/weekly-shortlist-YYYY-MM-DD.md`. When asked what
  to post, show the scored top 10 with a one-line angle each, wait for a
  number, then draft. Don't default-pick and write in the same turn. Details
  are in `.claude/agents/blog-writer.md`.
- **HTML tables in posts are supported.** `resources/js/Pages/Blog/Post.tsx`
  styles `<table>` (borders, padding, zebra rows, horizontal scroll shell).
  Prefer a real table over a smashed plain-text comparison.
- **Frontend assets after merge** ship via the GitHub Action
  "Build and Sync Assets to R2". A merged CSS/JS change is not live on
  harun.dev until that workflow finishes and Cloudflare cache is purged.
