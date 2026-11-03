<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Mail\SubscribeConfirmationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;

class Subscriber extends Model
{
    use HasFactory;

    public function scopeSubscribed(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('status'), 'subscribed');
    }

    /**
     * Double opt-in: mails a signed confirm link and never sets `subscribed` itself.
     * New addresses start `pending`; an `unsubscribed` row is left as is until the link is used.
     * Returns true when a mail was sent (false when already subscribed or rate-limited).
     */
    public static function requestConfirmation(string $email, ?string $source, ?string $referrer): bool
    {
        $email = strtolower(trim($email));

        if (! RateLimiter::attempt('subscribe:'.sha1($email), 3, fn () => true, 600)) {
            return false;
        }

        $subscriber = static::firstOrCreate(
            ['email' => $email],
            ['source' => $source, 'referrer' => $referrer, 'status' => 'pending'],
        );

        if ($subscriber->status === 'subscribed') {
            return false;
        }

        Mail::to($subscriber->email)->send(new SubscribeConfirmationMail(
            URL::temporarySignedRoute('newsletter.confirm', now()->addDays(7), ['subscriber' => $subscriber->getKey()]),
        ));

        return true;
    }

    protected $fillable = [
        'email',
        'source',
        'referrer',
        'status',
    ];

    /**
     * Guard against a future serialization site emitting the real address
     * by accident -- callers must go through maskedEmail() (list view) or
     * read the attribute explicitly (the admin-only reveal endpoint).
     */
    protected $hidden = [
        'email',
    ];

    /**
     * The email masked for display: a one-character local part shows in
     * full (nothing left to hide), a two-character local part shows only
     * its first character, anything longer shows its first two -- so at
     * least one character of a local part longer than one is always
     * hidden. Domain is shown in full. Malformed values (no '@', more than
     * one, or an empty local/domain part) are fully masked instead of
     * guessed at.
     */
    public function maskedEmail(): string
    {
        $email = (string) $this->email;

        if ($email === '') {
            return '***';
        }

        $parts = explode('@', $email);

        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            return str_repeat('*', mb_strlen($email));
        }

        [$local, $domain] = $parts;
        $localLength = mb_strlen($local);

        $visible = match (true) {
            $localLength <= 1 => $localLength,
            $localLength === 2 => 1,
            default => 2,
        };

        return mb_substr($local, 0, $visible).'***@'.$domain;
    }
}
