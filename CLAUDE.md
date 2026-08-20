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
