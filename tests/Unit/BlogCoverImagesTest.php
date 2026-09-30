<?php

namespace Tests\Unit;

use App\Support\BlogCoverImages;
use Tests\TestCase;

class BlogCoverImagesTest extends TestCase
{
    public function test_local_candidates_use_cdn_while_external_and_unknown_covers_fall_back(): void
    {
        $manifest = tempnam(sys_get_temp_dir(), 'covers-');
        file_put_contents($manifest, json_encode([
            '/blog-assets/example/cover.jpg' => [
                ['path' => '/blog-assets/card-variants/example-abc-480.webp', 'width' => 480],
            ],
        ]));
        try {
            config(['services.assets.base_url' => 'https://cdn.example.test']);
            app('url')->useAssetOrigin('https://assets.example.test');
            $images = new BlogCoverImages($manifest);
            $this->assertSame(url('/blog-assets/example/cover.jpg'), $images->fallbackUrl('/blog-assets/example/cover.jpg'));
            $this->assertNull($images->fallbackUrl('https://external.test/cover.jpg'));
            $this->assertSame([['url' => 'https://cdn.example.test/blog-assets/card-variants/example-abc-480.webp', 'width' => 480]], $images->sources('/blog-assets/example/cover.jpg'));
            $this->assertSame([], $images->sources('https://external.test/cover.jpg'));
            $this->assertSame([], $images->sources('/blog-assets/missing/cover.jpg'));
            $this->assertSame([], $images->sources(null));
            $this->assertSame([], $images->sources(['invalid']));
        } finally {
            unlink($manifest);
        }
    }

    public function test_missing_manifest_preserves_original_image_fallback(): void
    {
        $this->assertSame([], (new BlogCoverImages('/nonexistent/covers.json'))->sources('/blog-assets/example/cover.jpg'));
    }
}
