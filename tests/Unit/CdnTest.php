<?php

namespace Tests\Unit;

use App\Support\Cdn;
use Tests\TestCase;

class CdnTest extends TestCase
{
    public function test_configured_base_url_prefixes_media(): void
    {
        config(['services.assets.base_url' => 'https://cdn.harun.dev']);

        $this->assertSame('https://cdn.harun.dev', Cdn::baseUrl());
        $this->assertSame(
            'https://cdn.harun.dev/blog-assets/example/cover.jpg',
            Cdn::url('/blog-assets/example/cover.jpg'),
        );
    }

    public function test_rewrite_html_prefixes_media_paths(): void
    {
        config(['services.assets.base_url' => 'https://cdn.harun.dev']);

        $html = '<img src="/blog-assets/post/a.jpg" alt="x"><a href="/images/og/bio.jpg">og</a>';
        $out = Cdn::rewriteHtml($html);

        $this->assertStringContainsString('src="https://cdn.harun.dev/blog-assets/post/a.jpg"', $out);
        $this->assertStringContainsString('href="https://cdn.harun.dev/images/og/bio.jpg"', $out);
    }

    public function test_build_paths_stay_same_origin(): void
    {
        config([
            'services.assets.base_url' => 'https://cdn.harun.dev',
            'app.url' => 'https://harun.dev',
        ]);

        $url = Cdn::url('/build/assets/app.js');

        $this->assertStringContainsString('/build/assets/app.js', $url);
        $this->assertStringNotContainsString('cdn.harun.dev', $url);
    }

    public function test_empty_base_keeps_html_unchanged(): void
    {
        config(['services.assets.base_url' => '']);

        $this->assertSame('', Cdn::baseUrl());
        $this->assertSame(
            '<img src="/blog-assets/post/a.jpg">',
            Cdn::rewriteHtml('<img src="/blog-assets/post/a.jpg">'),
        );
    }
}
