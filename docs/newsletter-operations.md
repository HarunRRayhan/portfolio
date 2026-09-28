# Weekly newsletter operations

The newsletter includes up to three posts published in the seven days before
the send. A week with no new post sends nothing, including a retry of a
pending campaign. Two distinct products are picked at random for each
campaign, favoring products absent from the previous campaign. The pair is
saved with the campaign so retries show the same products to everyone. One
appears before the first post and one after it, with their logos. Edit
`config/newsletter.php` to change the product list.

The email can also show up to three manually curated X posts after the blog
and product sections. Add each post's `text` and `url` to
`newsletter.tweets` in `config/newsletter.php`. When that list is empty, the
email links to `https://x.com/harundotdev` instead. Automatic X retrieval
is not configured.

## How it runs

`railway.scheduler.json` already keeps Laravel's scheduler alive:

```text
php artisan schedule:run --no-interaction
```

`routes/console.php` registers `newsletter:send-weekly` for Tuesday at 11:00
in `America/New_York`. This reaches the US east coast in late morning, the
west coast at 08:00, and the UK in the afternoon. The day, time, timezone,
and post count (one to three) are configurable:

```dotenv
NEWSLETTER_MAX_POSTS=3
NEWSLETTER_SEND_DAY=2
NEWSLETTER_SEND_TIME=11:00
NEWSLETTER_TIMEZONE=America/New_York
```

The command refuses to send with Laravel's `log` or `array` mailer outside
tests. Production uses Resend:

```dotenv
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=newsletter@your-verified-domain.example
MAIL_FROM_NAME="Harun R. Rayhan"
RESEND_API_KEY=...
```

Set the same database, app key, mail, and newsletter variables on both the
Railway `web` and `scheduler` services. The scheduler needs the database to
read subscribers and record campaign deliveries. Railway variables override
the defaults in `config/newsletter.php`; verify the live values after changes.

## Check the schedule

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

Each week has one campaign record. Each subscribed address gets at most one
delivery for that campaign, including the site owner's address if subscribed.
A failed run can be repeated; successful deliveries are skipped. Every email
includes a signed unsubscribe link.
