<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SiteSeoTest extends TestCase
{
    /**
     * @return list<array<string, mixed>>
     */
    private function jsonLdGraphs(string $html): array
    {
        preg_match_all(
            '/<script type="application\/ld\+json">\s*(.*?)\s*<\/script>/s',
            $html,
            $matches,
        );

        $graphs = [];

        foreach ($matches[1] as $json) {
            $decoded = json_decode($json, true);
            $this->assertIsArray($decoded, 'JSON-LD script must parse as JSON: '.$json);
            $graphs[] = $decoded;
        }

        return $graphs;
    }

    #[Test]
    public function it_emits_valid_organization_json_ld_on_the_homepage(): void
    {
        $response = $this->get('/');

        $response->assertOk();

        $graphs = $this->jsonLdGraphs($response->getContent());
        $organization = collect($graphs)->first(
            fn (array $graph) => ($graph['@type'] ?? null) === 'Organization',
        );

        $this->assertNotNull($organization, 'Homepage must include Organization JSON-LD');
        $this->assertSame('https://schema.org', $organization['@context'] ?? null);
        $this->assertSame('Harun R. Rayhan', $organization['name'] ?? null);
        $this->assertStringEndsWith('/#organization', (string) ($organization['@id'] ?? ''));
    }

    #[Test]
    public function it_lists_service_bio_and_products_urls_once_in_the_sitemap(): void
    {
        $response = $this->get('/sitemap.xml');
        $response->assertOk();

        $siteUrl = rtrim(config('app.url', url('/')), '/');
        $html = $response->getContent();

        preg_match_all('#<loc>(.*?)</loc>#', $html, $matches);
        $locs = $matches[1];

        $expected = [
            $siteUrl.'/services/cloud-architecture',
            $siteUrl.'/services/devops',
            $siteUrl.'/services/infrastructure-as-code',
            $siteUrl.'/services/serverless-infrastructure',
            $siteUrl.'/services/automated-deployment',
            $siteUrl.'/services/security-consulting',
            $siteUrl.'/services/performance-optimization',
            $siteUrl.'/services/infrastructure-migration',
            $siteUrl.'/services/mlops',
            $siteUrl.'/services/database-migration',
            $siteUrl.'/services/monitoring-observability',
            $siteUrl.'/services/database-optimization',
            $siteUrl.'/services/aws-cloud',
            $siteUrl.'/services/multi-cloud-architecture',
            $siteUrl.'/services/vibe-scaling',
            $siteUrl.'/services/vibe-code-migration',
            $siteUrl.'/bio',
            $siteUrl.'/hrr',
            $siteUrl.'/products',
        ];

        foreach ($expected as $url) {
            $this->assertContains($url, $locs, "Sitemap must include {$url}");
            $this->assertSame(1, count(array_filter($locs, fn (string $loc) => $loc === $url)), "{$url} must appear once");
        }

        $this->assertNotContains($siteUrl.'/privacy', $locs);
        $this->assertNotContains($siteUrl.'/terms', $locs);
    }

    #[Test]
    public function it_emits_server_rendered_canonical_and_description_on_a_service_page(): void
    {
        $siteUrl = rtrim(config('app.url', url('/')), '/');
        $canonical = $siteUrl.'/services/devops';

        $response = $this->get('/services/devops');
        $response->assertOk();

        $html = $response->getContent();

        $this->assertStringContainsString('<link rel="canonical" href="'.$canonical.'">', $html);
        $this->assertStringContainsString('name="description" content="Transform your development and operations with expert DevOps consulting services.', $html);
        $this->assertStringContainsString('property="og:description" content="Transform your development and operations with expert DevOps consulting services.', $html);
        $this->assertStringContainsString('property="og:url" content="'.$canonical.'"', $html);
        $this->assertStringContainsString('property="og:site_name" content="Harun R. Rayhan"', $html);
        $this->assertStringContainsString('property="og:image"', $html);
        $this->assertStringNotContainsString('href={window.location.href}', $html);
    }

    #[Test]
    public function it_emits_homepage_meta_in_the_first_html(): void
    {
        $siteUrl = rtrim(config('app.url', url('/')), '/');

        $response = $this->get('/');
        $response->assertOk();

        $html = $response->getContent();

        $this->assertStringContainsString('<link rel="canonical" href="'.$siteUrl.'/">', $html);
        $this->assertStringContainsString('name="description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation."', $html);
        $this->assertStringContainsString('property="og:description" content="Expert software engineer and DevOps consultant specializing in cloud architecture, AWS solutions, and infrastructure automation."', $html);
        $this->assertStringContainsString('property="og:title"', $html);
        $this->assertStringContainsString('property="og:site_name" content="Harun R. Rayhan"', $html);
        $this->assertStringContainsString('property="og:image"', $html);
        $this->assertStringContainsString('name="twitter:description"', $html);
        $this->assertStringContainsString('name="twitter:card"', $html);
    }

    #[Test]
    public function it_emits_faq_page_json_ld_on_a_service_page(): void
    {
        $response = $this->get('/services/devops');
        $response->assertOk();

        $graphs = $this->jsonLdGraphs($response->getContent());
        $faq = collect($graphs)->first(
            fn (array $graph) => ($graph['@type'] ?? null) === 'FAQPage',
        );

        $this->assertNotNull($faq, 'DevOps page must include FAQPage JSON-LD');
        $this->assertNotEmpty($faq['mainEntity'] ?? []);
        $this->assertSame('What DevOps tools do you use?', $faq['mainEntity'][0]['name'] ?? null);
    }

    #[Test]
    public function it_emits_person_json_ld_with_same_as_on_the_homepage(): void
    {
        $response = $this->get('/');
        $response->assertOk();

        $graphs = $this->jsonLdGraphs($response->getContent());
        $person = collect($graphs)->first(
            fn (array $graph) => ($graph['@type'] ?? null) === 'Person',
        );

        $this->assertNotNull($person, 'Homepage must include Person JSON-LD');
        $this->assertContains('https://github.com/HarunRRayhan', $person['sameAs'] ?? []);
        $this->assertContains('https://www.linkedin.com/in/harunrrayhan/', $person['sameAs'] ?? []);
        $this->assertContains('https://x.com/harundotdev', $person['sameAs'] ?? []);
    }

    #[Test]
    public function it_points_robots_txt_at_the_sitemap_and_llms_index(): void
    {
        $response = $this->get('/robots.txt');
        $response->assertOk();

        $body = $response->getContent();
        $siteUrl = rtrim(config('app.url', url('/')), '/');

        $this->assertStringContainsString('Sitemap: '.$siteUrl.'/sitemap.xml', $body);
        $this->assertStringContainsString($siteUrl.'/llms.txt', $body);
        $this->assertStringContainsString('Do not use this content for training', $body);
    }
}
