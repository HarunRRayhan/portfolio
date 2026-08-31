# CDN Image Usage Guide

How static media reaches `cdn.harun.dev` without breaking hashed JS/CSS.

## Hard rule: media CDN ≠ Laravel `ASSET_URL`

| Env | Purpose |
|-----|---------|
| `CDN_ASSET_URL` | Laravel media (`App\Support\Cdn`) — covers, blog/service/case-study assets, OG images |
| `VITE_ASSET_BASE_URL` | Baked into the Vite client for `getImageUrl()` / `<Image>` |
| `ASSET_URL` | **Leave empty in production** |

Setting Laravel `ASSET_URL=https://cdn.harun.dev` makes `@vite` / `asset('/build/...')` point at R2. GHA builds and Railway’s `public/build` can diverge → **blank site / hash mismatch**. JS and CSS must stay **same-origin** on `harun.dev/build/...`.

Production behavior: `vite.config.js` and deploy.yml fall back to `https://cdn.harun.dev` for client media when `VITE_ASSET_BASE_URL` is empty. `App\Support\Cdn` uses `CDN_ASSET_URL`, then `VITE_ASSET_BASE_URL`, then `ASSET_URL`; when all are empty, media stays same-origin. `Cdn::url()` never rewrites paths under `build/`.

## What lives on the CDN

Synced by “Build and Sync Assets to R2”:

- `public/build` (also on R2 historically; **browsers load `/build` from origin**)
- `public/fonts`, `public/images`
- `public/blog-assets`, `public/service-assets`, `public/case-studies-assets`

Cache purge after sync is **prefix/host purge for `cdn.harun.dev` only** — never `purge_everything` (that blows HTML/edge cache on `harun.dev`).

## Frontend

```tsx
import { getImageUrl } from '@/lib/imageUtils';
// or
import { Image } from '@/Components/Image';

<img src={getImageUrl('/images/aws-certifications.webp')} alt="..." />
<Image src="/images/clients/alen.webp" alt="..." />
```

Local/dev with empty `VITE_ASSET_BASE_URL` → root-relative paths. Prefer compressed **webp/jpeg**; keep filenames stable so CDN URLs and frontmatter stay valid.

## Backend / markdown HTML

- Covers and SEO assets: `Cdn::url()` / `SeoCatalog::assetUrl()`
- In-post HTML: `Cdn::rewriteHtml()` rewrites root-relative `/blog-assets|service-assets|case-studies-assets|images/...` only
- After changing rewrite behavior, bump `BlogRepository` / `CaseStudyRepository` cache key suffixes so the database cache does not serve stale HTML for up to 15 minutes

## Verify live

```bash
# Media from CDN
curl -sL https://harun.dev/ | rg -o 'cdn\.harun\.dev/[^" ]+' | head
# JS still same-origin
curl -sL https://harun.dev/ | rg -o 'src="[^"]*build/assets/[^"]+' | head
# No ASSET_URL foot-gun
curl -sL https://harun.dev/ | rg 'cdn\.harun\.dev/build' || echo 'good: no cdn/build'
```
