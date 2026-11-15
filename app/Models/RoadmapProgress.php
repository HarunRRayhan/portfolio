<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoadmapProgress extends Model
{
    protected $table = 'roadmap_progress';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }
}
