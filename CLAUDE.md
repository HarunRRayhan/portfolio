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

## Performance / CDN / SEO

- **Media CDN vs same-origin `/build`:** Serve images and blog/service/case-study
  assets from `https://cdn.harun.dev` (`CDN_ASSET_URL` / `VITE_ASSET_BASE_URL`,
  `App\Support\Cdn`, `getImageUrl()`). Keep Vite JS/CSS on **`harun.dev/build`**
  (leave Laravel `ASSET_URL` empty). Pointing `ASSET_URL` at the CDN caused a
  production hash mismatch / blank app — do not repeat. Details:
  `docs/cdn-image-usage.md`.
- **Deploy cache purge:** GHA syncs `build`/`fonts`/`images`/`blog-assets`/
  `service-assets`/`case-studies-assets` to R2, then purges **prefixes on
  `cdn.harun.dev` only**. Never restore `purge_everything` — it nukes HTML edge
  cache on `harun.dev` for no gain on hashed assets.
- **SEO does not require Inertia SSR here.** Title, description, canonical, OG,
  and JSON-LD already ship in the Blade first response; empty `#app` is fine for
  crawlers. Prefer weight cuts + CDN + leaner PHP over SSR/Next rewrites unless
  first-paint UX is still bad after those.
- **`/blog` TTFB:** `BlogRepository` caches **metadata only** (~15 min,
  key `blog.repository.payload.meta1.*`). Full HTML is hydrated on demand via
  `withContent()` for post pages / `llms-full`. Index cards use canonical URLs
  for `shareUrl` (short `/s/...` links stay on post pages). View counts use one
  `blog.views.map.*` cache — do not reintroduce per-slug `Cache::put` storms on
  the index. With `CACHE_STORE=database`, a fat HTML blob in cache was the main
  `/blog` vs homepage gap.
- **Security while speeding up:** Only rewrite public media paths; do not move
  secrets, sessions, or `/build` onto the CDN; do not weaken auth/CSP for speed.

## Blog

- **Weekly topic shortlist** lives outside this repo at
  `~/Code/blog-writer/output/weekly-shortlist-YYYY-MM-DD.md`. When asked what
  to post, show the scored top 10 with a one-line angle each, wait for a
  number, then draft. Don't default-pick and write in the same turn. Details
  are in `.claude/agents/blog-writer.md`.
- **HTML tables in posts are supported.** `resources/js/Pages/Blog/Post.tsx`
  styles `<table>` (borders, padding, zebra rows, horizontal scroll shell).
  Prefer a real table over a smashed plain-text comparison.
- **Frontend / media after merge** ship via the GitHub Action
  "Build and Sync Assets to R2". A merged CSS/JS/image change is not fully live
  on harun.dev until that workflow finishes (and CDN prefixes are purged).
  Railway deploys PHP independently — BlogRepository/TTFB fixes can go live
  before R2 finishes.
