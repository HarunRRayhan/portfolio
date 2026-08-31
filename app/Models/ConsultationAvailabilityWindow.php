<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ConsultationAvailabilityWindow extends Model
{
    protected $fillable = [
        'weekday',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected $casts = [
        'weekday' => 'integer',
        'is_active' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('weekday')->orderBy('start_time');
    }
}
