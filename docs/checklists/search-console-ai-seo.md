# Search Console and AI crawler operator checklist

Code now emits crawler-visible meta, a complete sitemap, and valid Organization / FAQ / Person JSON-LD. Two steps stay in dashboards you control.

## Cloudflare bot preferences (`harun.dev`)

Goal: answer engines can cite the site; training-only bots stay blocked.

1. Open Cloudflare → `harun.dev` → **AI Crawl Control** / **Bot preferences** (or **Scrape Shield** → AI bots, depending on the current dashboard label).
2. Set:
   - **Search:** allow (Googlebot and Bingbot must stay allowed)
   - **Agents / AI-input:** allow (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-User)
   - **Training:** block (GPTBot, Google-Extended, ClaudeBot, CCBot, Bytespider)
3. If a **Content signal `use`** control exists, set it to **full** so models may quote with attribution. Keep `ai-train=no`.
4. Confirm Bot Fight Mode / Super Bot Fight Mode is not challenging Googlebot.
5. Leave the Railway `*.up.railway.app` hostname unpublished (see `CLAUDE.md`).

Verify:

```bash
curl -sS https://harun.dev/robots.txt
```

Trainers should still be `Disallow: /`. Answer-bot user agents should not be. `Google-Extended` remaining disallowed is correct (Gemini training, not AI Overviews).

The Laravel `robots.txt` only adds the sitemap line and an llms.txt hint. Cloudflare prepends its managed block; do not try to override trainers from the app.

## Google Search Console (after deploy)

Property: `sc-domain:harun.dev`

1. Sitemaps → resubmit `https://harun.dev/sitemap.xml`.
2. URL Inspection → `https://harun.dev/services/devops` → confirm valid Organization + Service + FAQPage.
3. URL Inspection → one published blog post → confirm Article/meta and no `noindex`.
4. Coverage: the 16 `/services/*` URLs, `/bio`, `/hrr`, and `/products` should start appearing over the next crawl cycle.

`php artisan seo:ping-sitemap` prints these same GSC steps and pings Bing. Google retired `/ping?sitemap=`.
