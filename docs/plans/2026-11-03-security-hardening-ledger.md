# Ledger: security hardening

| Task | Status | Commit | Notes |
| --- | --- | --- | --- |
| T-01 | done | 201c44c | |
| T-02 | done-with-concerns | d86444c, 051e267..971f310 | see log |
| T-03 | done-with-concerns | 4efb488, 051e267 | see log |
| T-04 | done | 112f54d | |
| T-05 | done | cb0a72a | |

## Log

### 2026-11-03 start
Branch `security-scan-fixes`, base 80046f0 (main). Ruling: groups A = T-01+T-04, B = T-02+T-03 (same area), T-05 docs by one cheap implementer. Cost if wrong: one reviewer sees two small tasks together.

### 2026-11-03 T-01 and T-04 review round 1
Reviewer (opus): approved, no Critical or Important. Minor: no IPv6 or comma-list test; saved bio links with other schemes (tel:) fail on next edit.
Ruling: keep the D-004 regex, so `//host` is accepted, cost if wrong: an admin could save a protocol-relative external link (admin-only, same trust as https://). Not tightened, I told the user I might; revisit if they want it.
Parked minor: IPv6 and comma-list CF-Connecting-IP tests (tests/Feature/ClientIpTest.php).
Parked minor: check production bio links for non-http(s)/mailto schemes before ship (cannot read the DB).

### 2026-11-03 T-02/T-03 review round 1
Reviewer (opus): not approved. Critical: SubscribeForm used usePage() outside the Inertia tree (popup crash), verified in app.tsx and SubscribeProvider. Fixed in 051e267 (key passed from initial props). Minors fixed in 971f310: lowercase email, 7-day temporary signed link, isolated contact-form failure, pending-skip test.
Ruling: link host comes from the request Host, not fixed, cost if wrong: a spoofed Host cannot yield a valid signature, exposure equals the magic-link mail and depends on D-005.
Ruling: synchronous mail timing reveals whether an address is already subscribed, not fixed, cost if wrong: low-value address enumeration, bounded by Turnstile and rate limits.
Parked minor: admin Resubscribe toggle turns pending into subscribed (app/Http/Controllers/Admin/NewsletterController.php:194).
Parked minor: unused bool return of Subscriber::requestConfirmation.
Concern: no browser check with the real Turnstile widget (no site key in test env). Check on production after deploy.
T-05 docs commit cb0a72a, reviewed in the final review. Fix range 051e267..971f310 reviewed in the final review.

### 2026-11-03 final review
Final reviewer (opus): one Important, legacy mixed-case subscriber rows not matched (Postgres lower()). Fixed in e20bf6d (stored-address mail, whereRaw lower(email)); fresh reviewer approved, no Critical or Important. Converge pass 1: clean (B-001..B-008 each have code and a test; D-001..D-004 confirm commands pass).
Parked minor: confirm link works on GET, mail scanners may confirm; duplicate pending/subscribed rows from legacy data may need one-off cleanup; ASCII strtolower vs Postgres lower(); unindexed lower(email).
Check after deploy: TURNSTILE_SITE_KEY set on Railway web, real Turnstile widget in the popup, production bio links with non-http schemes.
