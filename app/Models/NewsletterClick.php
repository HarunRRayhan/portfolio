<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsletterClick extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'newsletter_delivery_id',
        'url',
    ];

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(NewsletterDelivery::class, 'newsletter_delivery_id');
    }
}
