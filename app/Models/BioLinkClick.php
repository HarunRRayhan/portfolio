<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BioLinkClick extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'bio_link_id',
        'ip_address',
        'user_agent',
        'referer',
    ];

    public function bioLink(): BelongsTo
    {
        return $this->belongsTo(BioLink::class);
    }
}
