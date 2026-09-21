<?php

use App\Models\MediaItem;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        MediaItem::where('type', 'slide')
            ->where('slug', 'scale-your-laravel-app')
            ->update([
                'summary' => 'Presentation slides for scaling Laravel beyond a single $5 VPS, covering queues, Redis cache, containers, load balancing, and AWS services.',
                'published_at' => '2026-09-12 05:03:56',
            ]);
    }

    public function down(): void
    {
        MediaItem::where('type', 'slide')
            ->where('slug', 'scale-your-laravel-app')
            ->update([
                'summary' => 'From a $5 VPS past one box: queues, cache, containers, and AWS names for scaling a Laravel app.',
                'published_at' => null,
            ]);
    }
};
