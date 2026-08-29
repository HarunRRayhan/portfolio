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

        MediaItem::updateOrCreate(
            ['type' => 'slide', 'slug' => 'scale-your-laravel-app'],
            [
                'title' => 'Scale Your Laravel App',
                'summary' => 'From a $5 VPS past one box: queues, cache, containers, and AWS names for scaling a Laravel app.',
                'url' => 'https://docs.google.com/presentation/d/1FB_1_6UB8Ao-G773jMcVp5NfU6w4ELO9FPUX0etle5M/edit',
                'source_label' => 'Google Slides',
                'is_active' => true,
                'priority' => 0,
            ]
        );
    }

    public function down(): void
    {
        MediaItem::where('type', 'slide')
            ->where('slug', 'scale-your-laravel-app')
            ->delete();
    }
};
