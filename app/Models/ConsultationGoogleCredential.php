<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ConsultationGoogleCredential extends Model
{
    protected $fillable = [
        'access_token',
        'refresh_token',
        'token_expires_at',
        'email',
        'calendar_id',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
    ];

    public function setAccessTokenAttribute(?string $value): void
    {
        $this->attributes['access_token'] = $value === null || $value === ''
            ? null
            : Crypt::encryptString($value);
    }

    public function getAccessTokenAttribute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    public function setRefreshTokenAttribute(?string $value): void
    {
        $this->attributes['refresh_token'] = $value === null || $value === ''
            ? null
            : Crypt::encryptString($value);
    }

    public function getRefreshTokenAttribute(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    public static function current(): ?self
    {
        return static::query()->latest('id')->first();
    }
}
