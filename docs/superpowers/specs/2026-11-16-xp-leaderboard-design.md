# XP and leaderboards: design

## Why
Give signed-in people a reason to come back and take part: they earn XP for joining, subscribing, learning and commenting, and see themselves ranked weekly, monthly and all time.

## Goals
- Award XP for: sign-up, newsletter subscription, finishing required roadmap lessons, finishing a whole topic, comments and replies (blog posts and roadmaps).
- Public leaderboards: this week, this month, all time.
- Spam can't farm XP: per page (blog post, roadmap topic, roadmap lesson) at most one comment and one reply count.

## Non-goals
- Badges, levels, streaks, daily-visit XP, rewards or prizes.
- Admin XP editing UI (a manual DB fix is enough for now).

## Anti-goals
- Rewarding spam or toggle-farming (undo/redo a lesson, post/delete a comment).
- Exposing people who don't want to be shown.

## Approaches considered
1. **XP log (chosen).** Table `xp_awards`: one row per award. A unique key on (user, award key) blocks duplicates and enforces the caps. Boards sum rows in a date range. Auditable and easy to undo or rescore.
2. Running totals on users with timed resets: fast reads, but caps still need a log and a missed reset (on the separate scheduler service) gives wrong boards.
3. Count from existing tables on view: no new table, but slow, and the per-page caps become complex queries.

## Decisions (Harun)
- XP values: sign-up 50; newsletter 25; required lesson 10; topic fully done 25 bonus; comment 5; reply 3.
- Leaderboard shows account name + photo (same as comments). Anyone can hide themselves; they keep earning XP.

## Rules (my calls, from the conversation)
- Award key examples: `signup`, `newsletter`, `lesson:{roadmap}/{lesson}`, `topic:{roadmap}/{topic}`, `comment:blog/{slug}`, `reply:roadmap/{roadmap}/{topic}[/{lesson}]`. One row per (user, key).
- A lesson awards once, ever: undoing it keeps the XP (no farming, no penalty for a misclick). Optional lessons earn nothing. Topic bonus when every required lesson in the topic is done.
- Comment XP goes to the first counted comment/reply on the page. Deleting that comment removes its award row; the next comment on that page can earn it again (net effect: still max one).
- Newsletter XP: when the user's verified account email becomes an active subscriber (account popup, or confirming the public form with the same email). Unsubscribing keeps it.
- Sign-up XP: when the account is created (social or magic link).
- Week = Monday 00:00 UTC; month = calendar month UTC. Awards are dated by when they were earned.

## Backfill
A one-off migration awards existing users for what they already did, dated at the original time: sign-up (`users.created_at`), newsletter (active subscriber with a matching verified email), lessons and topics (`roadmap_progress`), and the first comment and first reply per page (comments table). So the all-time board isn't empty on launch.

## Surfaces
- `/leaderboard` page: tabs Week / Month / All time, top 50, rank, photo, name, XP. Signed-in users also see their own rank and XP if outside the top 50.
- Linked from the Roadmaps page and the user menu.
- Profile page: "Show me on the leaderboard" toggle (`users.leaderboard_hidden`, default false).
- After an award, a small "+10 XP" flash on the page where it happened.

## Constraints
- Same slate/amber theme. Laravel + Inertia React, PHPUnit tests per rule.
- Awards must never break the action they ride on: a failed award is logged, the comment/lesson still saves.
