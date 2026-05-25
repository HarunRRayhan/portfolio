# harun.dev Blog Migration Plan

> **For Hermes:** Execute this plan task-by-task and keep the todo list updated as each step lands.

**Goal:** Move the blog from `blog.harun.dev` to `harun.dev/blog` with minimal SEO risk, preserve comments, and keep the site’s blog links accurate.

**Architecture:** Keep `harun.dev/blog` as the canonical destination for all posts. Use strict one-to-one 301 redirects from the old subdomain, preserve slugs and query strings, and keep canonical tags pointing at the new URLs. Keep comments additive and scoped to blog post pages only so the rest of the site remains unchanged.

**Tech Stack:** Laravel + Inertia/React, Cloudflare Workers/Routing, Terraform, GitHub PR workflow.

---

## Task 1: Inventory the existing blog surface

**Objective:** Identify every place the old blog domain and related blog references exist.

**Files to inspect:**
- `resources/js/Components/Menubar.tsx`
- `resources/js/Components/Footer.tsx`
- `routes/web.php`
- `deploy/terraform/main.tf`
- any blog-related content or redirect config discovered during search

**Checklist:**
- find all hardcoded `blog.harun.dev` references
- find any existing `/blog` routes or redirects
- confirm whether blog content is hosted in this repo or elsewhere
- confirm whether comments are currently handled by Hashnode or another external service

**Verification:**
- search results are complete enough to explain the current URL shape
- no blog URL is changed yet

---

## Task 2: Decide the canonical blog routing model

**Objective:** Lock the final URL mapping before making code changes.

**Decision points:**
- `harun.dev/blog` is the canonical home
- slug mapping should remain 1:1 wherever possible
- trailing slash behavior should be consistent
- redirects should preserve query strings
- old subdomain should never become canonical again

**Output:**
- a documented mapping policy for old URL → new URL
- a note on whether the blog will be rendered inside this repo or proxied from another origin

**Verification:**
- one clear canonical rule exists for every post URL

---

## Task 3: Implement the new blog entry points

**Objective:** Make the new blog URL space available under `harun.dev/blog`.

**Likely files to change:**
- `routes/web.php`
- new blog pages/components under `resources/js/Pages/Blog/`
- any shared layout/head metadata helpers used by blog pages

**Requirements:**
- `/blog` index page
- `/blog/{slug}` post pages
- canonical tags on every blog page
- OG/Twitter metadata on every blog page
- RSS or feed support if needed for future syndication

**Verification:**
- `harun.dev/blog` loads successfully in browser
- a sample post URL resolves without 404

---

## Task 4: Add SEO-safe redirects from the old blog domain

**Objective:** Preserve search equity when users and crawlers hit old URLs.

**Likely files to change:**
- `deploy/terraform/main.tf`
- Cloudflare Worker/route config if needed

**Requirements:**
- `blog.harun.dev/*` → `harun.dev/blog/*`
- use `301` responses only
- preserve path and query string
- avoid redirect chains
- keep redirects in place long term

**Verification:**
- old URL returns 301
- target URL is the final destination in one hop

---

## Task 5: Preserve or replace comments with minimal disruption

**Objective:** Keep commenting available without rewriting the whole blog workflow.

**Options to evaluate:**
- keep Hashnode comments via “Discuss on Hashnode” links
- add a lightweight on-site comment provider such as Giscus/Cusdis
- scope comments only to blog post pages

**Recommended constraint:**
- do not change the rest of the portfolio site
- do not require users to create new accounts if an external discussion link is sufficient

**Verification:**
- comments/discussion remain available on each post page
- non-blog pages are unaffected

---

## Task 6: Update internal site links to the new canonical blog

**Objective:** Replace the old blog destination in the UI.

**Files to change:**
- `resources/js/Components/Menubar.tsx`
- `resources/js/Components/Footer.tsx`

**Requirements:**
- blog links should point to `https://harun.dev/blog`
- keep external-link styling if the blog remains on a different origin during transition
- remove the old `blog.harun.dev` URL from visible navigation once the new blog is live

**Verification:**
- nav/footer now point to the canonical blog destination
- no stale `blog.harun.dev` links remain in primary UI

---

## Task 7: Publish content with a syndication delay

**Objective:** Avoid duplicate-content and canonical confusion.

**Publishing rule:**
- publish first on `harun.dev/blog`
- wait 24 hours before syndicating elsewhere
- syndicate only when canonical handling is clear

**Allowed destinations after 24 hours:**
- daily.dev
- Hashnode
- DevGuru
- Medium
- Hacker News

**Guidance:**
- if a platform supports canonical back to `harun.dev/blog`, use it
- otherwise publish an excerpt or teaser with a link back to the canonical URL
- for Hacker News, submit the canonical URL only

**Verification:**
- original article remains the primary indexed source
- syndication does not create competing canonical pages

---

## Task 8: Validate SEO and deployment behavior

**Objective:** Confirm the migration is safe before closing the work.

**Checks:**
- canonical URL on new pages is correct
- sitemap lists the new URLs
- old URLs redirect with 301
- internal links point to the new location
- page titles, descriptions, and OG tags are correct
- live deployment serves the expected content

**Verification commands:**
- browser check of `/blog`
- browser check of one sample post
- redirect check against one old URL
- build/deploy verification if code changed

---

## Order of execution

1. Inventory current references
2. Confirm the final routing model
3. Implement the blog routes/pages
4. Add redirects
5. Preserve comments
6. Update internal links
7. Validate SEO and deployment
8. Publish/syndicate posts after the 24-hour delay

---

## Notes

- The correct domain is `harun.dev`.
- The old domain spelling `haroon.dev` should not be used.
- Keep changes incremental and verify each step before moving on.
