# Security hardening (scan 2026-11-03)

Serves: B-001, B-002, B-003, B-004, B-005, B-006, B-007, B-008
Status: draft. Date: 2026-11-03.
Source: `reviews/2026-11-03-scan-security.md`.

## Behaviours

- B-001: WHEN a request carries a valid `CF-Connecting-IP`, THE SYSTEM SHALL use it as `$request->ip()` and ignore any `X-Forwarded-For`.
- B-002: WHEN a request carries no valid `CF-Connecting-IP`, THE SYSTEM SHALL fall back to the connecting address and never to a client-supplied `X-Forwarded-For`.
- B-003: WHEN a visitor posts a valid email to `/subscribe` with a passing Turnstile token, THE SYSTEM SHALL store the address as `pending` (or keep an `unsubscribed` one unsubscribed) and mail a signed confirmation link, and SHALL NOT mark it `subscribed`.
- B-004: WHEN the signed confirmation link is opened, THE SYSTEM SHALL set the subscriber to `subscribed` and show a confirmation page.
- B-005: WHEN the address is already `subscribed`, or the per-email limit (3 per 10 minutes) is hit, THE SYSTEM SHALL return the same success message as for a new address and send no mail.
- B-006: IF the Turnstile token is missing or fails while Turnstile is configured, THEN THE SYSTEM SHALL reject the `/subscribe` request with a field error and store nothing.
- B-007: WHEN the contact form is submitted with the newsletter box ticked, THE SYSTEM SHALL create a `pending` subscriber and mail the same confirmation, not a `subscribed` row.
- B-008: WHEN an admin saves a bio link whose URL does not start with `http://`, `https://`, `/` or `mailto:`, THE SYSTEM SHALL reject it with a field error.

## Design

- **B-001, B-002.** New `App\Http\Middleware\TrustCloudflareClientIp`, prepended globally in `bootstrap/app.php` before `trustProxies` is used. If `CF-Connecting-IP` passes `filter_var(..., FILTER_VALIDATE_IP)`, it sets `REMOTE_ADDR` on `$request->server`. `trustProxies` keeps `at: '*'` but drops `HEADER_X_FORWARDED_FOR`, so the client IP is `REMOTE_ADDR` only. Proto and port headers are unchanged. Without the header (direct origin hit, local, tests) the IP is the proxy address: a shared bucket, never spoofable. See D-001, D-005.
- **B-003 to B-006.** `NewsletterController::subscribe`: verify Turnstile (as `ContactController`), then `RateLimiter::attempt('subscribe:'.sha1($email), 3, ..., 600)`. Inside: `firstOrCreate` with `status = pending` for a new address; an existing `subscribed` address sends nothing (B-005). Mail `SubscribeConfirmationMail` carrying `URL::signedRoute('newsletter.confirm', $subscriber)`. New route `GET /newsletter/confirm/{subscriber}` (`signed`, `throttle:30,1`) calls `NewsletterController::confirm`, which sets `subscribed` and renders the existing flash page or redirects to `/blog` with a success flash. `status` is a free string column, so no migration. Newsletter sends already use the `subscribed` scope, so `pending` rows get no campaigns. Existing rows are untouched.
- **B-007.** `ContactController` uses the same `Subscriber::requestConfirmation($email, $source, $referrer)` helper (one method on the model, used by both controllers, so no third copy).
- **Frontend.** `SubscribeForm.tsx` renders `Turnstile` (same props as `Contact.tsx`), sends `cf-turnstile-response`, disables the button until a token exists when a site key is set, and remounts the widget after each submit. Success toast text changes to "Check your inbox to confirm."
- **B-008.** `BioLinkController` rule: `['required','string','max:2048','regex:#^(https?://|/|mailto:)#i']`.

## Boundaries

- Mail: Laravel Mail to the subscriber's address (queue not needed; matches the contact form). Cloudflare Turnstile `siteverify` through the existing `Turnstile` service. No new external I/O.

## Test approach

- B-001, B-002: `tests/Feature/ClientIpTest.php` hits a test route returning `request()->ip()` with and without `CF-Connecting-IP` and a forged `X-Forwarded-For`.
- B-003 to B-006: update `tests/Feature/SubscriberTest.php` (status `pending`, `Mail::fake()` asserts the signed link, confirm sets `subscribed`, repeat and rate-limit send no mail, Turnstile failure stores nothing via `Http::fake`).
- B-007: `tests/Feature/ContactSubmissionTest.php`.
- B-008: `tests/Feature/Admin/BioLinkTest.php` (accept `https://`, reject `javascript:`).

## Skipped on purpose

- Cloudflare IP-range allow-list for proxies (see D-001: wrong hop). Re-confirming profile email changes, Authenticated Origin Pulls, and `railway` setting changes are out of scope.
