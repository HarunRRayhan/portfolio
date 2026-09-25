<?php

namespace App\Support;

use Illuminate\Support\Facades\Vite;

class HomepageStyles
{
    public static function available(): bool
    {
        return request()->is('/') && request()->user() === null
            && ! Vite::isRunningHot()
            && is_file(public_path('build/homepage-styles.json'));
    }
}
