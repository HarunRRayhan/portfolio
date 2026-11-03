# Security hardening plan

Goal: fix the findings of `reviews/2026-11-03-scan-security.md` that are code: spoofable client IP, unconfirmed newsletter signup, unrestricted bio-link URLs. Record the backup and origin items as open questions.
Spec: `docs/tech-spec/security-hardening.md` (B-001 to B-008). Decisions: D-001 to D-006.

## Global Constraints

- Laravel 11, PHPUnit, Inertia/React. No new dependency, no migration (`subscribers.status` is a free string).
- `status` values: `pending`, `subscribed`, `unsubscribed`. Only the confirm route sets `subscribed` for a new or pending address.
- Tests use `Mail::fake()` and `Http::fake()`; never weaken an existing test, update it only where D-002 changes the behaviour.
- Run `vendor/bin/phpunit` for PHP and `npm run build` for the frontend. Do not push; the controller ships.
- User go-ahead on 2026-11-03 covers plan approval.

## Review Focus

- B-001/B-002: the client IP must never come from `X-Forwarded-For`; check `trustProxies` headers and middleware order (must run before the throttle middleware reads `ip()`).
- B-003 to B-005: no path sets `subscribed` without the signed link; same response for existing/limited addresses; unsubscribed owners are not re-opted-in by a stranger.

## Tasks

### T-01 Client IP from `CF-Connecting-IP`
Covers: B-001, B-002
Files: create `app/Http/Middleware/TrustCloudflareClientIp.php`, `tests/Feature/ClientIpTest.php`; modify `bootstrap/app.php`.
Produces: middleware class `App\Http\Middleware\TrustCloudflareClientIp` (sets `REMOTE_ADDR` from a valid `CF-Connecting-IP`), prepended globally; `trustProxies` without `HEADER_X_FORWARDED_FOR`.
Tests: with header -> that IP; forged `X-Forwarded-For` alone -> not that IP; invalid header value -> ignored; throttle keyed on the real IP.
Commit: `Take client IP from CF-Connecting-IP, ignore X-Forwarded-For`

### T-02 Double opt-in for `/subscribe` and the contact checkbox
Covers: B-003, B-004, B-005, B-006, B-007
Files: modify `app/Http/Controllers/NewsletterController.php`, `app/Http/Controllers/ContactController.php`, `app/Models/Subscriber.php`, `routes/web.php`; create `app/Mail/SubscribeConfirmationMail.php` and its view; modify `tests/Feature/SubscriberTest.php`, `tests/Feature/ContactSubmissionTest.php`.
Produces: `Subscriber::requestConfirmation(string $email, ?string $source, ?string $referrer): bool` (true when a mail was sent); route `newsletter.confirm` (`GET /newsletter/confirm/{subscriber}`, `signed`, `throttle:30,1`); `NewsletterController::confirm`.
Tests: new address -> `pending` + mail with signed link, no `subscribed`; confirm link -> `subscribed`; unsigned/tampered link -> 403; already `subscribed` -> no mail, same flash; `unsubscribed` stays so until confirm; 4th request in 10 min -> no mail, same flash; Turnstile failure (Turnstile configured, `Http::fake` false) -> error, no row; contact box ticked -> `pending` + mail.
Commit: `Require email confirmation for newsletter signup`

### T-03 Turnstile on the subscribe form
Covers: B-006 (UI), B-003 (copy)
Files: modify `resources/js/Components/SubscribeForm.tsx`.
Consumes: `Turnstile` component and the `turnstileSiteKey` shared prop, as in `resources/js/Pages/Contact.tsx`; T-02 expects the field `cf-turnstile-response`.
Tests: `npm run build` passes; existing frontend tests pass; success toast reads "Check your inbox to confirm."
Commit: `Add Turnstile to the subscribe form`

### T-04 Bio-link URL scheme check
Covers: B-008
Files: modify `app/Http/Controllers/Admin/BioLinkController.php`; create `tests/Feature/Admin/BioLinkTest.php`.
Tests: `https://x.example`, `/bio`, `mailto:a@b.c` accepted; `javascript:alert(1)` and `data:text/html,x` rejected on store and update.
Commit: `Restrict bio link URLs to http, https, relative and mailto`

### T-05 Open questions and doc drift
Covers: D-005, D-006 (no behaviour)
Files: modify `docs/OPERATIONS.md` (add "Open questions": D-005, D-006), `AGENTS.md` (append `## RayStack dev flow`), `reviews/2026-11-03-infra-review.md` (correct: `railway.web.json` and `railway.scheduler.json` exist).
Commit: `Document open infra questions and the dev flow`

## Analyze

| Check | Result | Note |
| --- | --- | --- |
| Every B-ID maps to a task | clean | B-001/2 T-01; B-003/4/5/6/7 T-02; B-006/3 UI T-03; B-008 T-04 |
| Every task covers a B-ID | clean | T-05 covers decisions D-005/D-006 only; kept because the user asked for the documented open question |
| No open clarification or dependent `Open` row | clean | D-005, D-006 are Open by user decision and the slice does not depend on them |
| Gates | clean | one model helper shared by two controllers; no new layer |
| Produce/consume names match | clean | `cf-turnstile-response`, `newsletter.confirm`, `requestConfirmation` |
