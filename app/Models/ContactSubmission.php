<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'services',
        'referrer',
        'status'
    ];

    protected $casts = [
        'services' => 'array'
    ];
} 