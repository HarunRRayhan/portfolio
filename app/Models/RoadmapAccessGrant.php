<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class RoadmapAccessGrant extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'revoked_at' => 'datetime'];
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->whereNull('revoked_at')->where('expires_at', '>', now());
    }

    public function status(): string
    {
        return $this->revoked_at ? 'revoked' : ($this->expires_at->isPast() ? 'expired' : 'active');
    }
}
