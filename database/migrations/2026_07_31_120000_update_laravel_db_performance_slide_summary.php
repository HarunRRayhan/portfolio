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
            ->where('slug', 'laravel-database-performance-10-min-devops-edition')
            ->update([
                'summary' => "A DevOps consultant who used to write Laravel walks through real incidents: turning a 30-minute PHP loop into a 200ms SQL query, and why doubling the database size didn't fix a bad query.",
            ]);
    }

    public function down(): void
    {
        MediaItem::where('type', 'slide')
            ->where('slug', 'laravel-database-performance-10-min-devops-edition')
            ->update([
                'summary' => '10 minutes on tuning Laravel database performance, DevOps edition.',
            ]);
    }
};
