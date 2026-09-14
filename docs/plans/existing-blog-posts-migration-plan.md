# Existing Blog Posts Migration Plan

> **For Hermes:** Use the feature-branch workflow and execute this plan task-by-task. Keep the todo list updated and do not commit directly to `main`.

**Goal:** Migrate all existing blog posts into native repository content without losing SEO value, archive history, or social/discovery signals.

**Architecture:** Keep `harun.dev/blog` as the canonical source of truth. Store publication metadata separately from post content, preserve the original slug structure, and keep legacy `blog.harun.dev` URLs redirecting to the new canonical paths. Preserve archive links for source/history and keep feed/sitemap generation derived from the native files so the site stays maintainable.

**Tech Stack:** Laravel, Inertia/React, Symfony YAML, Markdown content files, XML sitemap/RSS generation, Cloudflare/Terraform redirects, GitHub PR workflow.

---

## Task 1: Inventory the legacy blog export and current native content

**Objective:** Make sure every existing post is accounted for before any further content work.

**Files to inspect:**
- `resources/blog/publication.yml`
- `resources/blog/posts/*.md`
- `app/Support/BlogRepository.php`
- `routes/web.php`
- `resources/js/Pages/Blog/Index.tsx`
- `deploy/terraform/main.tf`

**Checklist:**
- confirm the number of native posts matches the original post set
- confirm each post has a stable slug and publication date
- confirm the archived source URL is present for each post
- confirm no post still depends on the removed JSON snapshot

**Verification:**
- count of files in `resources/blog/posts/` matches the expected post count
- each file parses cleanly and loads through `BlogRepository`

---

## Task 2: Normalize content for canonical post rendering

**Objective:** Make each imported post render consistently and read cleanly as first-party content.

**Files to change:**
- `resources/blog/posts/*.md`
- `app/Support/BlogRepository.php` if parsing rules need tightening

**Requirements:**
- preserve the original title, slug, date, and tags
- keep the body content intact except for safe normalization
- preserve internal links where they point to canonical `harun.dev/blog`
- keep legacy source links archived via Wayback Machine
- remove trailing whitespace and malformed frontmatter

**Verification:**
- generated post page HTML matches expected body content
- no import artifacts remain in visible content

---

## Task 3: Preserve SEO-critical metadata on the new blog

**Objective:** Avoid ranking loss during and after migration.

**Files to inspect or change:**
- `resources/js/Pages/Blog/Index.tsx`
- `resources/js/Pages/Blog/Post.tsx` or equivalent post page component
- `app/Support/BlogRepository.php`
- `routes/web.php`
- sitemap/feed generation code

**Requirements:**
- canonical tags point to `https://harun.dev/blog` and `https://harun.dev/blog/{slug}`
- Open Graph and Twitter metadata match canonical URLs
- RSS feed points to the canonical blog URLs
- sitemap includes the blog index and each post URL
- legacy `blog.harun.dev` URLs remain 301 redirects only

**Verification:**
- browser view source / snapshot shows canonical and OG URLs are correct
- RSS and sitemap resolve successfully in production

---

## Task 4: Preserve archived legacy references for historical discoverability

**Objective:** Keep historical traces without exposing the old domain as a live source of truth.

**Files to change:**
- `resources/blog/posts/*.md`
- `app/Support/BlogRepository.php`
- any UI text that references the original source

**Requirements:**
- use archived source links for old Hashnode/legacy URLs
- avoid linking to live `blog.harun.dev` pages except where redirects are intended
- keep archive links obvious but secondary to the canonical post URL

**Verification:**
- each post has a visible archived-source link
- no primary content CTA points back to the old domain as canonical

---

## Task 5: Validate production safety before each publish step

**Objective:** Catch regressions before they reach users or crawlers.

**Checks:**
- `php artisan test`
- `npm run build`
- `git diff --check`
- live checks for `/blog`, one sample post, `/sitemap.xml`, `/blog/feed.xml`, and one `blog.harun.dev` redirect

**Expected results:**
- tests pass
- build passes
- no whitespace or formatting issues in the diff
- live pages return 200 and old URLs return 301

---

## Task 6: Keep the migration inside feature branches and PRs

**Objective:** Avoid direct commits to `main` while the migration work continues.

**Workflow:**
- create a feature branch for each migration batch
- commit content changes in small, reviewable chunks
- push the branch
- open a PR against `main`
- request review and verify production after merge

**Verification:**
- no direct commits to `main`
- PR is the only merge path
- the live site remains healthy after merge

---

## Execution Order

1. Inventory the posts and metadata
2. Normalize content files
3. Lock SEO metadata and routing behavior
4. Preserve archived source links
5. Validate locally and in production
6. Ship via feature branch + PR

---

## Definition of Done

- all existing posts live under native files
- canonical URLs are correct
- sitemap and RSS are complete
- old blog URLs redirect once and only once
- archive links remain available
- build/tests pass before merge
- live production checks pass after merge
