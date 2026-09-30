<?php

namespace Tests\Feature;

use App\Models\ConsultationSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SeoOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public static function publicPages(): array
    {
        return array_map(fn ($path) => [$path], [
            '/', '/contact', '/blog', '/services/devops', '/bio', '/hrr',
            '/sponsor-me', '/consultation', '/products',
            '/blog/production-ai-code-review-for-terraform-and-lambda-prs',
        ]);
    }

    #[DataProvider('publicPages')]
    public function test_initial_html_has_one_managed_set_of_page_metadata(string $path): void
    {
        config(['inertia.ssr.enabled' => false]);
        $html = $this->get($path)->assertOk()->getContent();
        $document = new \DOMDocument;
        @$document->loadHTML($html);
        $xpath = new \DOMXPath($document);
        foreach (['//head/title', '//head/link[@rel="canonical"]', '//head/meta[@name="description"]'] as $selector) {
            $nodes = $xpath->query($selector);
            $this->assertSame(1, $nodes->length, $path.' must have one '.$selector);
            $this->assertTrue($nodes->item(0)->hasAttribute('data-inertia'), $selector.' must be replaceable on navigation');
        }
        $this->assertSame(rtrim(config('app.url'), '/').$path, $xpath->query('//head/link[@rel="canonical"]')->item(0)->getAttribute('href'));
        foreach ($xpath->query('//head/script[@type="application/ld+json"]') as $script) {
            $this->assertNotSame('', $script->getAttribute('data-inertia'), 'Schema must have an Inertia key');
            $this->assertIsArray(json_decode($script->textContent, true));
        }
    }

    public function test_sponsor_metadata_is_available_before_javascript_runs(): void
    {
        $html = $this->get('/sponsor-me?checkout=success')->assertOk()->getContent();
        $document = new \DOMDocument;
        @$document->loadHTML($html);
        $xpath = new \DOMXPath($document);
        $this->assertStringContainsString('Why Sponsor My Work?', $xpath->query('//head/title')->item(0)->textContent);
        $this->assertStringContainsString('one-time or monthly contribution', $xpath->query('//head/meta[@name="description"]')->item(0)->getAttribute('content'));
        $this->assertSame(rtrim(config('app.url'), '/').'/sponsor-me', $xpath->query('//head/link[@rel="canonical"]')->item(0)->getAttribute('href'));
    }

    public function test_successful_ssr_owns_the_head_without_a_second_blade_copy(): void
    {
        config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
        Http::fake(['127.0.0.1:13714/*' => Http::response([
            'head' => [
                '<title data-inertia="">Rendered homepage</title>',
                '<link rel="canonical" href="https://example.test/" data-inertia="canonical">',
                '<meta name="description" content="Rendered description" data-inertia="description">',
            ],
            'body' => '<div id="app"><h1>Rendered homepage</h1></div>',
        ])]);
        $html = $this->get('/')->assertOk()->getContent();
        $document = new \DOMDocument;
        @$document->loadHTML($html);
        $xpath = new \DOMXPath($document);
        $this->assertSame(1, $xpath->query('//head/title')->length);
        $this->assertSame(1, $xpath->query('//head/link[@rel="canonical"]')->length);
        $this->assertSame(1, $xpath->query('//head/meta[@name="description"]')->length);
        $this->assertStringContainsString('<h1>Rendered homepage</h1>', $html);
    }

    public function test_schema_escapes_script_delimiters_without_changing_the_json_value(): void
    {
        $name = 'An example </script><script>alert(1)</script>';
        $html = view('partials.seo-meta', ['seo' => [
            'title' => 'Example', 'description' => 'Example', 'canonicalUrl' => 'https://example.test/',
            'jsonLd' => [['@context' => 'https://schema.org', '@type' => 'WebPage', 'name' => $name]],
        ]])->render();
        $document = new \DOMDocument;
        @$document->loadHTML($html);
        $scripts = $document->getElementsByTagName('script');
        $this->assertSame(1, $scripts->length);
        $this->assertSame($name, json_decode($scripts->item(0)->textContent, true)['name']);
    }

    public function test_consultation_schema_preserves_current_promotional_prices_and_exhaustion(): void
    {
        $this->get('/consultation', $this->inertiaHeaders())->assertOk()
            ->assertJsonPath('props.seo.jsonLd.0.offers.0.price', '149.00')
            ->assertJsonPath('props.seo.jsonLd.0.offers.0.priceCurrency', 'USD');
        ConsultationSetting::setValue('consultation_booking_promotion_claimed_count', '1001');
        $this->get('/consultation', $this->inertiaHeaders())->assertOk()
            ->assertJsonPath('props.seo.jsonLd.0.offers.0.price', '249.00');
    }
}
