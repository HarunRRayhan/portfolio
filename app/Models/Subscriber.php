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
     * The email masked for display: first two characters of the local part
     * stay visible, the rest is hidden, domain shown in full.
     */
    public function maskedEmail(): string
    {
        $email = (string) $this->email;

        if (! str_contains($email, '@')) {
            return str_repeat('*', mb_strlen($email));
        }

        [$local, $domain] = explode('@', $email, 2);

        return mb_substr($local, 0, 2).'***@'.$domain;
    }
}
