<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class XpAward extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'key', 'points', 'comment_id', 'created_at'];
}
