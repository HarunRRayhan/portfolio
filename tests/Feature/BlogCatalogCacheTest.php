<?php

namespace Tests\Feature;

use App\Support\BlogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BlogCatalogCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_post_file_is_found_without_waiting_for_the_cached_catalog_to_expire(): void
    {
        $before = BlogRepository::cacheKey();
        $this->assertIsArray(app(BlogRepository::class)->posts()); // warm the cached catalog

        $slug = 'test-cache-'.Str::lower(Str::random(12));
        $path = resource_path("blog/posts/{$slug}.md");
        file_put_contents($path, "---\ntitle: \"Cache test\"\nslug: \"{$slug}\"\ndraft: true\ndraftToken: \"".bin2hex(random_bytes(16))."\"\nbrief: \"x\"\npublishedAt: \"2099-01-01T00:00:00.000Z\"\nreadTimeInMinutes: 1\ntags: []\n---\nx\n");
        $this->beforeApplicationDestroyed(fn () => @unlink($path));

        $this->assertNotSame($before, BlogRepository::cacheKey());
        // A fresh repository (the next request) sees the post with no Cache::forget.
        $this->assertIsArray((new BlogRepository)->find($slug));
    }
}
