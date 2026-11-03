<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GithubSponsorship extends Model
{
    public const KIND_ONE_TIME = 'one_time';

    public const KIND_MONTHLY = 'monthly';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REVOKED = 'revoked';

    public const SOURCE_WEBHOOK = 'webhook';

    public const SOURCE_MANUAL = 'manual';

    protected $fillable = [
        'github_sponsor_id',
        'github_login',
        'user_id',
        'tier_slug',
        'github_tier_node_id',
        'kind',
        'status',
        'source',
        'grant_email',
        'started_at',
        'ended_at',
        'github_sponsorship_node_id',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function credits(): HasMany
    {
        return $this->hasMany(ConsultationCredit::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
