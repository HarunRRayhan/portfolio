<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Retire the 30-minute call. The old Pro (1h) becomes Light at $449, Max goes to $599, Ultra (2h) is new at $999.
// Rows are renamed in place, never deleted: bookings and credits point at tiers by id.
return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $tiers = DB::table('consultation_tiers');

        // Free the 'light' slug first (unique), then move Pro into it.
        (clone $tiers)->where('slug', 'light')->update([
            'slug' => 'light-30', 'name' => 'Consultation 30-minute (retired)',
            'is_active' => false, 'updated_at' => $now,
        ]);
        (clone $tiers)->where('slug', 'pro')->update([
            'slug' => 'light', 'name' => 'Consultation Light',
            'price_cents' => 44900, 'sort_order' => 1, 'updated_at' => $now,
        ]);
        (clone $tiers)->where('slug', 'max')->update([
            'price_cents' => 59900, 'sort_order' => 2, 'updated_at' => $now,
        ]);

        // Coupons are scoped by slug: the retired 30-min 'light' scope is dropped, old 'pro' becomes 'light'.
        // A coupon left with no tier is deactivated rather than widened.
        $this->remapCoupons(['light' => null, 'pro' => 'light'], $now);

        $max = (clone $tiers)->where('slug', 'max')->first();
        $features = collect(json_decode($max->features, true))
            ->map(fn ($f) => $f['label'] === '60-minute call' ? ['label' => '120-minute call', 'included' => true] : $f)
            ->all();

        DB::table('consultation_tiers')->updateOrInsert(['slug' => 'ultra'], [
            'name' => 'Consultation Ultra',
            'price_cents' => 99900,
            'duration_minutes' => 120,
            'features' => json_encode($features),
            'includes_recording' => true,
            'includes_followup' => true,
            'is_active' => true,
            'sort_order' => 3,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        $now = now();
        $tiers = DB::table('consultation_tiers');

        // Best effort: the 30-min scope cannot be recovered, so only Light -> Pro is mapped back.
        $this->remapCoupons(['light' => 'pro'], $now);

        (clone $tiers)->where('slug', 'ultra')->delete();
        (clone $tiers)->where('slug', 'light')->update([
            'slug' => 'pro', 'name' => 'Consultation Pro', 'price_cents' => 34900, 'sort_order' => 2, 'updated_at' => $now,
        ]);
        (clone $tiers)->where('slug', 'light-30')->update([
            'slug' => 'light', 'name' => 'Consultation Light', 'is_active' => true, 'updated_at' => $now,
        ]);
        (clone $tiers)->where('slug', 'max')->update(['price_cents' => 34900, 'sort_order' => 3, 'updated_at' => $now]);
        (clone $tiers)->where('slug', 'pro')->update(['price_cents' => 24900]);
    }

    /** @param array<string, ?string> $map old slug => new slug (null drops it) */
    private function remapCoupons(array $map, $now): void
    {
        foreach (DB::table('consultation_coupons')->get(['id', 'tier_slugs']) as $coupon) {
            $slugs = json_decode($coupon->tier_slugs, true) ?? [];
            $mapped = array_values(array_unique(array_filter(
                array_map(fn ($s) => array_key_exists($s, $map) ? $map[$s] : $s, $slugs),
            )));

            if ($mapped === $slugs) {
                continue;
            }

            DB::table('consultation_coupons')->where('id', $coupon->id)->update([
                'tier_slugs' => json_encode($mapped),
                'is_active' => $mapped === [] ? false : DB::raw('is_active'),
                'updated_at' => $now,
            ]);
        }
    }
};
