<?php

namespace Tests\Unit;

use App\Support\BlogRepository;
use App\Support\ContentLinks;
use App\Support\SiteCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ContentLinksTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_a_post_maps_to_one_service_from_its_most_specific_tag(): void
    {
        $blog = new BlogRepository;

        $this->assertSame(
            '/services/infrastructure-as-code',
            ContentLinks::forPost($blog->find('terraform-state-more-sensitive-than-env'))['url'],
        );
        $this->assertSame(
            '/services/aws-cloud',
            ContentLinks::forPost($blog->find('deploy-wordpress-app-to-amazon-lightsail'))['url'],
        );
        $this->assertSame(
            '/services/security-consulting',
            ContentLinks::forPost($blog->find('lock-down-bedrock-iam-lambda-data-leak'))['url'],
        );
        $this->assertSame(
            '/services/vibe-code-migration',
            ContentLinks::forPost($blog->find('when-your-app-outgrows-the-tool-that-built-it'))['url'],
        );
        $this->assertSame(
            '/services/cloud-architecture',
            ContentLinks::forPost($blog->find('how-to-start-learning-aws-cloud-and-get-certified'))['url'],
        );
    }

    public function test_every_service_reading_list_points_at_published_posts(): void
    {
        $blog = new BlogRepository;
        $published = collect($blog->posts())
            ->reject(fn (array $post) => (bool) ($post['draft'] ?? false))
            ->pluck('slug')
            ->all();

        foreach (SiteCatalog::services() as [, $path]) {
            $slug = basename($path);
            $reading = ContentLinks::readingForService($slug);

            $this->assertGreaterThanOrEqual(2, count($reading), $path);
            $this->assertLessThanOrEqual(3, count($reading), $path);

            foreach ($reading as $post) {
                $this->assertContains(basename($post['url']), $published, $path);
                $this->assertNotSame('', $post['title']);
                $this->assertStringStartsWith('/blog/', $post['url']);
            }
        }
    }
}
