<?php

namespace Tests\Feature;

use App\Models\MediaItem;
use App\Support\BlogRepository;
use App\Support\CaseStudyRepository;
use App\Support\ContentDates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentMetadataSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_dates_use_only_valid_editorial_updates(): void
    {
        $this->travelTo(now()->setDate(2026, 9, 30));
        foreach ([null, '', 'invalid', 'yesterday', '2026-02-30', '2026-02-01T25:00:00Z', ['date' => '2026-02-01'], 123, '2024-01-01', '2099-01-01'] as $updated) {
            $this->assertSame('2025-01-01T00:00:00+00:00', ContentDates::lastModified('2025-01-01', $updated));
        }
        $this->assertSame('2026-02-01T00:00:00+00:00', ContentDates::lastModified('2025-01-01', '2026-02-01'));

        $blog = new BlogRepository;
        $post = $blog->posts()[0];
        $post['publishedAt'] = '2025-01-01';
        $post['updatedAt'] = '2026-02-01';
        $this->assertSame('2026-02-01T00:00:00+00:00', $blog->summarizePost($post, 0, false)['lastModifiedAtIso']);
        $studies = new CaseStudyRepository;
        $study = $studies->studies()[0];
        $study['publishedAt'] = '2025-01-01';
        $study['updatedAt'] = '2026-02-01';
        $this->assertSame('2026-02-01T00:00:00+00:00', $studies->summarize($study)['lastModifiedAtIso']);
    }

    public function test_media_lastmod_tracks_content_edits_but_not_ordering_or_visibility(): void
    {
        $item = $this->video();
        $this->assertSame('2025-01-01', $item->sitemapLastModified());
        $this->travelTo(now()->setDate(2026, 9, 20));
        $item->update(['priority' => 5, 'is_active' => false]);
        $this->assertNull($item->content_updated_at);
        $item->update(['summary' => 'Updated technical walkthrough.', 'is_active' => true]);
        $this->assertSame('2026-09-20', $item->sitemapLastModified());
        $this->travelTo(now()->setDate(2026, 9, 21));
        $item->update(['priority' => 10]);
        $response = $this->get('/sitemap.xml')->assertOk();
        $document = new \DOMDocument;
        $document->loadXML($response->getContent(), LIBXML_NONET);
        $xpath = new \DOMXPath($document);
        $xpath->registerNamespace('s', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $this->assertSame('2026-09-20', $xpath->evaluate('string(//s:url[s:loc="'.url('/videos/metadata-video').'"]/s:lastmod)'));
    }

    public function test_undated_media_omits_lastmod_and_future_media_is_excluded(): void
    {
        $item = $this->video();
        // Simulate a legacy undated row, without manufacturing edit metadata.
        MediaItem::query()->whereKey($item->id)->update(['published_at' => null]);
        $this->assertNull($item->fresh()->sitemapLastModified());
        $response = $this->get('/sitemap.xml')->assertOk();
        $document = new \DOMDocument;
        $document->loadXML($response->getContent(), LIBXML_NONET);
        $xpath = new \DOMXPath($document);
        $xpath->registerNamespace('s', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        $this->assertSame(0, $xpath->query('//s:url[s:loc="'.url('/videos/metadata-video').'"]/s:lastmod')->length);
        MediaItem::query()->whereKey($item->id)->update(['published_at' => '2099-01-01']);
        $this->get('/sitemap.xml')->assertOk()->assertDontSee('/videos/metadata-video', false);
        $this->get('/videos/metadata-video')->assertNotFound();
    }

    public function test_video_has_one_server_rendered_schema_with_real_metadata(): void
    {
        $item = $this->video();
        $response = $this->get('/videos/'.$item->slug)->assertOk();
        $document = new \DOMDocument;
        @$document->loadHTML($response->getContent());
        $xpath = new \DOMXPath($document);
        $videos = [];
        foreach ($xpath->query('//script[@type="application/ld+json"]') as $script) {
            $graph = json_decode($script->textContent, true, 512, JSON_THROW_ON_ERROR);
            if (($graph['@type'] ?? null) === 'VideoObject') {
                $videos[] = $graph;
            }
        }
        $this->assertCount(1, $videos);
        $this->assertSame('2025-01-01T00:00:00+00:00', $videos[0]['uploadDate']);
        $this->assertSame('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', $videos[0]['embedUrl']);
        $this->assertSame(url($item->thumbnail_url), $videos[0]['thumbnailUrl'][0]);
        $this->assertArrayNotHasKey('contentUrl', $videos[0]);
        $this->assertArrayNotHasKey('duration', $videos[0]);
    }

    public function test_incomplete_or_unplayable_videos_do_not_invent_schema(): void
    {
        $item = $this->video();
        foreach ([['published_at' => null], ['thumbnail_path' => null], ['url' => 'https://example.com/watch']] as $missing) {
            $item->update(array_merge(['published_at' => '2025-01-01', 'thumbnail_path' => 'media-thumbnails/test.jpg', 'url' => 'https://youtu.be/dQw4w9WgXcQ'], $missing));
            $this->get('/videos/'.$item->slug)->assertOk()->assertDontSee('"@type":"VideoObject"', false);
        }
    }

    private function video(): MediaItem
    {
        return MediaItem::create([
            'type' => 'video', 'title' => 'Metadata video', 'slug' => 'metadata-video',
            'summary' => 'A technical walkthrough.', 'url' => 'https://youtu.be/dQw4w9WgXcQ',
            'thumbnail_path' => 'media-thumbnails/test.jpg', 'published_at' => '2025-01-01', 'is_active' => true,
        ]);
    }
}
