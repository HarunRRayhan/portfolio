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
            ['type' => 'video', 'slug' => 'scale-your-laravel-app'],
            [
                'title' => 'Scale Your Laravel App | Laravel Meetup - Cohort-02',
                'summary' => 'Learn how to scale Laravel beyond a single $5 VPS with queues, Redis cache, containers, load balancing, and AWS services in this Laravel Meetup Cohort-02 talk.',
                'url' => 'https://youtu.be/E-_1Irtz7io',
                'source_label' => 'YouTube',
                'published_at' => '2026-09-12 05:03:56',
                'is_active' => true,
                'priority' => 0,
            ]
        );
    }

    public function down(): void
    {
        MediaItem::where('type', 'video')
            ->where('slug', 'scale-your-laravel-app')
            ->delete();
    }
};
