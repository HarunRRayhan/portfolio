# GitHub Sponsors replaces Stripe — design

Date: 2026-11-03. Status: draft for Harun's review.

## Why

GitHub Sponsors takes no fee, so Harun keeps 100%. Harun also does not want to run payments,
subscriptions, refunds or checkout on harun.dev any more. GitHub collects the money. harun.dev
only listens for "this person sponsored at tier X" and turns that into booking credits.

## Goals

1. Every paid path on harun.dev (`/sponsor-me`, `/consultation`) sends people to
   `https://github.com/sponsors/<handle>`. No Stripe checkout is left.
2. Each GitHub Sponsors tier maps to consultation credits:
   - **One-time tiers** mirror today's tiers: Light ($149, one 30-min call), Pro ($249, one
     60-min call), Max ($349, one 60-min call with recording and follow-up). Each purchase gives
     **1 credit, which must be booked within 60 days**. After that it expires.
   - **Monthly tier** (Harun approved the recommendation): $499/mo for 2 × 60-min Pro-style calls
     (no recording) plus 1 open-source scan per billing month. A scan means Harun runs the
     RayStack security, code and infra reviews on one public repo the sponsor names, then sends
     back the report. Unused monthly credits expire at the end of the period and do not roll over.
   - **Donation tiers:** any GitHub tier with no mapped `github_tier_node_id` is a plain
     donation. It is stored and shown in admin, but grants nothing and sends no alert.
   - **Expiry means the call date.** The call itself must happen on or before the credit's
     `expires_at`, so the slot picker only offers slots up to that date. *(my call)*
3. A GitHub webhook (`sponsorship` events) reports to harun.dev, which grants, changes or
   revokes credits.
4. The sponsor is matched to a harun.dev account through their GitHub identity. If no account
   exists, they are asked to sign in with GitHub, and the credits attach on first sign-in.
5. A booking paid with a credit **confirms right away**, with no approval step (Harun's
   decision). Harun can still decline or reschedule. A decline gives the credit back.
6. A cancelled sponsorship, or a revoke by admin (used for refunds), cancels the
   **future** bookings made with that sponsorship's credits and removes the calendar events.
7. Both pages say: "If GitHub doesn't support your payment method, use the contact page or email
   me and I'll set it up by hand." Harun can then grant credits by hand in admin.

## Non-goals

- No Stripe, no coupons, no launch-promotion pricing in the paid flow. GitHub owns pricing.
- No refunds issued by harun.dev. GitHub handles refunds.
- No GitHub Sponsors GraphQL sync or polling in v1. The webhook plus the admin tools are enough.
- No credit transfers between accounts, and no partial credits.

## Anti-goals (fails even if it "works")

- A sponsor is charged and can't book, and nobody notices. Unmatched or failed webhooks must
  email Harun, the way `StripeWebhookUnmatchedMail` does today.
- One webhook grants credits twice. Delivery must be idempotent on `X-GitHub-Delivery`.
- A forged request grants credits. The `X-Hub-Signature-256` HMAC is required and checked in
  constant time.
- Customer mail goes to the owner, or the reverse. Keep using `config('mail.owner')`. Never add
  `mail.to` (see CLAUDE.md).

## Key facts and constraints

- GitHub `sponsorship` webhook actions are `created`, `cancelled`, `edited`, `tier_changed`,
  `pending_cancellation` and `pending_tier_change`. **There is no refund action.** A refund of a
  one-time sponsorship may produce no event at all. That is why admin revoke exists (goal 6).
- Monthly sponsorships renew without a new `created` event. *My call:* credits for a monthly
  sponsorship are computed, not pre-granted. While the sponsorship is active (`created`
  received, no `cancelled` yet), the sponsor has 2 calls and 1 scan per **billing period**. A
  period starts on the sponsorship's `created_at` day each month (the anniversary, not the
  calendar month). `pending_cancellation` changes nothing.
  `cancelled` ends it.
- The payload carries `sponsorship.sponsor` (user or org), `sponsorship.tier` (`node_id`,
  `is_one_time`, `monthly_price_in_cents`, `name`) and `sender`. *My call:* an organization
  sponsorship is credited to `sender`, the GitHub user who acted.
- The payload has no sponsor email. The "invite" reaches people in two ways. (a) Each tier's
  **GitHub welcome message**, set by Harun in the Sponsors dashboard, says "Sign in at
  harun.dev/consultation with GitHub to book. You have 60 days." (b) If the GitHub user has a
  public email, which we can fetch from the unauthenticated GitHub user API, harun.dev also sends
  an invite mail.
- Accounts store the first login provider in `users.provider_name/provider_id`. Extra providers
  live in `social_identities`. Match on GitHub numeric id (`sponsor.id`) across both. Never
  match on login name, because login names can change.
- Web and scheduler are separate Railway services. Webhook handling runs inline in `web`
  (there is no queue worker). Expiry runs on the scheduler.

## How it works

### Data

- `consultation_tiers` gains `github_tier_node_id` (nullable, unique), `kind`
  (`one_time` | `monthly`) and monthly allowances (`monthly_calls`, `monthly_scans`). Harun
  fills in the tier node IDs in admin, or in a migration once the tiers are created on GitHub.
- New `github_sponsorships` table: `github_sponsor_id`, `github_login`, `user_id` (nullable
  until matched), `consultation_tier_id`, `status` (`active` | `cancelled` | `revoked`),
  `started_at`, `ended_at`, `source` (`webhook` | `manual`).
- New `consultation_credits` table: `github_sponsorship_id`, `user_id` (nullable),
  `kind` (`call` | `scan`), `consultation_tier_id`, `expires_at`, `used_by_booking_id`
  (nullable) and `revoked_at`. One-time `created` inserts 1 call credit with a 60-day expiry.
  For monthly tiers, *my call* is to insert that month's credits lazily on first booking
  attempt or page view in each period, with expiry at period end. That keeps "computed" simple
  and auditable.
- New `github_webhook_events` table, with a unique delivery id, raw payload, processed status
  and error. It mirrors `consultation_stripe_webhook_events`.

### Webhook `POST /github/sponsors/webhook`

1. Verify the HMAC with `GITHUB_SPONSORS_WEBHOOK_SECRET` (in `.secrets/github.env`). Reject
   when it's missing or wrong.
2. Store the event by delivery id. If the event was already processed, return 200.
3. `created`: find the tier by `node_id`. If it's unknown, store it as a donation and do
   nothing else (see Goals). Email Harun only on a real failure: a bad payload or an exception. Otherwise upsert the sponsorship, match the user, and grant the one-time credit.
   Send the invite mail if a public email exists and the sponsor has no account. If they do have
   an account, send a "credits ready, book here" mail.
4. `tier_changed`: update the sponsorship's tier (monthly allowance changes next period).
5. `cancelled`: mark the sponsorship cancelled and void its unused credits. Cancel every
   **future** booking that used its credits, through the existing `BookingWorkflowService`
   cancel path, which removes the Google event and sends `BookingCancelledMail`. Past calls stay
   as they are.
6. Every other action: store it and ignore it.

### Matching on sign-in

After GitHub OAuth login or link (`SocialAuthenticationController`), attach any
`github_sponsorships` and credits with that `github_sponsor_id` and no `user_id` to this user.

### Booking

- `/consultation` (signed-in sponsor with credits): show the credits left and their expiry dates,
  and let the sponsor pick a slot from the existing availability. On submit, consume one matching
  credit in a DB transaction (lock the row), create the booking as `confirmed`, and create the
  calendar event. The awaiting-payment and pay-link steps are gone.
- `/consultation` (no credits, or signed out): show the tiers with "Sponsor on GitHub" buttons
  linking to the tier URLs, the manual-payment note, and "Already sponsored? Sign in with
  GitHub."
- The scan credit is consumed by a short request form, reusing the contact-submission pattern.
  It notifies Harun, who delivers by hand. *My call:* no automation for scans.
- Admin decline or cancel of a credit booking gives the credit back (clear `used_by_booking_id`)
  if it hasn't expired.
- *My call:* client cancel and reschedule keep the existing request → admin-approve flows.
  An approved cancel gives the credit back. A reschedule keeps the same credit, and the new slot
  must still fall within its expiry.

### Admin

- Sponsorships list: status, user, tier, credits and their bookings.
- **Grant manually** (for people paying outside GitHub): enter an email or GitHub login, a tier
  and an expiry. *My call:* a GitHub login is resolved to its numeric id through the public
  GitHub users API when the grant is saved. Only manual grants made by email may attach on sign-in
  through a verified email match. Webhook credits match on GitHub id only.
- **Revoke** (for refunds): runs the same path as `cancelled`.

### Scheduler

Daily: expire unused credits that are past `expires_at`. *My call:* a reminder mail 7 days before
a one-time credit expires.

### `/sponsor-me`

Replace the Stripe amount form with a GitHub Sponsors button and the manual-payment note. Delete
`SponsorCheckoutService`, `SponsorCheckoutController` and the `sponsor.checkout` route.

## Migration of existing Stripe flow

*My call:* remove the Stripe checkout, pay and webhook code paths in the same release. Before
merging, check production for bookings in `awaiting_payment` or with Stripe payments for future
dates. Already-paid bookings (`confirmed`, `paid_reschedule_pending_approval` and similar,
where `stripe_paid_at` is set) keep running as they are. If one of them is cancelled later, Harun
refunds it by hand in the Stripe dashboard, because the refund code is gone. Every unpaid
in-flight booking (`pending_approval`, `awaiting_payment`, `reschedule_proposed`) gets an email
with the new GitHub Sponsors link, and its status becomes `expired`. This runs as a one-off
command, with a dry run first. Keep the Stripe
tables and columns (history), but drop the code that writes to them. Coupons and launch
promotion are removed from the paid flow. Their tables stay.

## Left to the builder

Exact UI layout (reuse the existing consultation page components), mail copy (humanizer rules),
and the admin page structure. Tests: webhook signature, idempotency, each action, matching on
login, credit consumption under concurrency, cancel cascade and expiry.

## Harun must do outside the code

1. Create the 4 tiers in the GitHub Sponsors dashboard (3 one-time, 1 monthly) and write a
   welcome message for each.
2. Add the webhook in the Sponsors dashboard (URL `https://harun.dev/github/sponsors/webhook`,
   with a secret), and put the secret in `.secrets/github.env` and Railway `web`.
3. Send me the tier node IDs, or enter them in admin after deploy.
