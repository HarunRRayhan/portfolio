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
            ['type' => 'slide', 'slug' => 'laravel-database-performance-10-min-devops-edition'],
            [
                'title' => 'Laravel Database Performance - 10 min (DevOps edition)',
                'summary' => '10 minutes on tuning Laravel database performance, DevOps edition.',
                'url' => 'https://docs.google.com/presentation/d/1MTSihFc4z4lhnhvO_18FXXopKtfux5nW50GKZY4vZqk/edit',
                'source_label' => 'Google Slides',
                'is_active' => true,
                'priority' => 0,
            ]
        );
    }

    public function down(): void
    {
        MediaItem::where('type', 'slide')
            ->where('slug', 'laravel-database-performance-10-min-devops-edition')
            ->delete();
    }
};
