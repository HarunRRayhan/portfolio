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
};
