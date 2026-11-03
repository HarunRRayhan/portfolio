# GitHub Sponsors Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every Stripe checkout on harun.dev with GitHub Sponsors. A sponsorship webhook turns into booking credits, and credit bookings go through Harun's approval.

**Architecture:** A GitHub `sponsorship` webhook writes `github_sponsorships` rows. `SponsorCreditService` turns each row into `consultation_credits`: one-time credits right away, monthly credits lazily per billing period. Credits attach to a user by GitHub id when that user is next seen. `/consultation` holds a credit and calls the existing `BookingWorkflowService::requestBooking` (amount 0). The booking stays `pending_approval` until Harun approves, and approval confirms it with no payment. Cancel and revoke run through the existing `requestCancel` + `approveCancel`.

**Tech Stack:** Laravel 12, PHPUnit feature tests, Inertia + React/TSX, Laravel HTTP client (GitHub public API).

**Spec:** `docs/superpowers/specs/2026-11-03-github-sponsors-payments-design.md`

## Global Constraints

- Owner mail uses `config('mail.owner.address')`. Never add `mail.to`.
- Webhook auth: `X-Hub-Signature-256` = `sha256=` + HMAC-SHA256(raw body, `GITHUB_SPONSORS_WEBHOOK_SECRET`), compared with `hash_equals`. A missing secret means 401.
- Idempotency key: the `X-GitHub-Delivery` header (unique column).
- One-time credit: 1 call, `expires_at = sponsorship started_at + 60 days`. The call's `starts_at` must be ≤ `expires_at`.
- Monthly tier: $499/mo, 2 calls on the `pro` consultation tier plus 1 scan per billing period. A period starts on the anniversary of `started_at` (clamped to month end, `addMonthsNoOverflow`). No rollover.
- Tier map lives in `config/sponsors.php` (env node ids). An unmapped GitHub tier is a donation: store it, grant nothing, send no alert.
- Match users by GitHub numeric id only (`users.provider_name='github'` + `provider_id`, or `social_identities`). Email matching applies only to `source=manual` grants made by email, against a verified email.
- Organization sponsorships credit `sender`.
- Copy follows the `humanizer` skill. No em-dash walls.
- **Deviation from spec (flagged to Harun):** keep the Stripe webhook, refund and reconcile code so already-paid bookings still refund automatically. Only the checkout entry points are removed: `/sponsor-me/checkout`, `/book/b/{id}/pay`, coupons and the launch promotion on `/consultation`. Delete the remaining Stripe code in a follow-up once no Stripe-paid booking is in the future.

## Review Focus

1. **Sponsor signed in with Google or a magic link, not GitHub.** Credits can't attach. `/consultation` must say "You sponsored? Link GitHub" with a link to the GitHub OAuth redirect, which links it through `social_identities`. Test in Task 5.
2. **Webhook arrives before Harun sets the tier env ids.** The sponsorship is stored as a donation. The admin list must show it, with a "Grant credits" action, so the money isn't lost silently. Test in Task 8.
3. **Double submit or two tabs.** One credit must never confirm two bookings (`lockForUpdate` on the credit row). Test in Task 5.
4. **Credit expires between page load and submit, or the chosen slot is after expiry.** Reject with a `starts_at` error and confirm nothing. Test in Task 5.
5. **Monthly started on Jan 31.** The February period starts Feb 28/29, and only one set of credits exists per period, even when the page loads concurrently (unique index). Test in Task 2.

---

### Task 1: Schema, config, models

**Files:**
- Create: `config/sponsors.php`
- Create: `database/migrations/2026_11_03_100000_create_github_sponsorship_tables.php`
- Create: `app/Models/GithubSponsorship.php`, `app/Models/ConsultationCredit.php`, `app/Models/GithubWebhookEvent.php`
- Modify: `.secrets/github.env.example` (add `GITHUB_SPONSORS_WEBHOOK_SECRET=`, `GITHUB_SPONSORS_HANDLE=`, `GITHUB_SPONSORS_TIER_{LIGHT,PRO,MAX,MONTHLY}=`, `GITHUB_SPONSORS_TIER_{...}_URL=`)

**Interfaces — Produces:**
- `config('sponsors.handle')`, `config('sponsors.webhook_secret')`, `config('sponsors.url')` (`https://github.com/sponsors/{handle}`), `config('sponsors.one_time_days')` = 60.
- `config('sponsors.tiers')`: `slug => ['node_id' => ?string, 'url' => ?string, 'kind' => 'one_time'|'monthly', 'calls' => [consultationTierSlug => int], 'scans' => int]`. Values: `light` one_time `['light'=>1]`; `pro` one_time `['pro'=>1]`; `max` one_time `['max'=>1]`; `monthly` monthly `['pro'=>2]`, scans 1.
- Table `github_sponsorships`: id, `github_sponsor_id` (string, index), `github_login`, `user_id` (nullable FK users, nullOnDelete), `tier_slug` (nullable; null = donation), `github_tier_node_id`, `kind`, `status` (`active|cancelled|revoked`), `source` (`webhook|manual`), `grant_email` (nullable), `started_at`, `ended_at` (nullable), `github_sponsorship_node_id` (nullable, unique), timestamps.
- Table `consultation_credits`: id, `github_sponsorship_id` FK cascade, `user_id` nullable FK, `kind` (`call|scan`), `consultation_tier_id` nullable FK, `period_start` (date), `slot` (int), `expires_at`, `used_by_booking_id` nullable FK `consultation_bookings`, `used_at`, `scan_repo_url` nullable, `revoked_at`, `reminded_at`, timestamps. Unique `(github_sponsorship_id, kind, period_start, slot)`.
- Table `github_webhook_events`: id, `delivery_id` unique, `event`, `action`, `payload` json, `processed_at`, `failed_at`, `error` text, timestamps.
- Models with `$fillable`, datetime casts, and relations: `GithubSponsorship::credits()`, `user()`; `ConsultationCredit::sponsorship()`, `tier()`, `booking()`, `scopeUsable(Builder)` (not used, not revoked, `expires_at > now`).

- [ ] **Step 1:** Write the migration, config and models above.
- [ ] **Step 2:** Run `php artisan migrate:fresh --env=testing` (or `php artisan test --filter=ExampleTest`). Expected: no errors.
- [ ] **Step 3:** Commit `feat(sponsors): schema and tier config`.

### Task 2: SponsorCreditService

**Files:**
- Create: `app/Services/Sponsorship/SponsorCreditService.php`
- Test: `tests/Feature/SponsorCreditServiceTest.php`

**Interfaces:**
- Consumes: Task 1 models and config.
- Produces:
  - `recordSponsorship(array $attrs): GithubSponsorship` upserts by `github_sponsorship_node_id` (or creates, for manual), resolves `user_id` via `userForGithubId()`, and grants one-time credits with `slot` 1..N and `period_start = started_at` date.
  - `userForGithubId(string $id): ?User`.
  - `ensurePeriodCredits(GithubSponsorship $s, ?Carbon $now = null): void` creates the current period's monthly credits. `insertOrIgnore` on the unique key makes it race-safe. No-op unless `kind=monthly`, `status=active` and a tier is mapped.
  - `claimFor(User $user): void` attaches unowned sponsorships and credits by the user's GitHub id (both identity stores), plus manual grants whose `grant_email` equals the user's verified email. Then runs `ensurePeriodCredits` for each active monthly sponsorship.
  - `usableCredits(User $user, string $kind = 'call'): Collection<ConsultationCredit>`, ordered by `expires_at`.
  - `releaseForBooking(ConsultationBooking $b): void` clears `used_by_booking_id`/`used_at` when the credit is not revoked and not expired.
  - `endSponsorship(GithubSponsorship $s, string $status): Collection<ConsultationBooking>` sets the status and `ended_at`, sets `revoked_at` on unused credits, and returns future (`starts_at > now`) non-cancelled bookings linked to its credits. Task 4 cancels them.

- [ ] **Step 1: Write failing tests**
  - `test_one_time_grant_gives_one_credit_expiring_in_60_days`: record tier `pro`, started 2026-11-03. Expect 1 `call` credit, tier `pro`, `expires_at` 2027-01-02.
  - `test_unmapped_tier_is_donation_with_no_credits`: `tier_slug` null → 0 credits.
  - `test_monthly_period_credits_created_once`: call `ensurePeriodCredits` twice → 2 call + 1 scan, `expires_at` = next anniversary.
  - `test_monthly_jan_31_february_period`: started 2027-01-31, now 2027-02-28 10:00 → `period_start` 2027-02-28.
  - `test_cancelled_monthly_creates_no_new_period`.
  - `test_claim_attaches_by_github_identity_in_users_and_social_identities`.
  - `test_claim_by_email_only_for_manual_grants`: a webhook sponsorship with matching email stays unattached.
  - `test_release_skips_expired_and_revoked_credits`.
- [ ] **Step 2:** Run `php artisan test --filter=SponsorCreditServiceTest`. Expected: FAIL (class not found).
- [ ] **Step 3:** Implement the service with the signatures above.
- [ ] **Step 4:** Rerun. Expected: PASS.
- [ ] **Step 5:** Commit `feat(sponsors): credit service`.

### Task 3: Webhook endpoint

**Files:**
- Create: `app/Http/Controllers/Sponsorship/GithubSponsorsWebhookController.php`
- Create: `app/Mail/Sponsorship/SponsorCreditsReadyMail.php` + view, `app/Mail/Sponsorship/GithubWebhookFailedMail.php` + view
- Modify: `routes/web.php` (`Route::post('/github/sponsors/webhook', …)->name('github.sponsors.webhook')`), `bootstrap/app.php` (add `github/sponsors/webhook` to the CSRF `except` list next to `stripe/webhook`)
- Test: `tests/Feature/GithubSponsorsWebhookTest.php`

**Interfaces:** Consumes `SponsorCreditService::recordSponsorship` (Task 2) and `CancelSponsorBookings` (Task 4). **Build Task 4 before this task.** It depends only on Task 2.

Behaviour:
- Store the event first by `delivery_id`. A duplicate whose `processed_at` is set returns 200 and does nothing.
- `event` header ≠ `sponsorship`, or `ping` → store, 200.
- `created`: map `sponsorship.tier.node_id` to a tier slug via config. The credited GitHub user is `sponsor` if `sponsor.type === 'User'`, else `sender`. Call `recordSponsorship`. Then mail `SponsorCreditsReadyMail` (with the `/consultation` link and expiry) to the matched user's email. If there's no user, mail the public email from `Http::get("https://api.github.com/user/{id}")->json('email')`, when present. Skip mail for donations.
- `tier_changed`: update `tier_slug`/`kind` from the new tier.
- `cancelled`: `CancelSponsorBookings($s, 'cancelled')`.
- Other actions: store, 200.
- Exception → `failed_at`/`error`, mail `GithubWebhookFailedMail` to the owner, return 500 (GitHub can redeliver).

- [ ] **Step 1: Write failing tests**: `test_rejects_bad_signature_401`, `test_rejects_when_secret_unset`, `test_created_one_time_grants_credit_and_mails_user`, `test_created_unknown_user_fetches_public_email` (`Http::fake`), `test_duplicate_delivery_is_noop`, `test_org_sponsorship_credits_sender`, `test_donation_tier_sends_no_mail`, `test_tier_changed_updates_tier`, `test_failure_mails_owner_and_returns_500`. Use a helper that signs a fixture payload.
- [ ] **Step 2:** Run `php artisan test --filter=GithubSponsorsWebhookTest`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(sponsors): GitHub sponsorship webhook`.

### Task 4: Cancel cascade

**Files:**
- Create: `app/Services/Sponsorship/CancelSponsorBookings.php`
- Test: `tests/Feature/SponsorCancelCascadeTest.php`

**Interfaces:**
- Produces `CancelSponsorBookings::__invoke(GithubSponsorship $s, string $status): int`. It calls `SponsorCreditService::endSponsorship`. For each returned booking it runs `BookingWorkflowService::requestCancel($b)` (if not already `cancel_requested`) and then `approveCancel($b)`. Failures are logged per booking and mailed to the owner, so one Google error doesn't stop the rest. It returns the count cancelled. Used by the webhook (`cancelled`) and by admin revoke (`revoked`).
- If `requestCancel` refuses some statuses (read it first), add a `cancelForSponsorEnd(ConsultationBooking $b)` method to `BookingWorkflowService` that sets `cancel_requested`, then reuse `approveCancel`. Keep Google event deletion and `BookingCancelledMail`.

- [ ] **Step 1: Write failing tests** (call the service directly, not the webhook): `test_end_cancels_future_credit_booking_and_deletes_event` (fake Google), `test_past_booking_untouched`, `test_unused_credits_revoked`, `test_credit_not_released_after_sponsor_end`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `php artisan test --filter=SponsorCancelCascadeTest`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(sponsors): cancel bookings when sponsorship ends`.

### Task 5: Booking with a credit (backend)

**Files:**
- Modify: `app/Services/Consultation/BookingWorkflowService.php` (`requestBooking` gains a trailing `?ConsultationCredit $credit = null`; `decline` and `approveCancel` call `releaseForBooking`)
- Modify: `app/Http/Controllers/Consultation/BookController.php` (`show`, `availability`, `store`; delete `validateCoupon`)
- Modify: `routes/web.php` (remove `/book/coupon`, remove `/book/b/{publicId}/pay`, remove the `pay` method in `BookingAccessController`)
- Test: `tests/Feature/SponsorBookingTest.php`. Update `BookPageTest`, `ConsultationBookingTest` and `ConsultationStripeCheckoutTest` HTTP cases that post to `/book` without a credit, `/book/coupon` or `/pay`. Keep the service-level Stripe tests that cover legacy refunds.

Behaviour:
- `requestBooking` with `$credit`: inside the existing transaction, `lockForUpdate` the credit. It must be usable, owned by the booking `user_id`, of tier `$tier`, and `$startsAt ≤ expires_at`, else throw `InvalidArgumentException('That credit has expired or was already used.')`. Set `amount_due_cents=0`, `list_price_cents=tier price`, `campaign_discount_cents=0`, and skip `launchPromotion->claim` and the coupon. **Keep** the PENDING_ADMIN/PENDING_CLIENT notifications and the Google hold. Status stays `pending_approval`. Mark the credit used (`used_by_booking_id`, `used_at`), which holds it. The existing `approve()` path confirms an amount-0 booking without payment (verify, and fix if not). The hold-expiry path (`expireStaleHolds` / `expireBooking`) must call `releaseForBooking`.
- `show`: when signed in, `claimFor(user)`. Props: drop `stripeConfigured` and `launchPromotion`. Add `credits` (`[{id, tier_slug, tier_name, kind, expires_at}]`), `sponsorTiers` (`[{slug, url, kind}]` from config), `sponsorsUrl`, `contactUrl` (`route('contact')` or whatever the contact route is named), `hasGithubIdentity` (bool), `githubLinkUrl` (social redirect route for github). Update the JSON-LD description to "Sponsor on GitHub, then book a time." Keep offer prices from `price_cents`.
- `availability`: an optional `credit` id limits `to` to `min(to, credit.expires_at)`.
- `store`: requires `credit_id` (exists, owned by the user) and derives the tier from the credit. Drop `tier`/`coupon_code` validation. Errors go to `starts_at`.

- [ ] **Step 1: Write failing tests**: `test_store_with_credit_creates_pending_booking_holds_credit_and_mails_owner`, `test_approve_credit_booking_confirms_without_payment`, `test_expired_hold_returns_credit`, `test_store_without_credit_rejected`, `test_slot_after_expiry_rejected`, `test_used_credit_cannot_book_twice` (two sequential posts with the same credit → second errors), `test_decline_returns_credit`, `test_approved_cancel_returns_credit`, `test_show_claims_credits_and_flags_missing_github_identity`, `test_other_users_credit_rejected`.
- [ ] **Step 2:** Run `php artisan test --filter=SponsorBookingTest`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `php artisan test`. Expected: all PASS after updating the legacy HTTP tests.
- [ ] **Step 5:** Commit `feat(consultation): book with sponsor credits`.

### Task 6: Frontend `/consultation`, status page, `/sponsor-me`

**Files:**
- Modify: `resources/js/Pages/Book.tsx`, `resources/js/Pages/Book/Status.tsx`, `resources/js/Pages/Sponsor.tsx`
- Delete: `app/Services/Sponsorship/SponsorCheckoutService.php`, `app/Http/Controllers/SponsorCheckoutController.php` (find the exact path with grep), the `sponsor.checkout` route, and the Stripe parts of `config/sponsor.php`. Update `tests/Feature/SponsorPageTest.php`.

Behaviour:
- `Book.tsx` has three states:
  1. Signed out, or no credits: tier cards whose CTA is "Sponsor on GitHub" (`sponsorTiers[slug].url`, falling back to `sponsorsUrl`, new tab, `rel="noopener noreferrer"`), plus the monthly card ($499/mo · 2 × 60-min calls + 1 open-source scan). Then "Already sponsored? Sign in with GitHub" (or, if signed in without a GitHub identity, "Link your GitHub account" → `githubLinkUrl`).
  2. Has call credits: a credit picker (tier, "book by {date}") replaces the tier picker. Availability is fetched with `credit`. The existing slot picker and form post `credit_id`.
  3. Has a scan credit: link to the Task 7 scan form.
  Every state shows the manual note: "GitHub doesn't support your payment method? Use the [contact page] or email me and I'll set it up by hand." Remove the coupon, launch-promotion and Stripe copy.
- `Status.tsx`: remove the pay button and the Stripe copy.
- `Sponsor.tsx`: replace the amount form with a "Sponsor on GitHub" button (`sponsorsUrl`) plus the same manual note.

- [ ] **Step 1:** Update `SponsorPageTest` and `BookPageTest` to assert the Inertia props (`sponsorsUrl`, `sponsorTiers`, no `stripeConfigured`). Run. Expected: FAIL.
- [ ] **Step 2:** Implement the pages and the deletions.
- [ ] **Step 3:** Run `npm run build && npx tsc --noEmit && php artisan test`. Expected: all pass.
- [ ] **Step 4:** Use the `local-verify` skill: check `/consultation` in all 3 states and `/sponsor-me` in a browser.
- [ ] **Step 5:** Commit `feat(consultation): GitHub Sponsors UI`.

### Task 7: Open-source scan request

**Files:**
- Create: `app/Http/Controllers/Sponsorship/ScanRequestController.php` (`create` → Inertia `Consultation/ScanRequest`, `store`), `resources/js/Pages/Consultation/ScanRequest.tsx`, `app/Mail/Sponsorship/ScanRequestedMail.php` + view
- Modify: `routes/web.php` (`auth` group: `GET|POST /consultation/scan`, name `consultation.scan`)
- Test: `tests/Feature/SponsorScanRequestTest.php`

Behaviour: `store` validates `repo_url` (`url:https`, host `github.com`, max 2048) and `notes` (nullable, max 5000). It `lockForUpdate`s the oldest usable `scan` credit and sets `used_at`, `scan_repo_url`. It mails the owner a `ScanRequestedMail` with the user, repo and notes, then redirects to `/consultation` with a flash. Without a credit it returns 403.

- [ ] **Step 1: Failing tests**: `test_scan_request_uses_credit_and_mails_owner`, `test_no_scan_credit_forbidden`, `test_non_github_repo_rejected`.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(sponsors): open-source scan request`.

### Task 8: Admin sponsorships

**Files:**
- Create: `app/Http/Controllers/Admin/SponsorshipController.php` (`index`, `store` grant, `revoke`), `resources/js/Pages/Admin/Sponsorships/Index.tsx`
- Modify: `routes/web.php` (admin group with the same middleware as `admin/contacts`, prefix `admin/sponsorships`, names `admin.sponsorships.{index,store,revoke}`), and the admin nav (where Contacts is linked)
- Test: `tests/Feature/Admin/SponsorshipAdminTest.php`

Behaviour:
- `index`: sponsorships, newest first, with user, login, tier (or "donation"), status, source, credits (used/expires) and linked bookings.
- `store`: `identifier` (an email or a GitHub login), `tier_slug` (a config key), and an optional `expires_at`. A login is resolved via `Http::get("https://api.github.com/users/{login}")` → `id`. Then call `recordSponsorship` with `source=manual` and, for an email, `grant_email`. A custom `expires_at` overrides the one-time expiry.
- `revoke`: runs `CancelSponsorBookings($s, 'revoked')`.
- A donation row offers "Grant credits", which prefills `store` with its GitHub id and login (Review Focus 2).

- [ ] **Step 1: Failing tests**: `test_admin_lists_donation_sponsorship`, `test_grant_by_login_resolves_github_id` (`Http::fake`), `test_grant_by_email_attaches_on_claim`, `test_revoke_cancels_future_bookings`, `test_non_admin_forbidden`.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(admin): sponsorships`.

### Task 9: Reminders and retiring unpaid Stripe bookings

**Files:**
- Modify: `routes/console.php`
- Create: `app/Mail/Sponsorship/CreditExpiringMail.php` + view
- Test: `tests/Feature/SponsorCommandsTest.php`

Behaviour:
- `sponsors:remind-expiring`, scheduled daily: for usable `call` credits with a user and `expires_at` within 7 days that have `reminded_at` null, mail the user, then set `reminded_at`. Monthly credits are skipped (their periods are short).
- `consultations:retire-unpaid {--dry-run}`: one-off. Bookings in `pending_approval`, `awaiting_payment` or `reschedule_proposed` with `stripe_paid_at` null → status `expired`, delete the Google hold via the existing operation path (reuse whatever `expireStaleHolds` does per booking), and mail the client a short note linking `/consultation`. `--dry-run` only lists them.

- [ ] **Step 1: Failing tests**: `test_reminder_sent_once`, `test_retire_dry_run_changes_nothing`, `test_retire_expires_unpaid_and_keeps_paid`.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat(sponsors): expiry reminders and Stripe retirement command`.

### Task 10: Docs and ship

**Files:** `CLAUDE.md` (Infra section: one bullet on the GitHub Sponsors webhook, the tier env ids, and "Stripe code kept only for legacy refunds"), `docs/checklists/github-sponsors-setup.md` (Harun's dashboard steps from the spec).

- [ ] **Step 1:** Write the docs.
- [ ] **Step 2:** Run `php artisan test && npm run build`. Expected: green.
- [ ] **Step 3:** Ship per CLAUDE.md: PR, self-review, CI green, merge, wait for "Build and Sync Assets to R2". Before merging, set `GITHUB_SPONSORS_*` on Railway `web` (and `scheduler` for the mails). After the deploy, run `railway run php artisan consultations:retire-unpaid --dry-run` and report the list before the real run.
