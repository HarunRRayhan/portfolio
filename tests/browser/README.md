# Run the browser checks

Install dependencies with `composer install` and `npm ci`, then run:

```sh
npm run build
npm run test:browser
```

The runner creates a temporary SQLite database, migrates it, and adds a throwaway
admin, bookings, and disposable API keys. It starts PHP on an available loopback port and removes its
database and server when the tests finish. It doesn't edit `.env`. Mail uses the
array driver, payment/OAuth credentials are blank, and copied calendar credentials
are removed from the temporary database.

Google Chrome must be installed. To use Playwright's Chromium instead:

```sh
npx playwright install chromium
PLAYWRIGHT_CHANNEL=chromium npm run test:browser
```

Run one flow with `npm run test:browser -- consultation-admin.spec.ts` or
`npm run test:browser -- consultation-availability.spec.ts`. Failure screenshots
and traces go to `reports/browser-results`.

The public tests cover reopening a plan, failed-request recovery, malformed data,
empty availability, and stale responses. The admin tests exercise real backend
validation, retained inputs, error focus, pending states, and save confirmation. They also cover booking search and pagination, alternate dates, cancellation confirmation, scoped API key creation and revocation, and blog search/filter history.
OAuth identity and redirect checks live in `tests/Feature/Auth/AuthSecurityTest.php`
and use fake provider responses rather than real sign-ins.
