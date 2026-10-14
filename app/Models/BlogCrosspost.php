<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogCrosspost extends Model
{
    protected $fillable = [
        'slug',
        'platform',
        'remote_id',
        'remote_url',
    ];
}
