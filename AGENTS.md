# Project rules

## Secrets and production

- Check `/Users/rayhan/Code/haruns-portfolio/.secrets` before work involving credentials, integrations, or deployment.
- Read secrets only into environment variables. Never print, paste, or commit secret values.
- Use `.secrets/stripe.env` only for isolated Stripe test-mode checks. Use `.secrets/stripe-live.env` for production configuration.
- Never run a live Stripe payment test or use test cards against `https://harun.dev`.
- Production services are `web`, `scheduler`, and shared PostgreSQL. Run migrations through `railway.web.json`'s `preDeployCommand`.
- Railway operations use `RAILWAY_PROJECT_TOKEN` and `RAILWAY_PROJECT_ID` from `/Users/rayhan/Code/haruns-portfolio/.env`; do not request account login when the project token is available.
- Authenticate Railway GraphQL requests with a project token using the `Project-Access-Token` header. `Authorization: Bearer` is for account or workspace tokens.

## Newsletter

- The weekly newsletter runs automatically on Tuesday at 11:00 `America/New_York`. Do not add a `NEWSLETTER_ENABLED` switch. Send only when a post was published in the preceding seven days, and keep one campaign per week.
- Railway service variables override code defaults. Before calling a newsletter release live, check the actual schedule and mail variables on both `web` and `scheduler`, their latest deployment status, and the public image URLs used by the email.

## Consultation behavior

- Persist booking timestamps in UTC. The owner schedule timezone is `Asia/Dhaka` unless explicitly changed in admin settings.
- Public availability is grouped by the visitor-selected timezone. Default the picker to the visitor's browser timezone and show the IANA name with its UTC offset.
- Google Calendar busy periods must block public slots and be checked again during booking validation. Events explicitly marked Free remain available.
- The booking form keeps coupon codes out of the visible UI. Accept coupon links through the `coupon` or `coupon_code` query parameter.
- Company name is optional and must remain nullable for existing bookings.
- The launch promotion is `$100` off for the first `1,001` booking requests. Keep the count in `consultation_booking_promotion_claimed_count` and do not reset it manually.

## Verification

- Run the relevant PHPUnit tests and `npm run build` before shipping.
- Use the `local-verify` skill for real browser checks. Keep browser checks read-only when verifying production.
