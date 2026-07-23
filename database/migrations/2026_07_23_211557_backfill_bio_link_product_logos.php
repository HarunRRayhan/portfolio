<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Storage;

/**
 * Copies the real product logos already shipped in public/images/products
 * (used by resources/js/Pages/Products.tsx) onto the public storage disk and
 * points each Products-tab bio link's existing `thumbnail_path` at its copy,
 * so /bio can render the real logo instead of a generic favicon. Keyed on
 * `url`, same as 2026_07_23_144832_backfill_bio_link_product_descriptions.php.
 */
return new class extends Migration
{
    /** @var array<string, string> url => filename in public/images/products */
    private array $logos = [
        'https://toolblip.com' => 'toolblip.svg',
        'https://ploy.cloud' => 'ploycloud-icon.svg',
        'https://crontinel.com' => 'crontinel.png',
        'https://appnary.com' => 'appnary.svg',
        'https://amazingplugins.com' => 'amazingplugins.jpg',
    ];

    public function up(): void
    {
        // Data-seed migration, not schema: skip in the testing environment so
        // it doesn't pollute the fresh `bio_links` table RefreshDatabase gives
        // each test.
        if (app()->environment('testing')) {
            return;
        }

        foreach ($this->logos as $url => $filename) {
            $source = public_path("images/products/{$filename}");
            if (! is_file($source)) {
                continue;
            }

            $path = "bio-thumbnails/{$filename}";
            Storage::disk('public')->put($path, file_get_contents($source));

            BioLink::where('url', $url)->update(['thumbnail_path' => $path]);
        }
    }

    public function down(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        foreach ($this->logos as $url => $filename) {
            $path = "bio-thumbnails/{$filename}";
            BioLink::where('url', $url)->where('thumbnail_path', $path)->update(['thumbnail_path' => null]);
            Storage::disk('public')->delete($path);
        }
    }
};
