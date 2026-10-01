# AI readiness

Get harun.dev cited by ChatGPT, Claude, Copilot, Perplexity, and other answer engines, get the public pages into Bing, and let those crawlers learn from the site without letting any one client scrape it flat.

## What “ready” means

1. An answer engine can tell, from the first response, that search, live answers, and training are allowed, and that the way to hire is `/consultation`.
2. Bing can discover the sitemap and receive URL updates through IndexNow.
3. A client that ignores politeness still hits a per-IP cap at the origin. Named AI and search crawlers get a higher cap than unknown scripts and SEO scrapers.

## Already in place

- `robots.txt`, `sitemap.xml`, `/llms.txt`, and `/llms-full.txt`
- Organization, FAQ, Person, and BlogPosting JSON-LD in the first HTML response
- Operator notes in `docs/checklists/search-console-ai-seo.md` for Cloudflare AI bot policies

## Code

| Piece | Role |
| --- | --- |
| `App\Support\AiCrawlerPolicy` | Content Signals (`search=yes, ai-input=yes, ai-train=yes`), private-path Disallow, SEO-scraper Disallow, user-agent classes |
| `App\Support\LlmSiteIndex` | llmstxt indexes, with a Hire section that points at `/consultation`. Full text is cached on the file store when the default cache is the database |
| `App\Http\Middleware\LimitContentCrawls` | Per-IP origin cap. Search/AI 300/min, browsers 120/min, scripts and SEO scrapers 20/min. Counters stay off the database cache |
| `php artisan seo:indexnow` | POST sitemap URLs to `https://api.indexnow.org/indexnow` (Bing and the other IndexNow engines). `blog:publish-scheduled` sends the new post URL the same way and clears the LLM index cache |
| `php artisan seo:ai-readiness` | Local policy check. `--live` also fetches `https://harun.dev/robots.txt` and `/llms.txt` |
| HTML `<link rel="alternate" type="text/markdown">` | Points every page at `/llms.txt` |
| `BING_SITE_VERIFICATION` | Emits `msvalidate.01` when set |

The wildcard robots group is the only group that allows crawling. A separate `Allow: /` group for GPTBot or ClaudeBot would replace the wildcard group and drop the private-path Disallows. Those agents are still allowed, because they fall through to `User-agent: *`.

Spoofing `GPTBot` raises the cap to the search/AI tier. It does not remove the cap. Cryptographic bot verification stays at Cloudflare.

## Operator steps after deploy

1. Keep Cloudflare managed `robots.txt` off, and keep AI bot policies at allow for search, agents, and training. Confirm with `php artisan seo:ai-readiness --live`.
2. Generate `INDEXNOW_KEY` (`php -r "echo bin2hex(random_bytes(16)), PHP_EOL;"`), set it on Railway `web` and `scheduler`, deploy, confirm `https://harun.dev/{key}.txt` returns the key, then run `php artisan seo:indexnow --site=https://harun.dev`.
3. In Bing Webmaster Tools, add `https://harun.dev`, copy the `msvalidate.01` value into `BING_SITE_VERIFICATION`, redeploy, and submit `https://harun.dev/sitemap.xml`.
4. Optional Cloudflare rate-limit rule for unverified bots, as a second cap in front of the origin. Do not challenge Googlebot or turn on Bot Fight Mode.

## Out of scope

- Paying for inclusion in a model, or blocking training. Training stays allowed on purpose.
- Account-only Bing or Cloudflare dashboard clicks. The commands print the exact follow-up; they cannot log into those accounts.
