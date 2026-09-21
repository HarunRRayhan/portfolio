<?php

namespace Tests\Feature;

use App\Models\MediaItem;
use App\Support\MediaEmbeds;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediaItemTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_media_index_keeps_newer_items_first_when_priority_matches(): void
    {
        MediaItem::create([
            'type' => 'video',
            'title' => 'Older Laravel Scaling Talk',
            'url' => 'https://youtube.com/watch?v=aaaaaaaaaaa',
            'published_at' => '2026-08-01 00:00:00',
            'priority' => 0,
            'is_active' => true,
        ]);
        MediaItem::create([
            'type' => 'video',
            'title' => 'Newer Laravel Scaling Talk',
            'url' => 'https://youtube.com/watch?v=bbbbbbbbbbb',
            'published_at' => '2026-09-12 00:00:00',
            'priority' => 0,
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/videos');

        $response->assertOk();
        $items = $response->json('props.items');

        $this->assertSame('Newer Laravel Scaling Talk', $items[0]['title']);
        $this->assertSame('Older Laravel Scaling Talk', $items[1]['title']);
    }

    public function test_google_slides_edit_url_resolves_to_an_embed_url(): void
    {
        $embedUrl = MediaEmbeds::slideEmbedUrl('https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#slide=id.p1');

        $this->assertSame(
            'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/embed?start=false&loop=false&delayms=3000',
            $embedUrl
        );
    }

    public function test_a_non_google_slides_url_does_not_resolve_to_an_embed_url(): void
    {
        $this->assertNull(MediaEmbeds::slideEmbedUrl('https://example.com/deck.pdf'));
        $this->assertNull(MediaEmbeds::slideEmbedUrl('https://speakerdeck.com/harun/scaling-serverless'));
    }

    public function test_a_slide_detail_page_renders_the_embed_url_and_related_slides(): void
    {
        MediaItem::create([
            'type' => 'slide',
            'title' => 'Laravel DB Performance',
            'slug' => 'laravel-db-performance',
            'url' => 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/slides/laravel-db-performance');

        $response->assertOk();
        $page = $response->json();

        $this->assertSame('Media/Detail', $page['component']);
        $this->assertSame(
            'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/embed?start=false&loop=false&delayms=3000',
            $page['props']['item']['embedUrl']
        );
    }

    public function test_matching_slide_and_video_are_interlinked_and_have_page_share_urls(): void
    {
        MediaItem::create([
            'type' => 'slide',
            'title' => 'Scale Your Laravel App',
            'slug' => 'scale-your-laravel-app',
            'summary' => 'Presentation slides for scaling Laravel beyond a single $5 VPS.',
            'url' => 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit',
            'is_active' => true,
        ]);
        MediaItem::create([
            'type' => 'video',
            'title' => 'Scale Your Laravel App | Laravel Meetup - Cohort-02',
            'slug' => 'scale-your-laravel-app',
            'summary' => 'Learn how to scale Laravel beyond a single $5 VPS.',
            'url' => 'https://youtu.be/E-_1Irtz7io',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/slides/scale-your-laravel-app');

        $response->assertOk();
        $page = $response->json();

        $this->assertSame('video', $page['props']['paired']['type']);
        $this->assertSame('/videos/scale-your-laravel-app', $page['props']['paired']['detailUrl']);
        $this->assertStringContainsString('/s/', $page['props']['item']['pageShareUrl']);
        $this->assertSame(
            'Presentation slides for scaling Laravel beyond a single $5 VPS.',
            $page['props']['seo']['description']
        );
    }

    public function test_a_video_detail_page_renders_the_embed_url(): void
    {
        MediaItem::create([
            'type' => 'video',
            'title' => 'A Talk About Terraform',
            'slug' => 'a-talk-about-terraform',
            'url' => 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            'is_active' => true,
        ]);

        $response = $this->withHeaders($this->inertiaHeaders())->get('/videos/a-talk-about-terraform');

        $response->assertOk();
        $page = $response->json();

        $this->assertSame('Media/Detail', $page['component']);
        $this->assertSame(
            'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            $page['props']['item']['embedUrl']
        );
        $this->assertStringContainsString('/s/', $page['props']['item']['pageShareUrl']);
    }
}
