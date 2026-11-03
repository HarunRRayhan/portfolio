<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Match the GitHub Sponsors tiers (Light $149, Pro $249, Max $349) now that the $100 launch discount is gone.
return new class extends Migration
{
    public function up(): void
    {
        $this->setPrices(['light' => 14900, 'pro' => 24900, 'max' => 34900]);
    }

    public function down(): void
    {
        $this->setPrices(['light' => 24900, 'pro' => 34900, 'max' => 44900]);
    }

    private function setPrices(array $prices): void
    {
        foreach ($prices as $slug => $price) {
            DB::table('consultation_tiers')->where('slug', $slug)
                ->update(['price_cents' => $price, 'updated_at' => now()]);
        }
    }
};
