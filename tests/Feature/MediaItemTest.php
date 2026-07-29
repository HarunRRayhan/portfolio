<?php

namespace Tests\Feature;

use App\Models\MediaItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediaItemTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Headers that make Inertia return the page JSON directly instead of the
     * full HTML document. Media/Index.tsx and Media/Detail.tsx are built by a
     * separate frontend task and don't exist yet, so the Vite manifest can't
     * resolve them for a full-page render -- these routes' backend behavior
     * is all this test needs to check. (This also means the usual
     * ->assertInertia() helper doesn't apply here, since it expects a
     * rendered Blade view rather than a raw JSON response -- we assert on
     * $response->json() directly instead.) The version must match what
     * Inertia computes server-side (a hash of the manifest file) or it 409s
     * asking the client to do a full reload instead of returning page data.
     */
    private function inertiaHeaders(): array
    {
        return [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => hash_file('xxh128', public_path('build/manifest.json')),
        ];
    }

    public function test_saving_a_media_item_with_a_url_resolves_a_short_link(): void
    {
        $item = MediaItem::create([
            'type' => 'video',
            'title' => 'A Talk About Terraform',
            'url' => 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        ]);

        $this->assertNotNull($item->short_link_id);
        $this->assertStringContainsString('/s/', $item->share_url);
    }

    public function test_active_slide_appears_on_the_slides_index(): void
    {
        MediaItem::create([
            'type' => 'slide',
            'title' => 'Scaling Serverless Workloads',
            'url' => 'https://docs.google.com/presentation/d/abc123',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/slides');

        $response->assertOk();
        $page = $response->json();

        $this->assertSame('Media/Index', $page['component']);
        $this->assertSame('slide', $page['props']['type']);
        $this->assertCount(1, $page['props']['items']);
    }

    public function test_a_slide_does_not_appear_on_the_videos_index(): void
    {
        MediaItem::create([
            'type' => 'slide',
            'title' => 'Scaling Serverless Workloads',
            'url' => 'https://docs.google.com/presentation/d/abc123',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/videos');

        $response->assertOk();
        $page = $response->json();

        $this->assertSame('Media/Index', $page['component']);
        $this->assertSame('video', $page['props']['type']);
        $this->assertCount(0, $page['props']['items']);
    }

    public function test_an_inactive_slide_is_excluded_from_the_slides_index(): void
    {
        MediaItem::create([
            'type' => 'slide',
            'title' => 'Draft Deck',
            'url' => 'https://docs.google.com/presentation/d/draft',
            'is_active' => false,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/slides');

        $response->assertOk();
        $page = $response->json();

        $this->assertCount(0, $page['props']['items']);
    }

    public function test_google_slides_edit_url_resolves_to_an_embed_url(): void
    {
        $embedUrl = mediaItemSlideEmbedUrl('https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#slide=id.p1');

        $this->assertSame(
            'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/embed?start=false&loop=false&delayms=3000',
            $embedUrl
        );
    }

    public function test_a_non_google_slides_url_does_not_resolve_to_an_embed_url(): void
    {
        $this->assertNull(mediaItemSlideEmbedUrl('https://example.com/deck.pdf'));
        $this->assertNull(mediaItemSlideEmbedUrl('https://speakerdeck.com/harun/scaling-serverless'));
    }
}
