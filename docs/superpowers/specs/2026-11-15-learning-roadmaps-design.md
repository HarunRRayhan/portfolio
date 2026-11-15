# Learning Roadmaps — design

Date: 2026-11-15 · Status: draft for approval

## Intent

Harun's posts come out in random order, so a reader can't tell where to start or what
comes next. Roadmaps give each big subject (Internet & Networking, DevOps, MLOps,
DevSecOps, SRE, Solution Architect) a step-by-step path from beginner to advanced.
A signed-in reader starts a roadmap, works through it step by step, and tracks progress.
They can love-react a roadmap and save it to a wishlist.

## Goals

- `/roadmaps` index and `/roadmaps/{slug}` page showing stages
  (Beginner → Intermediate → Advanced), each with ordered steps.
- Each step is a **topic**, not a lesson (e.g. "The 7 OSI layers", "BGP"): title, short
  summary, "what to learn" bullets. Topic first, resources second.
- Under each topic, a **Resources** block: Harun's own posts and third-party links
  (articles, docs, videos), a **Search the web** link for the topic, and an **Ask your AI**
  block: a ready prompt with Copy, Open in Claude, Open in ChatGPT.
- Signed-in users: **Start** a roadmap, tick topics done, see a progress bar; a "Your
  roadmaps" section at the top of `/roadmaps` (started + saved, % done, "continue" to the
  first unticked topic). The admin dashboard is admin-only, so it is not used.
- **Love** (public count, toggle) and **Save for later** (private wishlist, toggle) on
  each roadmap.
- Guests can read everything; Start/Love/Save/ticks send them to sign-in, then back.
- First release ships four roadmaps: **Internet & Networking**, **DevOps**, and **MLOps** and
  **DevSecOps**, which declare `builds_on: devops` (shown as "Builds on DevOps", not enforced).
- Main menu: Home, Roadmaps, Blog, More. About and Products move into More.
- **Access:** Beginner is free for everyone. Intermediate and Advanced need a GitHub
  sponsorship of **any amount of $5 or more** (custom amounts
  count; GitHub sends them as `monthly_price_in_cents`): monthly unlocks while active; one-time unlocks for
  **30 days** from its start. Any consultation-tier sponsorship also qualifies.
- **Manual access:** Harun grants access to a person by email for a set time (expiry
  date, optional note) and can revoke it, from `/admin/roadmap-access`. Works before the
  person has an account (matched on email at sign-in).
- **Locked view:** without access, Intermediate/Advanced topics show title + summary only;
  learn bullets, resources, search, AI prompt and ticking are replaced by a
  one unlock card under the first locked stage: a **Sponsor on GitHub** button (GitHub icon) to
  `/sponsor-me`, and small text: "Any amount of $5 or more gets you access to every
  roadmap's Intermediate and Advanced topics." Locked fields are stripped
  server-side, never just hidden in the browser.

## Non-goals

- No admin editor for roadmaps (content is files in the repo).
- No written lessons or per-topic pages; topics expand inline on the roadmap page.
- No quizzes, certificates, comments, or per-step notes.
- No AI calls from the server; prompts are text handed to the reader's own AI.
- No love/wishlist on individual steps.
- Other five roadmaps come later, one PR each.

## Anti-goals

- Must not slow `/blog` or the homepage (no new queries there).
- Guests must not be blocked from reading; SEO pages stay crawlable.
- Progress must not be lost when a roadmap file changes (steps keyed by stable ids).

## Constraints

- Laravel + Inertia/React + Tailwind; reuse existing auth (Google/GitHub/magic link),
  `auth` + `EnsureTermsAccepted` middleware, Blade SEO meta (`SeoMeta`/`SeoCatalog`),
  sitemap (`PublicSitemap`), Menubar/Footer links.
- Content parsing follows `CaseStudyRepository`/`BlogRepository` (symfony/yaml).

## Approaches

1. **Files in repo (picked).** `resources/roadmaps/{slug}.yml` (meta, stages, steps) and
   no lesson files. Edit → PR → deploy, like posts.
   No admin UI.
2. Database + admin CRUD editor. Edit without deploys, but a full editor to build and keep.
3. Files now, admin later. Same as 1 with an explicit upgrade path; folded into 1.

Picked 1 by Harun: matches the blog workflow, versioned, least to build.

## Design

**Content** — `RoadmapRepository` (app/Support) reads the YAML:

```yaml
slug: internet-networking
title: How the Internet Works
summary: ...
stages:
  - level: beginner
    steps:
      - id: what-is-a-network      # stable; progress keys on it
        title: What is a network
        summary: ...
        learn: [..., ...]
        resources:
          - post: some-blog-slug    # Harun's post; title/url filled from BlogRepository
          - {label: RFC 1122, url: https://..., kind: docs}   # kind: article|docs|video|course
        prompt: ...                 # optional; default is generated from roadmap+level+topic
```

Default prompt: "I'm learning {roadmap title}, at the {level} stage. Teach me
"{topic}": {summary} Cover: {learn bullets}. Explain it simply with a real-world
example, then give me 3 questions to check I understood." Search link:
`https://www.google.com/search?q={topic} {roadmap title}`. Open in Claude:
`https://claude.ai/new?q={prompt}`; ChatGPT: `https://chatgpt.com/?q={prompt}`.

```yaml
```

Unknown post slugs fail a test, so broken links never ship.

**Data** (one migration):
- `roadmap_progress` (user_id, roadmap_slug, step_id, completed_at) unique on all three key
  columns. A started roadmap = row in `roadmap_starts` (user_id, roadmap_slug, started_at).
- `roadmap_reactions` (user_id, roadmap_slug, type `love|wishlist`) unique triple.
- Step ids not in the current file are ignored when computing %.

**Access** — `RoadmapAccess::canAccessPaid(?User): bool` (app/Support). True when the user
has an unexpired, unrevoked `roadmap_access_grants` row for their email, or a
`github_sponsorships` row linked to them (same linking as consultation credits:
`user_id`, GitHub `provider_id`, or `grant_email`) that is `active` and either has
`tier_slug` set, or `monthly_price_cents >= 500` and is monthly, or is one-time with
`started_at` within 30 days. The webhook stores `sponsorship.tier.monthly_price_in_cents`
in a new nullable `github_sponsorships.monthly_price_cents` column.

`roadmap_access_grants` (email, user_id nullable, expires_at, note, granted_by,
revoked_at). Admin page lists grants (active/expired), add form (email, expiry date,
note), revoke button; `auth`+`verified`+`role:admin` like other admin pages.

**Routes**
- `GET /roadmaps`, `GET /roadmaps/{slug}` — public.
- `POST /roadmaps/{slug}/start`, `POST|DELETE /roadmaps/{slug}/steps/{step}`,
  `POST /roadmaps/{slug}/love`, `POST /roadmaps/{slug}/wishlist` (toggles) — `auth`,
  rate-limited; slug/step validated against the repository.

**Pages** — `Pages/Roadmaps/Index.tsx` ("Your roadmaps" for signed-in users, then cards:
title, level span, topic count, love count), `Show.tsx` (vertical path, stage headers,
topic nodes with tick boxes that expand to summary, learn bullets, Resources, Search,
Ask your AI; progress bar; Start/Love/Save buttons). Menubar/Footer get
"Roadmaps". Pages added to sitemap and SEO catalog.

**Tests** — feature tests: guest read, auth gate on actions, start/tick/untick,
love/wishlist toggle + counts, unknown slug/step 404, locked fields absent from props without access, ticking a paid
topic without access is 403, sponsor $5 monthly / one-time day 29 vs day 31 / $4 /
manual grant expired vs active / revoked, admin-only grant routes, every `post:` slug exists, every
URL is https, step ids unique, every topic has at least one resource.

## Left to the builder

Visual design of the path (use ui-designer guidance, site's existing style), exact rate
limit values, and the Internet & Networking step outline (drafted by Claude, reviewed by
Harun in the PR).
