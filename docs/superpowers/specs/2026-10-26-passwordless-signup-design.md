# Passwordless signup (Google, GitHub, magic link, passkeys)

## Intent

harun.dev needs an account system to filter out junk signups and junk consultation requests.
An account lets someone do two things: comment on blog posts and book a consultation.
Reading stays public. There are no passwords anywhere.

## Decided by Harun

- Signup methods: **Google**, **GitHub**, **email magic link**. Nothing else.
- **No email/password** register or login, anywhere.
- The magic-link form is protected by **Cloudflare Turnstile**.
- After signup, the site **recommends adding a passkey**. This is optional and can be skipped.
- **One "Continue" page handles both signup and login.** The first use of a method creates the
  account, and later uses log in. Once a passkey exists, "Sign in with passkey" works as a fourth
  login method right away.
- Commenting already requires login and stays that way.
- **Booking requires an account.** A guest on `/consultation` is asked to sign up, comes back to
  the same page, fills in the business details, picks a time, and books.
- The business form shows **only on the consultation page**, never during signup.
- Required fields: company name, website, and "what do you need help with".
  Optional fields: role, team size, budget.

## Current state (verified in code)

- Breeze auth (`routes/auth.php`): register, login, forgot/reset/confirm/update password, email
  verification.
- `SocialAuthenticationController` already supports Google and GitHub. It creates `commenter`
  users with a random password and promotes `config('auth.super_admin_emails')` to `admin`. It
  refuses to link an existing account by email alone.
- `POST /blog/{slug}/comments` uses the `auth` middleware.
- `GET /consultation` (`BookController::show`) and `POST /book` (`BookController::store`) are open
  to guests. `store` validates `client_name`, `client_email`, an optional `company_name`, and
  `notes`, then calls `BookingWorkflowService::requestBooking(...)`.
- `LoginRedirectTarget::sanitize()` already validates same-origin redirect targets, including
  path and query.
- `ProfileController::destroy` asks for the current password before deleting an account.
- The repo has no CSP header and no Turnstile code.

## Goals

1. `/login` becomes the single Continue page. It offers Google, GitHub, an email field with
   Turnstile that sends a magic link, and "Sign in with passkey".
2. All password routes, controllers, pages, and tests are removed: register, login POST,
   forgot/reset/confirm/update password, and `UpdatePasswordForm`. `/register` redirects to
   `/login`.
3. Magic link: a POST with the email and a Turnstile token. The server verifies the token with
   Cloudflare `siteverify` before doing anything. It sends a signed, **single-use** link that
   expires after **15 minutes**. Clicking the link logs in the existing user with that email, or
   creates a `commenter` with `email_verified_at = now()`. The response is the same whether or not
   the email already has an account, so the form can't be used to check who has one. The route is
   rate-limited per IP and per email.
4. Passkeys: register, log in, list, and delete. A user can have more than one.
   - After **first** account creation by any method, the user lands on an interstitial with
     "Add a passkey" and "Skip". Both continue to the original redirect target.
   - The profile page gets a Passkeys section with add, list (name and created date), and delete.
5. Booking:
   - A guest sees the consultation page (tiers, prices, copy) but the booking form is replaced by
     "Sign up to book" **before** they choose a tier, slot or coupon (Harun: sign up first, then come
     back and fill in details and pick a time). The link goes to
     `/login?redirect=<current URL incl. query>`, so the existing URL params (`sa_ref`, `coupon`)
     survive. No tier/slot state needs restoring.
   - `POST /book` requires `auth` + `verified`. `client_email` comes from the logged-in user and is
     no longer a request field. `client_name` stays a required form field, prefilled from the
     user's name (magic-link users have no name, so it starts empty for them).
   - New validation: `company_name` required, `website` required (URL), `notes` required (labelled
     "What do you need help with?"), and optional `role`, `team_size`, and `budget`.
   - New nullable columns on `consultation_bookings`: `user_id` (FK, `nullOnDelete` so deleting an
     account never deletes booking or payment records), `website`, `role`,
     `team_size`, `budget`. The admin booking show page displays them.
6. Account deletion no longer asks for a password (see the calls below).

## Non-goals

- Making passkeys mandatory or removing other login methods.
- Collecting business details at signup.
- Changing who can read posts, or anything in the admin area apart from showing the new booking
  fields.
- Back-filling `user_id` on existing bookings.

## Anti-goals (failure even if it "works")

- Any path that sets or checks a user-chosen password.
- A magic-link endpoint that sends mail without a valid Turnstile token, or that reveals whether
  an email is registered.
- Losing the `redirect` target or `sa_ref` on the trip from `/consultation` to signup and back.
- A booking created by a guest or an unverified user.

## Constraints

- Laravel 13, PHP 8.4+, Inertia + React + TypeScript. Mail goes through Resend (existing).
- Secrets: `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` go in
  `.secrets/cloudflare.env(.example)`. The site key is passed to the frontend as an Inertia prop.
  When the secret is missing, the magic-link form is disabled with a notice, the same way
  social providers handle missing config.
- In tests, fake Turnstile with `Http::fake`. Don't call Cloudflare.
- WebAuthn RP ID is the host of `config('app.url')` (`harun.dev` in production). Passkeys created
  locally won't work in production, which is expected.
- Customer mail rules in `AGENTS.md` / `CLAUDE.md` still apply. The magic-link mail goes to the
  user and never uses `mail.to`.

## Calls I made (Claude's, not Harun's)

- **Required vs optional fields:** company, website, and need are required. Role, team size, and
  budget are optional.
- **Magic link never promotes to admin.** Only the existing Google/GitHub path checks
  `super_admin_emails`. A magic link to an existing admin's email still logs into that admin
  account, because the role is already stored.
- **Social account linking rule unchanged:** a matching email alone never links a social identity
  to an existing account. The error message changes to "sign in with your email link or original
  provider" because the password recovery it mentioned is gone.
- **A magic-link click verifies the email** (`email_verified_at = now()` for existing users too).
  Breeze's verify-email routes/pages stay, because changing the email in the profile still clears
  verification.
- **Booking name:** `client_name` is a required field prefilled from the account (see Goal 5).
- **Deleting an account keeps its bookings** (`user_id` set to null).
- **The `users.password` column stays.** New users get a random value, as social signup does
  today. No schema change is needed.
- **Account deletion confirmation:** the user types their email address instead of a password.
- **Passkey library:** the builder chooses between `spatie/laravel-passkeys` (stable 1.x, built
  for Livewire but with reusable actions) and `laravel/passkeys` (first party, 0.x). Lean towards
  whichever works more cleanly with Inertia JSON endpoints. Frontend: `@simplewebauthn/browser`
  if the chosen package doesn't ship its own client.

## Left to the builder

- Visual design of the Continue page, the passkey interstitial, and the booking form, using
  existing components and styles.
- How single use is enforced for magic-link tokens (hashed token table, or cache key consumed on
  use).
- Exact rate-limit numbers. Start around 5/min per IP and 3/10 min per email.
- How passkey login is shown (a button, optionally with conditional-UI autofill).
- Test layout: replace the deleted password tests, extend `SocialLoginTest`, `BookPageTest`, and
  `ConsultationBookingTest`, and add tests for the magic link and passkeys.
