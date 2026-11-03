<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GithubWebhookEvent extends Model
{
    protected $fillable = [
        'delivery_id',
        'event',
        'action',
        'payload',
        'processed_at',
        'failed_at',
        'error',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }
}
