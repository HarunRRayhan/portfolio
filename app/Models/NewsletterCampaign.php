<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NewsletterCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'post_slugs',
        'subject',
        'subscriber_count',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'post_slugs' => 'array',
            'subscriber_count' => 'integer',
            'sent_at' => 'datetime',
        ];
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(NewsletterDelivery::class);
    }
}
