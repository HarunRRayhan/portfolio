# Learning Roadmaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/roadmaps` — step-by-step topic paths (Beginner free; Intermediate/Advanced for $5+ GitHub sponsors or manual grants) with resources, web search, AI prompts, progress ticks, love and wishlist.

**Architecture:** Roadmap content is YAML in `resources/roadmaps/`, read by `App\Support\RoadmapRepository` (pattern of `CaseStudyRepository`). Per-user state lives in four small tables. `App\Support\RoadmapAccess` decides paid access; the route strips locked fields before Inertia renders.

**Tech Stack:** Laravel 12, Inertia + React/TSX, Tailwind, symfony/yaml, PHPUnit feature tests (`RefreshDatabase`).

**Spec:** `docs/superpowers/specs/2026-11-15-learning-roadmaps-design.md`

## Global Constraints

- Levels exactly `beginner`, `intermediate`, `advanced`; only `beginner` is free.
- Paid access: `tier_slug` set, OR monthly with `monthly_price_cents >= 500`, OR one-time with `monthly_price_cents >= 500` and `started_at >= now()->subDays(30)`; status `active`. Or an active manual grant.
- Unlock card copy: heading "Sponsor me", subtitle "Any amount of $5 or more unlocks Intermediate and Advanced.", button → `/sponsor-me`.
- Default prompt template (exact): `I'm learning {roadmap}, at the {level} stage. Teach me "{topic}": {summary} Cover: {learn joined by "; "}. Explain it simply with a real-world example, then give me 3 questions to check I understood.`
- Links: search `https://www.google.com/search?q=` + urlencode("{topic} {roadmap}"); `https://claude.ai/new?q=` + urlencode(prompt); `https://chatgpt.com/?q=` + urlencode(prompt).
- No new queries on `/blog` or `/`. Guests can read all public fields.
- Run tests with `php artisan test --filter=<Name>`; full suite + `npm run build` before PR.

## Review Focus

1. Locked topic fields leaking in Inertia props (view-source/JSON) — must be absent, not hidden. Test in Task 3.
2. Step ids renamed/removed in YAML → old progress rows must not break % or 500. Test in Task 3 (`test_unknown_progress_rows_are_ignored`).
3. A sponsor who signs in with Google (not GitHub) but sponsored with matching `grant_email` (manual) — must get access via `claimFor`-style linking. Test in Task 2.
4. Manual grant for email in different case (`Foo@X.com` vs `foo@x.com`) → still matches. Test in Task 2.
5. Double-click on love/wishlist/tick → no duplicate rows / 500 (unique index + firstOrCreate). Test in Task 4.

---

### Task 1: Roadmap content + repository

**Files:**
- Create: `app/Support/RoadmapRepository.php`, `resources/roadmaps/internet-networking.yml`
- Test: `tests/Feature/RoadmapContentTest.php`

**Interfaces:**
- Produces: `RoadmapRepository::all(): array` (list of roadmaps, sorted by `order`), `find(string $slug): ?array`, `stepIds(array $roadmap): array<string,string>` (step id → level), `prompt(array $roadmap, string $level, array $step): string`, `searchUrl(array $roadmap, array $step): string`. Resource entries normalised to `{label, url, kind, own: bool}`; `post:` entries resolved via `BlogRepository::find()` + `absoluteUrl()` with `own: true`.
- YAML shape: `slug, title, summary, order, stages[{level, title, steps[{id, title, summary, learn[], resources[], prompt?}]}]`.

- [ ] **Step 1: Write tests** — `test_every_roadmap_is_valid`: for each roadmap, levels ⊆ the three; step ids unique within roadmap and match `/^[a-z0-9-]{1,64}$/`; every step has ≥1 resource; every `url` starts `https://`; every `post:` slug exists in `BlogRepository`. `test_internet_roadmap_has_all_three_stages`. `test_default_prompt_matches_template` (exact string for a fixture step). `test_unknown_slug_returns_null`.
- [ ] **Step 2: Run, expect FAIL** (class missing).
- [ ] **Step 3: Implement repository** — parse with `Yaml::parseFile`, cache per request in a static array (no Cache store; files are tiny).
- [ ] **Step 4: Write `internet-networking.yml`** — ~8 beginner (what is a network, IP addresses, DNS, HTTP basics, client/server, ports, packets, how a page loads), ~8 intermediate (OSI 7 layers, TCP vs UDP, TLS/HTTPS, subnets/CIDR, NAT, routing, CDNs, load balancers), ~6 advanced (BGP, anycast, IPv6, QUIC/HTTP3, DDoS & mitigation, internet exchange points). 2–4 resources each (MDN, Cloudflare Learning, RFCs, Harun posts that fit — grep `resources/blog/posts` for dns/cdn/cloudfront/load balancer).
- [ ] **Step 5: Run, expect PASS.** Commit `feat: roadmap content repository and Internet & Networking roadmap`.

### Task 2: Access model, tables, webhook amount

**Files:**
- Create: migration `database/migrations/2026_11_15_100000_create_roadmap_tables.php`; models `app/Models/RoadmapStart.php`, `RoadmapProgress.php`, `RoadmapReaction.php`, `RoadmapAccessGrant.php`; `app/Support/RoadmapAccess.php`
- Modify: `app/Http/Controllers/Sponsorship/GithubSponsorsWebhookController.php` (pass `monthly_price_cents => $tier['monthly_price_in_cents'] ?? null` into `recordSponsorship`); `app/Models/GithubSponsorship.php` (`$fillable` + int cast); `app/Services/Sponsorship/SponsorCreditService.php` only if `recordSponsorship` filters attrs.
- Test: `tests/Feature/RoadmapAccessTest.php`, extend `tests/Feature/GithubSponsorsWebhookTest.php`

**Interfaces:**
- Tables: `roadmap_starts(id, user_id fk cascade, roadmap_slug str64, timestamps, unique[user_id,roadmap_slug])`; `roadmap_progress(id, user_id, roadmap_slug, step_id str64, completed_at, unique[user_id,roadmap_slug,step_id])`; `roadmap_reactions(id, user_id, roadmap_slug, type str16 love|wishlist, timestamps, unique[user_id,roadmap_slug,type], index[roadmap_slug,type])`; `roadmap_access_grants(id, email, user_id nullable fk nullOnDelete, expires_at, note nullable, granted_by fk users nullable, revoked_at nullable, timestamps, index email)`; `github_sponsorships.monthly_price_cents` unsignedInteger nullable.
- Produces: `RoadmapAccess::canAccessPaid(?User $user): bool`. Calls `SponsorCreditService::claimFor($user)` first? **No** — reuse its id lookup logic read-only: sponsorships where `user_id = $user->id` OR `github_sponsor_id` in user's GitHub ids OR (`source = manual` AND lower(`grant_email`) = lower(email) AND email verified). Grants: lower(`email`) = lower(user email), `revoked_at` null, `expires_at > now()`.

- [ ] **Step 1: Write tests** — null user → false; monthly $5 (500) active → true; monthly $4 (400) → false; one-time 500 started 29 days ago → true, 31 days → false; cancelled monthly 500 → false; `tier_slug='pro'` with null price → true; manual grant active → true, expired → false, revoked → false; grant email `Foo@X.com` vs user `foo@x.com` → true; GitHub-linked sponsorship via `provider_id` with `user_id` null → true. Webhook test: `created` payload with `tier.monthly_price_in_cents: 700` stores 700.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement migration, models, `RoadmapAccess`, webhook line.**
- [ ] **Step 4: Run both test files + `--filter=GithubSponsors` and `--filter=Sponsor`, expect PASS.** Commit `feat: roadmap tables and sponsor-based access`.

### Task 3: Public roadmap pages (server side)

**Files:**
- Create: `app/Http/Controllers/RoadmapController.php`
- Modify: `routes/web.php` (near case-studies), `app/Support/SeoCatalog.php` (`/roadmaps` page entry; `forRoadmap(title, summary, url)` reusing `forMedia`), `app/Support/SiteCatalog.php` (`/roadmaps` in `sitemapStaticPaths`), `app/Support/PublicSitemap.php` (one entry per roadmap)
- Test: `tests/Feature/RoadmapPagesTest.php`

**Interfaces:**
- Consumes: Task 1 repository, Task 2 `RoadmapAccess`, models.
- `GET /roadmaps` → `Roadmaps/Index` props: `roadmaps[{slug,title,summary,stepCount,levels[],loveCount}]`, `mine[{slug,title,percent,saved:bool,started:bool,continueStepId:?string}]` (empty for guests), `seo`, `canonicalUrl`.
- `GET /roadmaps/{slug}` → `Roadmaps/Show` props: `roadmap{slug,title,summary}`, `stages[{level,title,locked:bool,steps[{id,title,summary, learn?, resources?, searchUrl?, prompt?, claudeUrl?, chatgptUrl?, done:bool}]}]`, `hasPaidAccess`, `started`, `loved`, `saved`, `loveCount`, `percent`, `seo`, `canonicalUrl`. For locked stages, step objects contain **only** `id,title,summary,done`.
- `percent` = done ids ∩ accessible step ids / accessible step count (guest: 0). Progress rows whose `step_id` is not in the file are ignored.

- [ ] **Step 1: Write tests** — guest index 200 with roadmap card; guest show: beginner step has `resources`, `prompt`, `claudeUrl`; intermediate step lacks `resources`/`prompt`/`learn` (`->missing(...)`) and `stages.1.locked` true; sponsor user ($5 monthly) sees intermediate `resources`; unknown slug 404; `test_unknown_progress_rows_are_ignored` (row with `step_id='gone'` → percent unaffected, 200); `seo.title` present; sitemap contains `/roadmaps/internet-networking`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement controller (`index`, `show`), routes, SEO, sitemap.**
- [ ] **Step 4: Run `--filter=Roadmap` and `--filter=Sitemap|Seo`, expect PASS.** Commit `feat: public roadmap pages with server-side lock`.

### Task 4: Signed-in actions

**Files:**
- Modify: `app/Http/Controllers/RoadmapController.php`, `routes/web.php`, `app/Providers/AppServiceProvider.php` (`RateLimiter::for('roadmap-actions', 60/min per user id)`)
- Test: `tests/Feature/RoadmapActionsTest.php`

**Interfaces:**
- Routes (`auth`, `throttle:roadmap-actions`), all redirect back (Inertia):
  `POST /roadmaps/{slug}/start` (`roadmaps.start`), `POST /roadmaps/{slug}/steps/{step}` (`roadmaps.steps.complete`), `DELETE /roadmaps/{slug}/steps/{step}` (`roadmaps.steps.uncomplete`), `POST /roadmaps/{slug}/love` (`roadmaps.love`, toggle), `POST /roadmaps/{slug}/wishlist` (`roadmaps.wishlist`, toggle).
- Ticking a step also creates the `roadmap_starts` row. Unknown slug/step → 404. Paid-level step without access → 403.

- [ ] **Step 1: Write tests** — guest POST start → redirect to login; start creates row, twice → still 1 row; complete beginner step → row, uncomplete → gone; complete intermediate without access → 403, with grant → 200/302 + row; love toggles on/off and `loveCount` on show updates; wishlist toggles and appears in index `mine` with `saved: true`; unknown step 404.
- [ ] **Step 2: Run, expect FAIL.** **Step 3: Implement** (`firstOrCreate` / delete). **Step 4: PASS.** Commit `feat: roadmap start, progress, love and wishlist`.

### Task 5: Frontend pages + nav

**Files:**
- Create: `resources/js/Pages/Roadmaps/Index.tsx`, `resources/js/Pages/Roadmaps/Show.tsx`
- Modify: `resources/js/Components/Menubar.tsx`, `resources/js/Components/Footer.tsx` (add "Roadmaps" → `/roadmaps`)

**Interfaces:** Consumes Task 3 props and Task 4 routes (use `router.post/delete` with `preserveScroll`).

- [ ] **Step 1:** Use `PublicLayout`, match `CaseStudies/Index.tsx` styling. Index: "Your roadmaps" (progress bars, Continue → `/roadmaps/{slug}#{continueStepId}`), then cards.
- [ ] **Step 2:** Show: header (title, summary, progress bar, Start / Love ♥ count / Save buttons; guests' clicks go to `/login`). Vertical path per stage with stage badge; each topic a node (checkbox + title + summary) that expands: learn bullets, Resources list (own posts badged "Harun's post", kind label), "Search the web" link, "Ask your AI" box showing prompt with Copy (navigator.clipboard, "Copied" state), Open in Claude, Open in ChatGPT (all external links `target="_blank" rel="noopener noreferrer"`). Locked stage: topics show title + summary with lock icon, one unlock card per stage with the exact Global Constraints copy.
- [ ] **Step 3:** `npm run build` and `npx tsc --noEmit` (if configured) pass; check `/roadmaps/internet-networking` in the browser as guest and as sponsor (local-verify skill). Commit `feat: roadmap index and path UI`.

### Task 6: Admin manual access

**Files:**
- Create: `app/Http/Controllers/Admin/RoadmapAccessController.php`, `resources/js/Pages/Admin/RoadmapAccess/Index.tsx`
- Modify: `routes/web.php` (group like `admin.sponsorships.`: `['auth','verified','role:admin']`, prefix `admin/roadmap-access`, names `admin.roadmap-access.index|store|revoke`)
- Test: `tests/Feature/Admin/RoadmapAccessAdminTest.php`

**Interfaces:**
- `store` validates `email` (required, email, max 255), `expires_at` (required, date, after today), `note` (nullable, max 500); stores lowercased email, `user_id` of matching user if any, `granted_by` = admin.
- `revoke` sets `revoked_at = now()`.
- Index props: `grants[{id,email,note,expires_at,revoked_at,status:'active'|'expired'|'revoked'}]` newest first.

- [ ] **Step 1: Tests** — non-admin 403 on all three; admin creates grant → `RoadmapAccess::canAccessPaid` true for that email's user; past `expires_at` → validation error; revoke → false.
- [ ] **Step 2: FAIL. Step 3: Implement (copy layout of `Admin/Sponsorships`). Step 4: PASS.** Add link in admin nav next to Sponsorships. Commit `feat: admin manual roadmap access grants`.

### Task 7: Ship

- [ ] Full `php artisan test` and `npm run build` green.
- [ ] Open PR from `feat/learning-roadmap-syllabus`, self-review diff, CI green, merge, wait for "Build and Sync Assets to R2" and confirm `/roadmaps` live (CLAUDE.md Shipping).
