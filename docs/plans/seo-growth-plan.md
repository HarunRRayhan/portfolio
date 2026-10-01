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

### September 30: update the Laravel container comparison

- [x] Review the existing Laravel container article and save finalized Search Console baselines. August 31–September 27: six clicks, 212 impressions, 2.83% CTR and average position 8.78. August 3–30: six clicks, 301 impressions, 1.99% CTR and average position 16.01. The available comparison queries already reach this article; no new landing page is needed. Working evidence: ignored `reports/seo-laravel-baseline-2026-09-30.json`.
- [x] Check current AWS guidance. [App Runner is closed to new customers](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html); existing customers can continue to create resources, and AWS does not plan new features. AWS recommends exploring [ECS Express Mode](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html). AWS pages show differing cutoff dates, so the update states the current availability without asserting a cutoff date.
- [x] Add a short App Runner versus ECS Fargate decision section to the existing post, qualify the App Runner walkthrough and recommendations for existing customers, and replace its truncated description. Preserve the title, slug, original publication date, all code examples and all posts. Refresh the repository metadata cache. This is a factual content correction with a small search-intent improvement, not a claim of measured ranking recovery. PSEO remains deferred.
- [x] Verify the changed article. The full PHPUnit suite passed 379 tests / 2,350 assertions, with four notices and two skips; `npm run build` passed. A local browser using an isolated SQLite copy showed the new description, decision section and availability notice, the original title and all 13 code blocks. Read-only release review found no blocking issues. All 48 posts remain.
- [x] Release and verify Railway web/scheduler, the asset workflow, published metadata and the live decision section. Content release date: September 30, 2026 at 06:43:32 UTC, when [PR #236](https://github.com/HarunRRayhan/portfolio/pull/236) merged as `ab79c0bb2d803ac5713e90a485c253d88b0ec99a`. That is the publish time, kept separate from Google's next crawl. Railway created web deployment `557e06c9-4708-47cd-b623-05ffd6efe021` and scheduler deployment `545ea76a-0397-4413-95cc-b4314b840564` for that commit at 06:43:33 UTC; later releases replaced both. [Asset workflow](https://github.com/HarunRRayhan/portfolio/actions/runs/36679735165) completed successfully. On October 1, 2026, production commit `b5affa2ddbe87697aa9df2bfe969d286f274fa1b` still served the article: HTTP 200, the original title, the updated description and Open Graph description, canonical `https://harun.dev/blog/serverless-laravel-containers-with-ecs-fargate-app-runner-and-terraform`, and BlogPosting `datePublished` `2026-05-02T09:00:00+00:00`. A headless mobile browser showed the App Runner versus ECS Fargate section, the September 30 availability notice, the new-deployment and existing-customer guidance, the existing-customer App Runner heading, and 13 code blocks, with no page errors.
- [ ] After a confirmed post-release crawl, measure 28 full Pacific days against this page's baseline before expanding it further.

### September 30: one description improvement

All existing posts stay. Improve them where useful; do not delete posts or replace them with generated landing pages. PSEO remains deferred. If later evidence supports it, test one useful page before building a shared template or expanding the collection.

- [x] Review Search Console for August 31–September 27 against August 3–30. Site clicks fell from 81 to 64; impressions fell from about 6,790 to 5,910. The selected Claude Code/Terraform article fell from 36 to 14 clicks and 1,222 to 673 impressions. Its CTR changed from 2.9% to 2.1%, while average position improved from 8.0 to 6.8. These windows do not measure the September 28 service-page release.
- [x] Inspect the article's query, device and country breakdowns. All 22 available query rows showed zero clicks in both periods, despite nonzero page totals. The largest visible query, `coder terraform module claude code`, fell from 283 to 175 impressions. The device table showed 217 versus 383 desktop impressions, and the country table showed 204 versus 348 US impressions. These breakdowns do not reconcile with page totals, so they cannot establish which searches, countries or devices lost the 22 clicks. Do not infer a ranking collapse or rewrite the article to target the largest query.
- [x] Prepare a focused description update in the existing article's `brief` field. Replace the generic introduction excerpt with an accurate summary of the AWS/Terraform workflow. Preserve its title, slug, publication date and body. Version the repository metadata cache so a release reads the updated description. This is a clarity improvement, not a proven explanation for the CTR decline; Google may choose a different snippet.
- [x] Verify locally: `BlogSeoTest`, `SiteSeoTest` and the matching repository tests passed (24 tests, 265 assertions); `npm run build` passed. A browser using an isolated SQLite copy displayed the new summary, original title and article body. The first HTML response returned HTTP 200 with the new description and Open Graph description, and local build asset URLs. All 48 post files and the selected article's body were preserved. Initial checks failed because frontend dependencies and the build manifest were absent; installing the locked dependencies and building resolved those setup failures.
- [x] Complete release review and the full PHPUnit suite. Read-only code review found no blocking issues. After restoring missing locked PHP SDK packages in the local dependency copy, the full suite passed 379 tests / 2,350 assertions, with four notices and two skips. No dependency lockfiles changed.
- [x] Release the description update on September 30. [PR #235](https://github.com/HarunRRayhan/portfolio/pull/235) merged at 06:21:11 UTC as `3eeb547697cdf7941a01f50ed76c77326a7ce1f7`. Railway `web` deployment `f0ee3ed4-2118-43cd-be5b-dd6d2b5c008f` and `scheduler` deployment `699e8939-2a28-4516-bc8d-ccd1264a9c88` both reported SUCCESS for that commit. [Asset workflow](https://github.com/HarunRRayhan/portfolio/actions/runs/36677786947) completed successfully, including R2 upload and CDN purge. By 06:28:41 UTC, the public health endpoint returned HTTP 200 / `status: ok`; the live article displayed the new summary, description, Open Graph description and intended canonical. The published manifest's `app-o09ZToqp.js` and `Post-DNZaVNG9.js` matched the live page's asset URLs.
- [ ] Wait for a confirmed Google crawl after the description was verified live, then begin the first full Pacific day of a separate 28-day measurement window. The September 30 read-only API inspection reported the article as submitted and indexed, with successful fetch and matching canonicals, but its last crawl was September 29 at 05:23:48 UTC, before this release. The original September 28–October 25 window now contains the description release as well as the earlier CTA change; its result cannot be attributed solely to the CTA edit.
- [ ] Recheck `/services/infrastructure-as-code` after Google recrawls it. September 30 URL Inspection still showed the August 29 crawl, successful fetch, indexing allowed, the intended canonical, and “Crawled - currently not indexed.” No repeat indexing request was submitted.

The September 30 read-only API follow-up reproduced the page totals and incomplete query/device/country breakdowns above. A single finalized query/page check for `laravel|lightsail|fargate|app runner` found small comparison signals already reaching existing tutorials: `aws app runner vs fargate` had 11 impressions, no clicks and average position 8.36; `aws app runner vs ecs` had five impressions and no clicks. These are visible query rows, not full demand estimates. Keep PSEO deferred; review the existing Laravel container article's comparison section before creating any overlapping guide. All existing posts stay.

Other September 30 observations: the Page indexing report was dated September 21 and showed 70 indexed URLs and 85 excluded URLs, including 34 redirects, 20 not-found URLs, two historical server errors, one alternate canonical, 19 crawled but not indexed and nine discovered but not indexed. Both historical server-error examples (`blog.harun.dev/tag/lightsail` and `/tag/github-actions`) redirected to a not-found page on the current domain in the browser. Command-line requests returned 403 even for the service page and sitemap, so those requests are not evidence of Google's current fetch behavior. Do not change redirects based on the old error count alone. The sitemap report showed Success, last read September 26, and 80 discovered pages. Manual actions and Security issues both showed no issues detected.

Evidence: [article comparison](https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Aharun.dev&num_of_days=28&compare_date=PREV&page=%21https%3A%2F%2Fharun.dev%2Fblog%2Fclaude-code-for-aws-infrastructure-agentic-devops-workflow-with-terraform), [indexing report](https://search.google.com/search-console/index?resource_id=sc-domain%3Aharun.dev), and [sitemaps](https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Aharun.dev). These links open live reports; the dated figures above are the September 30 observations.

### September 28 follow-up task list

The aim of this round is to get one important consulting page into a better state, then measure leads and indexing before changing another page. Search Console URL Inspection on September 28 found 4 of 16 service pages indexed, 8 crawled but not indexed, 3 discovered but not indexed, and 1 unknown to Google. These are URL Inspection states, not a sitewide Page indexing report count.

- [x] Recheck the selected article and sitemap in Search Console. Google recrawled the article on September 27 at 03:43:18 UTC; it remains indexed with the intended canonical. Google last downloaded the sitemap on September 25 at 23:33:12 UTC with zero errors and warnings.
- [x] Inspect all 16 service URLs. The Infrastructure as Code page is crawled but not indexed; its crawl on August 29 fetched successfully, allows indexing, and has the intended canonical.
- [x] Inspect Google's rendered view of `/services/infrastructure-as-code` in the Search Console UI. The September 28 live test showed the mobile hero and first service section, HTTP 200, all page resources loaded, and no JavaScript console messages. The old indexed-state report still says crawled but not indexed; a live test does not change that state.
- [x] Revise only the Infrastructure as Code page with concrete, supportable scope and a link to the existing AWS/Terraform workflow article. The page no longer lists unrelated tooling or claims unverified client results.
- [x] Run relevant PHPUnit tests and `npm run build`, then inspect the changed page in a real local browser. On September 28, `SiteSeoTest` passed 13 tests/136 assertions, the full PHPUnit run passed 364 tests/2,229 assertions with four notices and two skips using a 512 MB CLI limit, the production build passed, and the page and article link rendered locally against a temporary SQLite database. This is local verification, not a production release.
- [x] Release the revised service page and verify the deployed HTML, mobile rendering, internal links, and production status. PR #212 merged September 28; Railway production reported success and the R2 build/sync and CDN purge completed successfully. The live page has the updated description, canonical, FAQ markup, Terraform copy, and article/contact links. It renders at 390px with no horizontal overflow.
- [ ] Recheck the service URL in Search Console after Google crawls the revision. On September 28, URL Inspection still showed the August 29 crawl and “Crawled - currently not indexed.” A request to index the updated URL was accepted into Google's priority crawl queue; this is not yet a crawl or indexing result.
- [x] Mark `generate_lead` as a key event in the `harun.dev` GA4 property on September 28. The Key events table shows it checked, with no stream data detected.
- [ ] Confirm GA4 receives a real successful `generate_lead` event. On September 28, the Lead acquisition report showed 0 new leads for August 31–September 27. Do not submit a production contact or booking form just to create an analytics event.
- [ ] After 28 full Pacific days from the September 27 crawl (September 28–October 25), compare finalized article clicks, impressions, CTR, position, and leads with the pre-change baseline. Recheck the service page's indexing state after Google crawls the revision. Do not call a local build or a submitted sitemap an indexing result.

The August 28–September 24 finalized Search Console site total was 66 clicks from 5,967 impressions. Service pages received 11 impressions and no clicks in that period. This baseline predates the article's September 27 recrawl. Service URL states on September 28: indexed (`devops`, `security-consulting`, `database-migration`, `vibe-scaling`); crawled but not indexed (`infrastructure-as-code`, `serverless-infrastructure`, `performance-optimization`, `infrastructure-migration`, `mlops`, `monitoring-observability`, `aws-cloud`, `multi-cloud-architecture`); discovered but not indexed (`automated-deployment`, `database-optimization`, `vibe-code-migration`); unknown to Google (`cloud-architecture`).

### Task 1 — Get a small Search Console baseline

- [x] Set the primary outcome: consulting leads.
- [x] Use the API identity the owner confirmed as `siteOwner`; API requests use only the `https://www.googleapis.com/auth/webmasters.readonly` OAuth scope.
- [x] Request the prior 16 months. The September 23, 2026 pull returned daily data only from May 25 through September 20, 2026; keep that shorter range explicit in any comparison.
- [x] Separate branded and non-branded query rows, compare queries with landing pages, and spot-check the relevant live results.
- [x] Add a PII-free GA4 `generate_lead` event after successful contact and consultation booking submissions.
- [x] Mark `generate_lead` as a key event in the `harun.dev` GA4 property. It uses the event already emitted by site code, with no default monetary value.
- [ ] Confirm GA4 receives a real successful `generate_lead` event. The Lead acquisition report showed 0 new leads for August 31–September 27; configuration alone is not receipt.
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

- [x] Inspect the selected article in Search Console and save its indexing status on September 23, 2026.
- [x] Save a recent 28-day page baseline and the preceding 28 days using finalized Search Console data.
- [x] Confirm Google recrawled the page after the September 23 change. URL Inspection reports September 27 at 03:43:18 UTC.
- [ ] Compare its query impressions, clicks, CTR, position, and leads with the baseline after 28 complete Pacific days of finalized data.
- [ ] Keep the change if it helps users and results. Choose the next single page only after reviewing the data.

### Measurement checkpoint: September 23, 2026

[PR #185](https://github.com/HarunRRayhan/portfolio/pull/185) merged at 09:08:07 UTC. The asset workflow finished at 09:12:06 UTC, and the changed sitemap and lead-event helper were verified live afterward.

At this checkpoint, Search Console URL Inspection reported the selected article as **Submitted and indexed**. Fetching succeeded, crawling and indexing were allowed, and Google's canonical matched the article URL. Its last crawl was September 23 at **06:03:02 UTC**, before the merge. The September 28 follow-up above records the subsequent crawl.

Search Console reports **0 errors and 0 warnings** for the sitemap. Its last download was September 21 at 10:09:54 UTC, so that status describes the earlier sitemap. The sitemap API's `indexed` count isn't a page-indexing check; use URL Inspection for this article.

The most recent finalized pre-change data ends on September 20. Search Console date ranges use Pacific time (`America/Los_Angeles`):

- **August 24–September 20:** 1,005 impressions, 14 clicks, 1.39% CTR, average position 7.49.
- **July 27–August 23:** 1,025 impressions, 42 clicks, 4.10% CTR, average position 7.90.

Clicks fell before this change while impressions were nearly flat and average position improved slightly. This is the starting trend, not a result of the new contact links. The CTA change is intended to help readers reach consulting services; search clicks alone won't establish whether it works.

The working evidence is in Git-ignored files:

- `reports/seo-article-inspection-2026-09-23.json`
- `reports/seo-article-measurement-baseline-2026-09-23.json`
- `reports/seo-sitemap-status-2026-09-23.json`

The baseline includes daily rows, available query rows, and page-level totals. Query rows exclude anonymized searches and may not add up to the page totals. Earlier lead counts are unavailable, not zero.

Next review steps:

1. Completed September 28: rechecked the article's `lastCrawlTime` and the sitemap's `lastDownloaded`. The article crawl followed the live-change verification.
2. Start the post-change window on the first full Pacific day after the confirmed recrawl. Collect **28 complete days** with `type=web`, `dataState=final`, and an exact page filter for the selected article. Use ungrouped page totals for clicks, impressions, CTR, and position; query rows explain the mix of searches.
3. Compare those results with August 24–September 20. Record leads separately once GA4 is available. Treat low counts and shifts in query mix cautiously, then decide whether another page needs work.

### Contact-form follow-up: September 23, 2026

- [x] Fix the contact form's success handling. A mail failure returns an error flash through a normal redirect, so Inertia's `onSuccess` callback alone doesn't confirm delivery. Require `flash.type = success` before showing the envelope or success toast.
- [x] Keep entered fields and selected services visible on failure. Show a persistent error and restore the submit button when the request finishes.
- [x] Verify a real mail failure, server validation error, and successful retry in the local browser. Failures emit no lead event; the successful retry emits one. All 31 contact-related PHPUnit tests and `npm run build` pass.

Local verification completed on September 23, 2026. Deployment evidence belongs on the release PR.

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
