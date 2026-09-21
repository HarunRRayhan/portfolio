# Weekly newsletter operations

The newsletter is a digest of the latest published blog posts. It does not
call an AI provider. The command takes up to three new posts, builds the email,
and sends it to rows whose `status` is `subscribed`.

## How it runs

`railway.scheduler.json` already keeps Laravel's scheduler alive:

```text
php artisan schedule:run --no-interaction
```

`routes/console.php` registers `newsletter:send-weekly` for Monday at 09:00 in
`Asia/Dhaka`. The day, time, timezone, and maximum post count are configurable:

```dotenv
NEWSLETTER_ENABLED=true
NEWSLETTER_MAX_POSTS=3
NEWSLETTER_SEND_DAY=1
NEWSLETTER_SEND_TIME=09:00
NEWSLETTER_TIMEZONE=Asia/Dhaka
```

Set `NEWSLETTER_ENABLED=true` only after the mail provider is configured. The
command refuses to send with Laravel's `log` or `array` mailer outside tests.
Production should use Resend:

```dotenv
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=newsletter@your-verified-domain.example
MAIL_FROM_NAME="Harun R. Rayhan"
RESEND_API_KEY=...
```

Set the same database, app key, mail, and newsletter variables on both the
Railway `web` and `scheduler` services. The scheduler needs the database to
read subscribers and record campaign deliveries.

## Check before enabling

Preview the next campaign without writing records or sending email:

```bash
php artisan newsletter:send-weekly --dry-run
```

Run the scheduler list to confirm the weekly entry is registered:

```bash
php artisan schedule:list
```

Send a campaign manually when needed:

```bash
php artisan newsletter:send-weekly
```

Each week has one campaign record. Each subscriber has one delivery record for
that campaign. A failed run can be repeated; successful deliveries are skipped.
Every email includes a signed unsubscribe link.
