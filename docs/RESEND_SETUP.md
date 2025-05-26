# Resend Email Integration

This project uses [Resend](https://resend.com) for sending emails through Laravel. Resend provides a modern, developer-friendly email API with excellent deliverability.

## Setup

### 1. Environment Configuration

The Resend package has been installed and configured. You need to set up your environment variables:

```env
# Set the mail driver to use Resend
MAIL_MAILER=resend

# Your Resend API key (get this from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxx

# Optional: Webhook secret for verifying webhook signatures
RESEND_WEBHOOK_SECRET=your_webhook_secret_here

# Configure your from address (must be from a verified domain)
MAIL_FROM_ADDRESS="hello@yourdomain.com"
MAIL_FROM_NAME="Your App Name"
```

### 2. Domain Verification

Before sending emails, you need to verify your domain in the Resend dashboard:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain
3. Configure the required DNS records
4. Wait for verification

### 3. API Key Setup

1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key and add it to your `.env` file as `RESEND_API_KEY`

## Usage

### Method 1: Using Laravel's Mail Facade (Recommended)

This is the standard Laravel way and works with all existing Mailable classes:

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactFormMail;

// Send using existing Mailable class
Mail::to('recipient@example.com')->send(new ContactFormMail($data));
```

### Method 2: Using Resend Facade Directly

For more control or when you need Resend-specific features:

```php
use Resend\Laravel\Facades\Resend;

$result = Resend::emails()->send([
    'from' => 'sender@yourdomain.com',
    'to' => ['recipient@example.com'],
    'subject' => 'Hello from Resend',
    'html' => '<h1>Hello World!</h1>',
]);

// The result contains the email ID from Resend
$emailId = $result['id'];
```

## Testing the Integration

You can test the Resend integration using the existing contact form or the Artisan command:

### Using the Contact Form

1. Navigate to `/contact` on your website
2. Fill out and submit the contact form
3. The email will be sent via Resend using the existing `ContactFormMail` class

### Using the Artisan Command

```bash
# Test with Mail facade (recommended)
php artisan resend:test your-email@example.com

# Test with Resend facade directly
php artisan resend:test your-email@example.com --method=resend
```

## Webhooks

Resend can send webhooks for email events (delivered, bounced, etc.). The webhook endpoint is automatically configured at `/resend/webhook`.

### Setting up Webhooks

1. Go to [Resend Webhooks](https://resend.com/webhooks)
2. Add your webhook URL: `https://yourdomain.com/resend/webhook`
3. Select the events you want to receive
4. Copy the signing secret and add it to your `.env` as `RESEND_WEBHOOK_SECRET`

### Webhook Events

The package automatically dispatches Laravel events for Resend webhooks:

- `email.sent` → `EmailSent` event
- `email.delivered` → `EmailDelivered` event
- `email.bounced` → `EmailBounced` event
- `email.complained` → `EmailComplained` event

You can listen to these events in your `EventServiceProvider`:

```php
protected $listen = [
    \Resend\Laravel\Events\EmailDelivered::class => [
        \App\Listeners\HandleEmailDelivered::class,
    ],
];
```

## Configuration Files

### Mail Configuration

The Resend mailer is configured in `config/mail.php`:

```php
'mailers' => [
    'resend' => [
        'transport' => 'resend',
    ],
    // ... other mailers
],
```

### CSRF Protection

Webhook routes are excluded from CSRF protection in `bootstrap/app.php`:

```php
$middleware->validateCsrfTokens(except: [
    'resend/*',
]);
```

## Existing Email Classes

The project already includes:

- `App\Mail\ContactFormMail` - For contact form submissions
- Email template: `resources/views/emails/contact-form.blade.php`

These will automatically work with Resend once you update your environment variables.

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check your `RESEND_API_KEY` is correct
2. **Domain Not Verified**: Ensure your sending domain is verified in Resend
3. **Rate Limits**: Resend has rate limits based on your plan
4. **Webhook Verification Failed**: Check your `RESEND_WEBHOOK_SECRET`

### Logs

Check Laravel logs for detailed error messages:

```bash
tail -f storage/logs/laravel.log
```

### Testing in Development

For local development, you can use tools like [ngrok](https://ngrok.com) to expose your local server for webhook testing:

```bash
ngrok http 8000
# Use the HTTPS URL for webhook configuration
```

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Laravel Package](https://github.com/resendlabs/resend-laravel)
- [Laravel Mail Documentation](https://laravel.com/docs/mail) 