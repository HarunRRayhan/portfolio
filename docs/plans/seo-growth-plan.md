# SEO growth plan

**Goal:** Grow qualified organic visits to Harun's consulting pages and technical writing. Track inquiries and bookings alongside clicks.

We'll work one task at a time. Each round will change one page or one small technical issue, then we'll review the data before adding more work.

## Current state

- The site already sends titles, descriptions, canonicals, Open Graph tags, and JSON-LD in its first HTML response.
- `robots.txt`, the sitemap, RSS feeds, and `llms.txt` are in place.
- The site has 16 service pages, dozens of technical posts, and one published case study.
- Static sitemap URLs now omit `lastmod` when no reliable significant-change date exists. Dynamic content keeps its existing stored dates. This is a correctness fix, not a promised ranking gain.
- The supplied X export has 3,406 posts but no engagement or search-performance data. Its useful ideas are to prioritize intent, improve existing pages, add relevant internal links, and share original work. It can't tell us which topics Harun's audience searches for.

## Work list

### Task 1 — Get a small Search Console baseline

- [x] Set the primary outcome: consulting leads.
- [x] Use the API identity the owner confirmed as `siteOwner`; API requests use only the `https://www.googleapis.com/auth/webmasters.readonly` OAuth scope.
- [x] Request the prior 16 months. The September 23, 2026 pull returned daily data only from May 25 through September 20, 2026; keep that shorter range explicit in any comparison.
- [x] Separate branded and non-branded query rows, compare queries with landing pages, and spot-check the relevant live results.
- [x] Add a PII-free GA4 `generate_lead` event after successful contact and consultation booking submissions.
- [ ] Confirm GA4 receives the events and mark `generate_lead` as a key event in the property.
- [x] Keep the working summary in the ignored `reports/search-console-baseline.json` file.

**Preliminary page choice:** The AWS/Terraform/Claude Code workflow post had the strongest relevant organic reach and a close fit with the consulting services. It ended with a social link, so Task 2 added an Infrastructure as Code link and a contact step. Revisit the choice if the longer Search Console history becomes available.

### Task 2 — Improve one page from the baseline

- [x] Selected `resources/blog/posts/claude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform.md` based on its search reach and fit with consulting services.
- [x] Added a contextual Infrastructure as Code service link and a direct contact step.
- [x] Kept the existing title and tutorial. The article already answers the informational query; no new page is needed.
- [x] Improved the existing page rather than creating a near-duplicate.

### Task 3 — Fix sitemap dates

- [x] In `routes/web.php`, omit `lastmod` for static URLs with no reliable update date.
- [x] Parse `/sitemap.xml` in a feature test and confirm expected canonical URLs remain present.

### Task 4 — Review before expanding

- [ ] Confirm Google has recrawled the page, then compare its query impressions, clicks, CTR, position, and leads with the baseline after several weeks.
- [ ] Keep the change if it helps users and results. Choose the next single page only after reviewing the data.

## Later, only if the data supports it

- Refresh one older post if Search Console shows a meaningful decline or outdated information.
- Add a case study when there is client-approved, verifiable project evidence.
- Test one translated service page only if country, query, or lead data shows demand. If we do, translate the page fully and connect equivalent language versions with reciprocal `hreflang` tags.
- Share a strong article through one relevant channel, such as LinkedIn, X, or the newsletter. Keep `harun.dev` as the original source.

## Keep out of the first round

- Rewriting every service page or publishing on a quota.
- Programmatic landing pages, bulk translation, or backlink campaigns.
- More schema, AI-specific markup, or AI text files. Google says its AI search features have no extra technical requirements or special schema; the existing SEO basics still apply.
- A broad site audit unless Search Console or a crawl error points to a real issue.

## Research references

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): helpful content, clear titles, links, and Search Console; no guaranteed ranking tricks.
- [Get started with Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start): use the performance and indexing reports to guide changes.
- [Search Console API authorization](https://developers.google.com/webmaster-tools/v1/how-tos/authorizing) and [Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query): read-only OAuth scope and available query, page, and country dimensions.
- [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): favor original experience and don't publish just to fill a keyword list.
- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features): no extra requirements or special markup for AI Overviews or AI Mode.
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): `lastmod` should represent a significant update and be consistently accurate.
- [Localized versions of your pages](https://developers.google.com/search/docs/specialty/international/localized-versions): use reciprocal annotations for real language or regional equivalents.
