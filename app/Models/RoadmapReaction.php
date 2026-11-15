<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoadmapReaction extends Model
{
    public const LOVE = 'love';

    public const WISHLIST = 'wishlist';

    protected $table = 'roadmap_reactions';

    protected $guarded = ['id'];
}
