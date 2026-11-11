<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// The $449 one-hour tier is called Pro, not Light. Rows and ids stay; only slug, name and coupon scopes move.
return new class extends Migration
{
    public function up(): void
    {
        $this->rename('light', 'pro', 'Consultation Pro');
    }

    public function down(): void
    {
        $this->rename('pro', 'light', 'Consultation Light');
    }

    private function rename(string $from, string $to, string $name): void
    {
        $now = now();

        DB::table('consultation_tiers')->where('slug', $from)
            ->update(['slug' => $to, 'name' => $name, 'updated_at' => $now]);

        foreach (DB::table('consultation_coupons')->get(['id', 'tier_slugs']) as $coupon) {
            $slugs = json_decode($coupon->tier_slugs, true) ?? [];
            $mapped = array_values(array_unique(array_map(fn ($s) => $s === $from ? $to : $s, $slugs)));

            if ($mapped !== $slugs) {
                DB::table('consultation_coupons')->where('id', $coupon->id)
                    ->update(['tier_slugs' => json_encode($mapped), 'updated_at' => $now]);
            }
        }
    }
};
