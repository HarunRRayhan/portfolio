<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

/**
 * Undoes 2026_07_23_211557_backfill_bio_link_product_logos: that migration
 * pointed thumbnail_path at files written via Storage::disk('public')->put()
 * at migrate time, but on production the nginx container serves /storage
 * from a build-time image copy, so files written after the image was built
 * are invisible to it (404). The Products tab now renders these logos from
 * the already-deployed public/images/products/* assets directly (see
 * PRODUCT_LOGOS in resources/js/Pages/Bio.tsx), so the thumbnail_path is
 * cleared to avoid a broken-image preview in the admin edit form.
 */
return new class extends Migration
{
    private array $urls = [
        'https://toolblip.com',
        'https://ploy.cloud',
        'https://crontinel.com',
        'https://appnary.com',
        'https://amazingplugins.com',
    ];

    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::whereIn('url', $this->urls)
            ->where('thumbnail_path', 'like', 'bio-thumbnails/%')
            ->update(['thumbnail_path' => null]);
    }

    public function down(): void
    {
        // Intentionally irreversible: the thumbnail files this would restore
        // were never reliably present on disk (see note above).
    }
};
