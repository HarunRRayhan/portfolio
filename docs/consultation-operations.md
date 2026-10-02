# Paid consultation operations

The consultation flow uses the shared PostgreSQL database for booking state,
Stripe checkout attempts, Google operation retries, and email notifications.
The web release runs migrations. The scheduler service runs the recurring
commands from `routes/console.php`.

## Required settings

Set these variables in Railway for `web` and `scheduler`:

- `STRIPE_KEY`
- `STRIPE_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `CONSULTATION_GOOGLE_CLIENT_ID`
- `CONSULTATION_GOOGLE_CLIENT_SECRET`
- `CONSULTATION_GOOGLE_REDIRECT_URI=https://harun.dev/admin/consultations/google/callback`
- `CONSULTATION_GOOGLE_CALENDAR_ID=primary`
- `MAIL_MAILER=resend`
- `RESEND_API_KEY`
- `MAIL_FROM_ADDRESS`
- `MAIL_TO_ADDRESS` (owner inbox only; see Mail below)
- `APP_KEY`
- `QUEUE_CONNECTION=database`
- `DB_QUEUE_RETRY_AFTER=180`
- `RAILPACK_SKIP_MIGRATIONS=true` on both services

`APP_KEY` must be identical on `web` and `scheduler`. Notification and checkout
retry payloads are encrypted with it.

## Mail

Production mail goes out through Resend. `MAIL_TO_ADDRESS` is the owner inbox
for consultation admin alerts and the contact form. Application code reads it
from `config('mail.owner')`. There is no `mail.to` entry. Adding one makes
Laravel rewrite every outgoing recipient to that inbox, including customer
mail, and `Mail::fake()` will not show the rewrite.

Customer messages use the booking email. Approve and decline can attach
`client_message`. That text is stored on the booking and sent in the same web
request, immediately after the greeting. `admin_note` stays on the admin
screen, directly under Approve and Decline, and is omitted from customer mail.
The scheduler command `consultations:retry-notifications` only retries a send
that did not succeed in the request.

The header image is `https://cdn.harun.dev/images/brand/harun-logo-full-email.png`.
Leave the `logo` class off that image. Laravel's default mail stylesheet sizes
`.logo` to 75×75. The weekly newsletter keeps the uncropped
`harun-logo-wordmark-email.png`.

Confirm a customer send in Resend: the recipient is the booker's address and
`last_event` is `delivered`. The owner inbox is not a second copy of that
message.

## Stripe

Create a webhook endpoint at:

```text
https://harun.dev/stripe/webhook
```

Subscribe to `checkout.session.completed` and
`checkout.session.async_payment_succeeded`, and
`checkout.session.async_payment_failed`. Copy the endpoint signing secret to
`STRIPE_WEBHOOK_SECRET`. The webhook ledger is idempotent, and the scheduler
also reconciles sessions that Stripe delivered while the app was unavailable.

The refund-recovery backfill only marks paid `cancel_requested` bookings and
legacy `cancelled` bookings that have a persisted `cancel_approved` event.
Ordinary cancellation requests are deliberately left for an administrator to
approve.

## Google Calendar

Add the callback URL to the OAuth client, deploy the variables, then open
`/admin/consultations/availability` while signed in as an admin. Connect Google
Calendar there and choose the availability windows. Failed Calendar and Meet
operations remain in the database and are retried by the scheduler.

Public slots use the visitor's selected timezone for display. The picker starts
with the browser timezone and shows both its IANA name and UTC offset. Stored
booking timestamps remain UTC. Google Calendar busy periods block slots; events
marked Free do not.

The booking form accepts coupon links through the `coupon` or `coupon_code` URL
parameter and does not show a coupon input. Company name is optional.

## Checks

After deploy, run these commands against the production release if needed:

```bash
php artisan migrate:status
php artisan consultations:reconcile-stripe
php artisan consultations:retry-google
php artisan consultations:retry-notifications
php artisan consultations:retry-refunds
php artisan consultations:audit-refunds
php artisan consultations:retry-stripe-webhooks
php artisan consultations:expire
```

To force one stored webhook through the handler again, run
`php artisan consultations:replay-stripe-webhook EVENT_ID`.

`consultations:audit-refunds` lists paid cancellations with a refund timestamp
but no Stripe refund ID. Check those records in Stripe before retrying them.

## Launch promotion

The first 1,001 public booking requests receive $100 off the list price. Why
1,001? Because 1,000 was too obvious. Valid percentage coupons apply after
that discount. The migration creates
the `consultation_booking_promotion_claimed_count` setting; don't reset it
manually while the promotion is running.

The scheduler service should run continuously with
`php artisan schedule:run --no-interaction`. Production has no queue-worker
service. Consultation retries run there, and approve or decline mail is sent
by the web request. `railway.worker.json` is not attached to a Railway service.
