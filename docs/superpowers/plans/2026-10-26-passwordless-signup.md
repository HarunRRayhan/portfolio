# Passwordless Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace password auth with Google/GitHub/magic-link (Turnstile-protected) plus optional passkeys, and require an account plus business details to book a consultation.

**Architecture:** A single `/login` "Continue" page serves both signup and login. Magic links are random tokens stored hashed in a new `magic_login_tokens` table, so each link works only once. Every login path, including social, magic link and passkey, finishes through one helper, `App\Support\CompleteLogin`. For a brand-new account, that helper sends the user to a skippable passkey prompt. Passkeys use `spatie/laravel-passkeys` actions behind small JSON controllers, with `@simplewebauthn/browser` in the frontend. `POST /book` moves behind `auth`+`verified`.

**Tech Stack:** Laravel 13, PHP 8.4+, Inertia + React + TS, PHPUnit, Playwright, Resend mail, Cloudflare Turnstile (script tag, no npm), `spatie/laravel-passkeys`, `@simplewebauthn/browser`.

**Spec:** `docs/superpowers/specs/2026-10-26-passwordless-signup-design.md`

## Global Constraints

- No route, controller, page or test may set or check a user-chosen password.
- Magic-link POST: Turnstile is verified server-side **before** any DB write or mail. The response is the same whether or not the email exists.
- Magic link: single-use, expires after **15 minutes**. Rate limits: **5/min per IP** and **3 per 10 min per email**.
- A magic link never promotes a user to admin. Only `SocialAuthenticationController` reads `auth.super_admin_emails`.
- A magic-link click sets `email_verified_at = now()`.
- Secrets `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` go in `.secrets/cloudflare.env(.example)` and `config/services.php` → `services.turnstile.{site_key,secret_key}`. When the secret is missing, the magic-link form is disabled with a notice.
- Tests fake Turnstile with `Http::fake(['challenges.cloudflare.com/*' => ...])`.
- Customer mail never uses `mail.to`. The magic-link mail goes only to the address that was entered.
- All redirect targets go through `LoginRedirectTarget::sanitize()`.
- Booking: `company_name`, `website` (URL), `notes` and `client_name` are required. `role`, `team_size` and `budget` are optional. `client_email` = `$request->user()->email`.
- `consultation_bookings.user_id` → FK `nullOnDelete`.

## Review Focus

1. **A magic link clicked twice, or after 15 min:** the second click gets an "expired or already used" status on `/login` and no session. Pinned in Task 1 (`test_magic_link_is_single_use`, `test_magic_link_expires_after_15_minutes`).
2. **Email in different letter case** (`Foo@X.com` vs stored `foo@x.com`): the user logs into the same account, and no duplicate is created. Pinned in Task 1 (`test_magic_link_matches_existing_user_case_insensitively`).
3. **A guest arriving at `/consultation?sa_ref=…&coupon=…`:** after signup they land back on the same URL with the query intact. Pinned in Task 5 (`test_guest_booking_gate_links_to_login_with_full_redirect`) and Task 1 (`test_magic_link_honours_sanitized_redirect`).
4. **A user whose profile email change left them unverified, posting `/book`:** redirected to verify-email, and no booking is created. Pinned in Task 5 (`test_unverified_user_cannot_book`).
5. **Account deleted while a booking exists:** the booking row survives with `user_id = null`. Pinned in Task 5 (`test_deleting_account_keeps_bookings`).

---

### Task 1: Magic-link signup/login with Turnstile

**Files:**
- Create: `database/migrations/2026_10_26_000001_create_magic_login_tokens_table.php`
- Create: `app/Models/MagicLoginToken.php`
- Create: `app/Services/Turnstile.php`
- Create: `app/Support/CompleteLogin.php`
- Create: `app/Http/Controllers/Auth/MagicLinkController.php`
- Create: `app/Mail/MagicLoginLinkMail.php`, `resources/views/emails/auth/magic-link.blade.php` (markdown, same style as `emails/consultation/*`)
- Modify: `routes/auth.php`, `config/services.php`, `.secrets/cloudflare.env.example`, `app/Http/Middleware/HandleInertiaRequests.php` (share `turnstileSiteKey`)
- Test: `tests/Feature/Auth/MagicLinkTest.php`

**Interfaces:**
- Produces:
  - Table `magic_login_tokens`: `id`, `email` (string, lowercased), `token_hash` (string(64), unique), `redirect_to` (nullable string), `expires_at`, `used_at` (nullable), timestamps.
  - `Turnstile::verify(?string $token, ?string $ip): bool` posts to `https://challenges.cloudflare.com/turnstile/v0/siteverify` and returns `false` when the secret is not configured.
  - `Turnstile::enabled(): bool`
  - `CompleteLogin::redirect(Request $request, User $user, bool $created, ?string $redirectTo): RedirectResponse`. It calls `Auth::login($user, true)` and regenerates the session. If `$created`, it puts `passkey_prompt.redirect_to` in the session and redirects to `route('passkeys.prompt')`. Otherwise it redirects to the sanitized `$redirectTo`, or to `dashboard` for admins and `blog.index` for everyone else.
  - Routes (guest group): `POST /login/magic-link` → `magic-link.send` (throttled), and `GET /login/magic/{token}` → `magic-link.consume`.
- Task 4 defines the route name `passkeys.prompt`. Until then, register a stub route with that name that redirects to the session target, so this task's tests pass on their own.

- [ ] **Step 1: Write the failing tests** in `MagicLinkTest`:
  - `test_send_requires_valid_turnstile`: fake siteverify `{"success":false}`. POST returns a session error on `email`, `Mail::assertNothingQueued()`, and the token count is 0.
  - `test_send_queues_mail_and_stores_hashed_token`: success fake. `MagicLoginLinkMail` is queued to `new@example.com`. One row with `strlen(token_hash) === 64`, and `expires_at` equals now+15m (use `travelTo`).
  - `test_send_response_is_identical_for_known_and_unknown_email`: the redirect and the flashed status match for both.
  - `test_send_is_rate_limited_per_email`: the 4th POST within 10 min for the same email queues no new mail.
  - `test_magic_link_creates_verified_commenter`: consume creates a user with `role === 'commenter'`, non-null `email_verified_at` and the name set to the local part of the email, is authenticated, and is redirected to `route('passkeys.prompt')`.
  - `test_magic_link_logs_in_existing_user_without_prompt_and_verifies`: an existing unverified user is verified after consume and redirected to `blog.index`.
  - `test_magic_link_never_promotes_admin`: with `auth.super_admin_emails = ['boss@x.com']`, the new user's role is `commenter`.
  - `test_magic_link_is_single_use`, `test_magic_link_expires_after_15_minutes`, `test_magic_link_matches_existing_user_case_insensitively`, `test_magic_link_honours_sanitized_redirect` (`/consultation?sa_ref=abc` is kept, `https://evil.test` is dropped).
  - `test_send_disabled_when_turnstile_not_configured`: with an empty secret, the POST returns an error and no mail is sent.

- [ ] **Step 2: Run** `php artisan test --filter=MagicLinkTest`. Expected: FAIL (route not defined).

- [ ] **Step 3: Implement** the migration, model, `Turnstile`, `CompleteLogin`, controller, mail, routes and config.
  - `send` validates `email` (`required|email:rfc|max:255`), `cf-turnstile-response` and an optional `redirect`.
  - It returns `back()->with('status', 'Check your inbox for a sign-in link. It expires in 15 minutes.')` in both the known-email and unknown-email cases.
  - `consume` looks up by `hash('sha256', $token)` with `used_at` null and `expires_at > now()` inside a transaction with `lockForUpdate`, then sets `used_at`.
  - Per-email limiting: `RateLimiter::attempt('magic-link:'.sha1($email), 3, ..., 600)`. On a hit, skip the mail silently and keep the same response.
  - Add a `MagicLoginToken::prune()` style cleanup only if one already exists for similar tables. Otherwise skip it.

- [ ] **Step 4: Run** `php artisan test --filter=MagicLinkTest`. Expected: PASS.

- [ ] **Step 5: Commit** with the message `Auth: magic-link signup/login with Cloudflare Turnstile`.

### Task 2: Remove password auth; social login uses CompleteLogin

**Files:**
- Delete: `app/Http/Controllers/Auth/{RegisteredUserController,ConfirmablePasswordController,NewPasswordController,PasswordController,PasswordResetLinkController}.php`, `app/Http/Requests/Auth/LoginRequest.php` (if it exists), `resources/js/Pages/Auth/{Register,ConfirmPassword,ForgotPassword,ResetPassword}.tsx`, `resources/js/Pages/Profile/Partials/UpdatePasswordForm.tsx`, `tests/Feature/Auth/{RegistrationTest,PasswordConfirmationTest,PasswordResetTest,PasswordUpdateTest}.php`
- Modify:
  - `routes/auth.php`: remove `POST login`, the register, password and confirm-password routes. `GET register` → 301 to `/login`, keeping the query string.
  - `AuthenticatedSessionController`: keep `create` (renders `Auth/Login` with `status`, `redirect`, `turnstileEnabled`) and `destroy`, and delete `store`.
  - `SocialAuthenticationController`: finish through `CompleteLogin::redirect($request, $user, $user->wasRecentlyCreated, ...)`. Change the error copy to: "An account already uses this email. Sign in with an email link or its original provider. Social sign-in cannot link it automatically."
  - `ProfileController::destroy`: validate `confirm_email` as required and equal to `$request->user()->email`, compared case-insensitively.
  - `resources/js/Pages/Profile/Edit.tsx`, `Partials/DeleteUserForm.tsx`.
  - Any `route('password.*')` / `route('register')` usage in TSX (grep for it).
  - `tests/Feature/Auth/{AuthenticationTest,AuthSecurityTest}.php`, `tests/Feature/ProfileTest.php`, `tests/Feature/SocialLoginTest.php`.
  - `tests/browser/seed.php` and the browser specs that log in.
- Create: `tests/browser/login-link.php` (CLI, same `BROWSER_TEST_RUN` + temp-DB guard as `seed.php`). It takes an email argument, inserts a `MagicLoginToken` and prints the consume URL. Also create `tests/browser/login.ts`, which exports `loginAs(page, email)`. That function runs the script through `execFileSync('php', [...])`, inheriting `process.env`, and then calls `page.goto(url)`.

**Interfaces:**
- Consumes: `CompleteLogin::redirect`, `MagicLoginToken` (Task 1).
- Produces: `loginAs(page: Page, email: string): Promise<void>` for browser specs.

- [ ] **Step 1: Update tests first.**
  - `AuthenticationTest`: `test_login_screen_renders`, `test_password_login_route_is_gone` (`POST /login` → 405), `test_register_redirects_to_login`, `test_password_reset_routes_are_gone` (`/forgot-password` → 404).
  - In `AuthSecurityTest`: drop the password-login cases and keep the redirect-safety cases by moving them onto the magic-link consume route.
  - Change `test_google_cannot_merge_into_an_existing_password_account` to `..._existing_account`.
  - Remove `/confirm-password` from `postAuthenticationRoutes`.
  - `ProfileTest`: deletion requires `confirm_email` and the wrong email is rejected.
  - `SocialLoginTest`: a new social user is redirected to `passkeys.prompt`, and a returning user goes to the redirect target.

- [ ] **Step 2: Run** `php artisan test --filter='AuthenticationTest|AuthSecurityTest|ProfileTest|SocialLoginTest'`. Expected: FAIL.

- [ ] **Step 3: Implement** the deletions and modifications listed above. Replace the password step in each browser spec with `await loginAs(page, 'browser-admin@example.test')`. In `seed.php`, keep the user but use `Str::random(64)` as the password.

- [ ] **Step 4: Run** `php artisan test` (full suite) and `npm run build`. Expected: all pass, no TS errors.

- [ ] **Step 5: Commit** with the message `Auth: remove password register/login/reset; social login finishes via CompleteLogin`.

### Task 3: Continue page (frontend)

**Files:**
- Modify: `resources/js/Pages/Auth/Login.tsx` (rewrite)
- Create: `resources/js/Components/Turnstile.tsx`
- Modify: `resources/js/Components/SocialLoginButtons.tsx` (pass `redirect` through, if it doesn't already)
- Test: `tests/browser/public-accessibility.spec.ts` (add a case)

**Interfaces:**
- Consumes: props `status?: string`, `redirect?: string`, `turnstileEnabled: boolean`; shared prop `turnstileSiteKey: string | null` (Task 1/2).
- Produces: `<Turnstile siteKey={string} onToken={(t: string) => void} />`. It injects `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` once and renders explicitly.

- [ ] **Step 1: Write the failing browser test** `continue page offers google, github, email link and passkey`. It asserts that these are visible: the buttons named `Continue with Google`, `Continue with GitHub`, `Email me a sign-in link` and `Sign in with passkey`, plus the textbox `Email`. It also asserts that there is no `Password` label. (The passkey button is wired in Task 4; render it disabled here.)

- [ ] **Step 2: Run** `npm run test:browser -- public-accessibility`. Expected: FAIL.

- [ ] **Step 3: Implement** the page.
  - Order: heading "Continue to harun.dev", the social buttons, a divider, the email form (email + Turnstile + submit, posts to `magic-link.send` with `redirect`), then the passkey button.
  - Copy under the heading: "New here? Any option creates your account."
  - When `turnstileEnabled` is false, disable the submit button and show "Email sign-in is temporarily unavailable."
  - Use `GuestLayout`, `TextInput`, `PrimaryButton` and `InputError`.

- [ ] **Step 4: Run** the browser test and `npm run build`. Expected: PASS.

- [ ] **Step 5: Commit** with the message `Auth: single Continue page (Google, GitHub, email link, passkey)`.

### Task 4: Passkeys (register, login, manage, post-signup prompt)

**Files:**
- `composer require spatie/laravel-passkeys`; `npm i @simplewebauthn/browser`. Publish and run the passkeys migration.
- Modify: `app/Models/User.php` (implement `HasPasskeys`, use `InteractsWithPasskeys`), `config/passkeys.php` (relying party id = host of `config('app.url')`, name `harun.dev`).
- Create: `app/Http/Controllers/Auth/PasskeyController.php`
- Create: `resources/js/Pages/Auth/PasskeyPrompt.tsx`, `resources/js/Pages/Profile/Partials/PasskeysSection.tsx`, `resources/js/lib/passkeys.ts`
- Modify: `routes/auth.php` (replace the Task 1 stub), `resources/js/Pages/Auth/Login.tsx` (enable the button), `resources/js/Pages/Profile/Edit.tsx`, `app/Http/Controllers/ProfileController.php` (`edit` passes `passkeys: [{id, name, created_at, last_used_at}]`)
- Test: `tests/Feature/Auth/PasskeyTest.php`

**Interfaces:**
- Consumes: `CompleteLogin::redirect` (Task 1).
- Produces (routes):
  - auth: `GET /passkeys/prompt` → `passkeys.prompt` (renders `Auth/PasskeyPrompt` with `next`), `POST /passkeys/prompt/skip` → `passkeys.skip` (pulls `passkey_prompt.redirect_to` and redirects), `GET /passkeys/register-options` → `passkeys.register-options` (JSON), `POST /passkeys` → `passkeys.store` (`name`, `passkey` JSON), `DELETE /passkeys/{passkey}` → `passkeys.destroy` (owner only, 404 otherwise).
  - guest: `GET /passkeys/login-options` → `passkeys.login-options` (JSON), `POST /passkeys/login` → `passkeys.login` (`answer` JSON plus an optional `redirect`; uses `CompleteLogin::redirect($request, $user, false, $redirect)`).
- Spatie actions to use (check the names in `vendor/spatie/laravel-passkeys/src/Actions` before relying on them): `GeneratePasskeyRegisterOptionsAction`, `StorePasskeyAction`, `GeneratePasskeyAuthenticationOptionsAction`, `FindPasskeyToAuthenticateAction`. Store the generated options in the session between the two calls, as the package's own Livewire component does.
- `resources/js/lib/passkeys.ts` exports `registerPasskey(name: string): Promise<void>` and `loginWithPasskey(redirect?: string): Promise<void>`, both using `startRegistration`/`startAuthentication` from `@simplewebauthn/browser`.

- [ ] **Step 1: Write the failing tests:**
  - `test_prompt_requires_auth`
  - `test_skip_returns_to_stored_redirect`
  - `test_register_options_returns_challenge_for_rp_host` (JSON `rp.id` equals the host of `app.url`)
  - `test_user_cannot_delete_another_users_passkey` (404)
  - `test_user_can_delete_own_passkey` (create the row directly)
  - `test_login_options_available_to_guests`
  - `test_passkey_login_rejects_garbage_answer` (422 or a redirect with an error, no auth)
  - Full WebAuthn ceremony verification is left to the package's own tests. Do not mock CBOR.

- [ ] **Step 2: Run** `php artisan test --filter=PasskeyTest`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - The prompt page reads: "Add a passkey so next time you can sign in with Face ID, Touch ID or your device PIN. Optional." It has two buttons, `Add a passkey` and `Skip for now`. On success it posts skip to continue.
  - The profile section lists passkeys and has add and delete.
  - Login button: `loginWithPasskey(redirect)`. On error, show inline "Passkey sign-in failed. Try another option."

- [ ] **Step 4: Run** `php artisan test` and `npm run build`. Expected: PASS. Manually check the ceremony with `local-verify` on `localhost`, using Chrome's virtual authenticator.

- [ ] **Step 5: Commit** with the message `Auth: optional passkeys (post-signup prompt, profile management, passkey login)`.

### Task 5: Account-gated booking with business details

**Files:**
- Create: `database/migrations/2026_10_26_000002_add_account_fields_to_consultation_bookings.php` (`user_id` foreignId nullable `nullOnDelete`; nullable strings `website` (2048), `role` (120), `team_size` (40), `budget` (60))
- Modify: `app/Models/ConsultationBooking.php` (fillable plus a `user()` belongsTo), `routes/web.php` (`POST /book` adds `auth`, `verified` to the existing middleware)
- Modify: `app/Http/Controllers/Consultation/BookController.php`
  - `store` uses the new validation and the user's email.
  - `show` passes `bookingUser: {name} | null` and `loginUrl` = `route('login', ['redirect' => $request->getRequestUri()])`.
- Modify: `app/Services/Consultation/BookingWorkflowService.php`. `requestBooking` takes a new trailing param `array $details = []` with keys `user_id|website|role|team_size|budget`, which are merged into `ConsultationBooking::create`. Add `Website: …` to the calendar hold description when it is present.
- Modify: `resources/js/Pages/Book.tsx`
  - Guest: replace the booking form block with a card that reads "Sign up to book. It takes a few seconds with Google, GitHub or an email link." with a link to `loginUrl`. Show it before tier, slot or coupon selection.
  - Authed: remove the `client_email` input. Prefill `client_name` from `bookingUser.name` (empty for magic-link users, whose name equals the email local part, so prefill only when `name` contains a space or differs from the email local part). Add the fields Company name\*, Website\*, What do you need help with?\* (`notes`), and Role, Team size and Budget (optional selects or inputs).
- Modify: `resources/js/Pages/Admin/Consultations/Bookings/Show.tsx` and `app/Http/Controllers/Admin/Consultation/BookingController.php` (show website, role, team size and budget when present)
- Test: `tests/Feature/ConsultationBookingTest.php`, `tests/Feature/BookPageTest.php`, `tests/Feature/ProfileTest.php`, plus the browser specs that book (`consultation-*.spec.ts`, using `loginAs`)

**Interfaces:**
- Consumes: `loginAs` (Task 2), the `login` route with `redirect` (Task 3).
- Produces: `requestBooking(ConsultationTier, string $name, string $email, ?string $notes, Carbon, ?ConsultationCoupon = null, ?string $companyName = null, ?string $saRef = null, array $details = [])`.

- [ ] **Step 1: Write the failing tests:**
  - `test_guest_cannot_book` (POST `/book` redirects to `/login`, 0 bookings)
  - `test_unverified_user_cannot_book`
  - `test_booking_requires_company_website_and_needs` (errors on `company_name`, `website` and `notes`)
  - `test_booking_uses_account_email_and_stores_details` (the posted `client_email=x@evil.test` is ignored, the row's `client_email` equals the user's email, and `user_id`, `website`, `role`, `team_size` and `budget` are saved)
  - `test_guest_booking_gate_links_to_login_with_full_redirect` (GET `/consultation?sa_ref=abc&coupon=X` as a guest, Inertia prop `loginUrl` contains `redirect=%2Fconsultation%3Fsa_ref%3Dabc%26coupon%3DX`)
  - `test_deleting_account_keeps_bookings`
  - Update the existing `/book` posts in `ConsultationBookingTest` to use `actingAs` a verified user plus the new required fields.

- [ ] **Step 2: Run** `php artisan test --filter='ConsultationBookingTest|BookPageTest|ProfileTest'`. Expected: FAIL.

- [ ] **Step 3: Implement** everything listed above.

- [ ] **Step 4: Run** `php artisan test`, `npm run build`, and `npm run test:browser`. Expected: all PASS.

- [ ] **Step 5: Commit** with the message `Consultation: require an account to book and collect company, website and needs`.

### Task 6: Ship

- [ ] Add one line to `CLAUDE.md` under Infra: "Auth is passwordless (Google, GitHub, Turnstile-gated magic link, optional passkeys). Turnstile keys are in `.secrets/cloudflare.env`, and the passkey RP ID is the host of `APP_URL`."
- [ ] Before merge, ask Harun to set `TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` on the Railway `web` service. If they're missing, email sign-in shows as unavailable, but Google and GitHub still work.
- [ ] Open a PR, self-review the diff, get CI green, merge, and confirm the "Build and Sync Assets to R2" deploy.
