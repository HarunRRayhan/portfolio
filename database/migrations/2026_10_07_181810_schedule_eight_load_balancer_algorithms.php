<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! app()->environment('production')) {
            return;
        }

        $now = now();
        $publishAt = Carbon::parse('2026-10-10 20:18:10', 'Asia/Dhaka')->utc();

        DB::table('blog_post_schedules')->upsert(
            [[
                'slug' => 'eight-load-balancer-algorithms',
                'publish_at' => $publishAt,
                'notified_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]],
            ['slug'],
            ['publish_at', 'notified_at', 'updated_at'],
        );
    }

    public function down(): void
    {
        if (! app()->environment('production')) {
            return;
        }

        DB::table('blog_post_schedules')->where('slug', 'eight-load-balancer-algorithms')->delete();
    }
};
