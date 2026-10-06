<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPostSchedule extends Model
{
    protected $fillable = [
        'slug',
        'publish_at',
        'notified_at',
    ];

    protected function casts(): array
    {
        return [
            'publish_at' => 'datetime',
            'notified_at' => 'datetime',
        ];
    }
}
