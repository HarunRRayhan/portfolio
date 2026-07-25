<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * The US-only and AU-only cashback entries were originally gated by
 * `include_countries`, so a visitor only saw the store link matching their
 * own detected country. That hid both from anyone whose country couldn't be
 * resolved, and hid the "other" one from everyone. These should be visible
 * to all visitors instead, listed below the (still country-aware) General
 * entry, so people can manually pick either store regardless of geo
 * detection.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::where('tab', 'Cashback')
            ->whereIn('label', ['TopCashback (US)', 'TopCashback (AU)'])
            ->update(['include_countries' => null]);
    }

    public function down(): void
    {
        BioLink::where('tab', 'Cashback')
            ->where('label', 'TopCashback (US)')
            ->update(['include_countries' => ['US']]);

        BioLink::where('tab', 'Cashback')
            ->where('label', 'TopCashback (AU)')
            ->update(['include_countries' => ['AU']]);
    }
};
