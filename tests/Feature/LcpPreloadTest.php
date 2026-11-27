<?php

namespace Tests\Feature;

use App\Support\LcpPreload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LcpPreloadTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function service_page_preloads_its_hero_with_the_same_srcset_as_the_img(): void
    {
        config(['services.assets.base_url' => 'https://cdn.harun.dev']);

        $html = $this->get('/services/devops')->assertOk()->getContent();

        $this->assertStringContainsString('<link rel="preload" as="image" fetchpriority="high" href="https://cdn.harun.dev/service-assets/devops/hero.jpg" imagesrcset="https://cdn.harun.dev/service-assets/devops/hero-800.jpg 800w, https://cdn.harun.dev/service-assets/devops/hero.jpg 1600w" imagesizes="100vw">', $html);
    }

    #[Test]
    public function blog_post_preloads_its_cover_with_the_card_variants(): void
    {
        $html = $this->get('/blog/ecs-fargate-spot-capacity-providers')->assertOk()->getContent();

        $this->assertMatchesRegularExpression('#<link rel="preload" as="image" fetchpriority="high" href="[^"]*cover[^"]*" imagesrcset="[^"]* 1600w" imagesizes="\(min-width: 1280px\) 1280px, 100vw">#', $html);
    }

    #[Test]
    public function other_pages_and_unknown_service_slugs_get_no_preload(): void
    {
        $this->assertStringNotContainsString('rel="preload" as="image"', $this->get('/about')->getContent());
        $this->assertNull(LcpPreload::for(['component' => 'Services/Nope'], 'services/nope'));
        $this->assertNull(LcpPreload::for(['component' => 'Blog/Post', 'props' => ['post' => ['coverImageUrl' => null]]], 'blog/x'));
    }
}
