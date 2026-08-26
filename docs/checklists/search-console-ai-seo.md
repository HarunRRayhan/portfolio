# Search Console and AI crawler operator checklist

Code now emits crawler-visible meta, a complete sitemap, and valid Organization / FAQ / Person JSON-LD. Two steps stay in dashboards you control.

## Cloudflare bot preferences (`harun.dev`)

Goal: AI search and agents can cite the site, models may train on it, junk scrapers are not specially invited. Bot Fight Mode stays off so Googlebot is not challenged.

1. Open Cloudflare → `harun.dev` → **Security Settings** → **Configure AI bot policies**.
2. Set:
   - **Search:** allow
   - **Agents / AI-input:** allow
   - **Training:** allow
3. Turn **off** Cloudflare managed `robots.txt` so it does not inject `ai-train=no` or trainer `Disallow`s.
4. Confirm Bot Fight Mode / Super Bot Fight Mode is off.
5. Leave the Railway `*.up.railway.app` hostname unpublished (see `CLAUDE.md`).

API fields (zone `bot_management`): `ai_search`, `ai_user`, and `ai_training` all `disabled` (disabled = do not block). `ai_bots_protection` `disabled`. `is_robots_txt_managed` `false`. `fight_mode` `false`.

Verify:

```bash
curl -sS https://harun.dev/robots.txt
curl -sS -o /dev/null -w '%{http_code}' -A 'ChatGPT-User' https://harun.dev/
```

`robots.txt` should Allow all user-agents, point at the sitemap and `/llms.txt`, and must not `Disallow` GPTBot / ClaudeBot / Google-Extended. Answer and training user-agents should get HTTP 200.

The Laravel `robots.txt` is the live file once managed robots.txt is off.

## Google Search Console (after deploy)

Property: `sc-domain:harun.dev`

1. Sitemaps → resubmit `https://harun.dev/sitemap.xml`.
2. URL Inspection → `https://harun.dev/services/devops` → confirm valid Organization + Service + FAQPage.
3. URL Inspection → one published blog post → confirm Article/meta and no `noindex`.
4. Coverage: the 16 `/services/*` URLs, `/bio`, `/hrr`, and `/products` should start appearing over the next crawl cycle.

`php artisan seo:ping-sitemap` prints the GSC and Bing Webmaster resubmit steps. Google and Bing both retired `/ping?sitemap=`.
