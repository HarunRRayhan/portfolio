<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->unsignedInteger('campaign_discount_cents')->default(0)->after('discount_percent');
        });

        $now = now();

        foreach (['light' => 24900, 'pro' => 34900, 'max' => 44900] as $slug => $price) {
            DB::table('consultation_tiers')
                ->where('slug', $slug)
                ->update(['price_cents' => $price, 'updated_at' => $now]);
        }

        $key = (string) config(
            'consultation.launch_promotion.counter_key',
            'consultation_booking_promotion_claimed_count',
        );

        if (! DB::table('consultation_settings')->where('key', $key)->exists()) {
            DB::table('consultation_settings')->insert([
                'key' => $key,
                'value' => '0',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->dropColumn('campaign_discount_cents');
        });

        $now = now();

        foreach ([
            'light' => [24900, 14900],
            'pro' => [34900, 24900],
            'max' => [44900, 34900],
        ] as $slug => [$launchPrice, $previousPrice]) {
            DB::table('consultation_tiers')
                ->where('slug', $slug)
                ->where('price_cents', $launchPrice)
                ->update(['price_cents' => $previousPrice, 'updated_at' => $now]);
        }

        DB::table('consultation_settings')
            ->where('key', (string) config(
                'consultation.launch_promotion.counter_key',
                'consultation_booking_promotion_claimed_count',
            ))
            ->where('value', '0')
            ->delete();
    }
};
