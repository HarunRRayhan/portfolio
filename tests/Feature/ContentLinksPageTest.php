<?php

namespace Tests\Feature;

use App\Support\SiteCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentLinksPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_services_hub_lists_cloud_architecture_and_database_optimization(): void
    {
        $paths = array_column(SiteCatalog::serviceIndex(), 'path');

        foreach (SiteCatalog::services() as [, $path]) {
            $this->assertContains($path, $paths);
        }

        $html = $this->get('/services')->assertOk()->getContent();

        $this->assertStringContainsString('/services/cloud-architecture', $html);
        $this->assertStringContainsString('/services/database-optimization', $html);
    }

    public function test_blog_post_payload_includes_one_service_link(): void
    {
        $props = $this->get('/blog/terraform-state-more-sensitive-than-env')
            ->assertOk()
            ->viewData('page')['props'];

        $this->assertSame('/services/infrastructure-as-code', $props['relatedService']['url']);
        $this->assertSame('Infrastructure as Code', $props['relatedService']['title']);
    }

    public function test_service_page_receives_its_reading_links(): void
    {
        $response = $this->get('/services/infrastructure-as-code')->assertOk();
        $props = $response->viewData('page')['props'];

        $this->assertCount(3, $props['serviceReading']);
        $this->assertStringStartsWith('/blog/', $props['serviceReading'][0]['url']);
        $this->assertStringContainsString(
            str_replace('/', '\\/', $props['serviceReading'][0]['url']),
            $response->getContent(),
        );
    }

    public function test_homepage_does_not_receive_service_reading(): void
    {
        $props = $this->get('/')->assertOk()->viewData('page')['props'];

        $this->assertSame([], $props['serviceReading']);
    }
}
