<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscriber extends Model
{
    use HasFactory;

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
