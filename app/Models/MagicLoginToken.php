<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MagicLoginToken extends Model
{
    protected $fillable = ['email', 'token_hash', 'redirect_to', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'used_at' => 'datetime'];
    }
}
