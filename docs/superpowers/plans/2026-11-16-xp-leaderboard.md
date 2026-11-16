# XP and Leaderboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Award XP for sign-up, newsletter, roadmap lessons/topics and capped comments, and show weekly, monthly and all-time leaderboards.

**Architecture:** An append-only `xp_awards` log with a unique (user_id, key) index enforces every cap. Model observers (User, Subscriber, Comment) and the lesson-complete action call one `App\Support\Xp` service. Leaderboards sum awards in a date range.

**Tech Stack:** Laravel 12, Inertia React/TSX, Tailwind, PHPUnit (RefreshDatabase), ryangjchandler/laravel-comments.

**Spec:** `docs/superpowers/specs/2026-11-16-xp-leaderboard-design.md`

## Global Constraints

- Points: signup 50, newsletter 25, lesson 10 (required lessons only), topic 25, comment 5, reply 3.
- Keys: `signup`, `newsletter`, `lesson:{roadmap}/{lesson}`, `topic:{roadmap}/{topic}`, `comment:{page}`, `reply:{page}`; page = `blog/{slug}` or `roadmap/{RoadmapCommentThread key}`.
- Week starts Monday 00:00 UTC; month = calendar month UTC.
- An award failure is reported (`report($e)`) and never breaks the action it rides on.
- Admins (`role = admin`) and users with `leaderboard_hidden = true` or `deletion_scheduled_at` set are left off boards (my call: the owner topping his own board looks odd).
- Tests: `php -d memory_limit=512M vendor/bin/phpunit`; `npm run build` before page tests.

## Review Focus

1. Double submit of the same comment/lesson racing: unique index must swallow the duplicate (`Xp::award` catches `UniqueConstraintViolationException`). Test in Task 1.
2. Deleting a comment that did NOT hold the award must not remove the page's award. Test in Task 2.
3. Undoing a lesson keeps XP; redoing awards nothing. Test in Task 2.
4. Optional lesson completion awards nothing; topic bonus ignores optional lessons. Test in Task 2.
5. Hidden user still earns XP, does not appear on the board, but sees own rank. Test in Task 3.

---

### Task 1: XP log and service

**Files:**
- Create: `database/migrations/2026_11_16_110000_create_xp_awards_table.php` (`xp_awards`: id, user_id FK cascade, key string(191), points unsignedSmallInteger, comment_id nullable unsignedBigInteger index, created_at; unique(user_id,key); index(created_at)). Same migration adds `users.leaderboard_hidden` boolean default false.
- Create: `app/Models/XpAward.php` (`UPDATED_AT = null`, fillable).
- Create: `app/Support/Xp.php`
- Test: `tests/Feature/XpTest.php`

**Interfaces — Produces:**
- `Xp::POINTS` const array keyed `signup|newsletter|lesson|topic|comment|reply`.
- `Xp::award(User|int $user, string $key, int $points, ?int $commentId = null, ?Carbon $at = null): bool` — true if a new row was written; flashes running total to session key `xp` when in a request.
- `Xp::revokeComment(int $commentId): void` — deletes the award row holding that comment.
- `Xp::board(string $period, int $limit = 50): Collection` of `{rank, user_id, name, avatar_url, xp}`; period `week|month|all`.
- `Xp::rankOf(User $user, string $period): ?array` `{rank, xp}` (counts the user even if hidden).

- [ ] Test `test_award_is_once_per_key`: award `signup` twice → first true, second false, one row.
- [ ] Test `test_board_periods`: awards dated last month, this month (before this week) and this week → `all`, `month`, `week` totals differ correctly; ordered desc; hidden/admin users excluded.
- [ ] Implement; run `--filter=XpTest` → PASS. Commit.

### Task 2: Earning hooks

**Files:**
- Create: `app/Observers/XpObserver.php` (or three small observers) registered in `AppServiceProvider::boot`.
- Modify: `app/Http/Controllers/RoadmapController.php:268-279` (`complete`).
- Test: `tests/Feature/XpEarningTest.php`

**Interfaces — Consumes:** `Xp::award`, `Xp::revokeComment`, `RoadmapRepository::lessonIndex()/find()`.

- User `created`: award `signup`; if email verified and `Subscriber::isSubscribed(email)` also `newsletter`.
- Subscriber `saved` with status `subscribed` (and status was changed or created): award `newsletter` to the user whose verified email matches (lowercased).
- Comment `created` (has user_id): page from commentable (`BlogCommentThread` → `blog/{slug}`, `RoadmapCommentThread` → `roadmap/{key}`); key `reply:` if parent_id else `comment:`; pass comment id. Comment `deleted`: `Xp::revokeComment($id)`.
- `complete()`: if lesson is not optional, award `lesson:{slug}/{lesson}`; if every required lesson in its topic is now done by the user, award `topic:{slug}/{topic}`. `uncomplete()` unchanged.

- [ ] Tests: `test_signup_awards_50`; `test_verified_subscribe_awards_newsletter_once`; `test_blog_and_roadmap_comment_caps` (2 comments + 2 replies on one page → 8 XP; another page → +5); `test_deleting_awarded_comment_frees_slot_but_other_delete_does_not`; `test_lesson_xp_once_and_kept_on_undo`; `test_optional_lesson_no_xp_and_topic_bonus_on_last_required`.
- [ ] Implement; run filter → PASS; run full Roadmap/Blog/Newsletter tests → PASS. Commit.

### Task 3: Leaderboard page, profile toggle, XP toast

**Files:**
- Create: `app/Http/Controllers/LeaderboardController.php` (`index`: `?period=week|month|all`, default `week`; props `period`, `rows`, `me` (rankOf, null for guests)).
- Modify: `routes/web.php` (`GET /leaderboard` name `leaderboard`; `PATCH /profile/leaderboard` auth → toggles `leaderboard_hidden`).
- Create: `resources/js/Pages/Leaderboard.tsx` (tabs This week / This month / All time; rank, avatar, name, XP; "You: #12 · 340 XP" bar for signed-in; slate/amber theme; short "How to earn XP" list with the point values).
- Modify: `resources/js/Pages/Profile/Edit.tsx` (+ a small partial) for the "Show me on the leaderboard" checkbox.
- Modify: `app/Http/Middleware/HandleInertiaRequests.php` share `xp` (session flash) and a layout toast "+N XP" (`app.tsx` or the main layout).
- Modify: Roadmaps index page + user menu: link to `/leaderboard`. Add `/leaderboard` to `SeoCatalog`/sitemap like `/roadmaps`.
- Test: `tests/Feature/LeaderboardPageTest.php`

- [ ] Tests: page 200 for guest with rows; invalid period falls back to week; toggle hides user from rows but `me` still shows rank.
- [ ] Implement; `npm run build`; filter → PASS. Commit.

### Task 4: Backfill past activity

**Files:**
- Create: `database/migrations/2026_11_16_120000_backfill_xp_awards.php`
- Test: in `tests/Feature/XpTest.php` (`require` the migration and call `up()`, as in RoadmapAccessTest).

- Using raw inserts with `insertOrIgnore` and original timestamps: signup per user (`created_at`); newsletter for verified users whose email is subscribed (subscriber `updated_at`); lessons from `roadmap_progress` (required lessons only, `completed_at`), topics when all required done (latest completion time); first comment and first reply per (user, page) from non-deleted comments (their `created_at`, comment_id set). Skip roadmaps/lessons no longer in YAML.
- [ ] Test `test_backfill_awards_past_activity_once` (run `up()` twice → same totals). Implement → PASS. Commit.

### Task 5: Ship

- [ ] Full suite + `npm run build` + pint on changed files.
- [ ] PR, CI green, merge, deploy run success, `/leaderboard` returns 200 live.
