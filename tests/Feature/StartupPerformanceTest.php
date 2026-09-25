<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StartupPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_only_receives_featured_case_studies(): void
    {
        $props = $this->get('/')->assertOk()->viewData('page')['props'];

        $this->assertSame([], $props['caseStudiesByService']);
        $this->assertNotEmpty($props['featuredCaseStudies']);
    }

    public function test_service_page_only_receives_its_own_related_case_studies(): void
    {
        $props = $this->get('/services/vibe-code-migration')->assertOk()->viewData('page')['props'];

        $this->assertSame([], $props['featuredCaseStudies']);
        $groups = $props['caseStudiesByService'];
        $this->assertSame(['vibe-code-migration'], array_keys($groups));
        $this->assertNotEmpty($groups['vibe-code-migration']);
    }

    public function test_unrelated_page_does_not_receive_case_study_payloads(): void
    {
        $props = $this->get('/contact')->assertOk()->viewData('page')['props'];

        $this->assertSame([], $props['caseStudiesByService']);
        $this->assertSame([], $props['featuredCaseStudies']);
    }

    public function test_analytics_queues_events_before_loading_without_losing_initial_page_location(): void
    {
        config(['services.ga4.measurement_id' => 'G-PERFORMANCE']);
        $html = $this->get('/')->assertOk()->getContent();
        preg_match('/<script>\s*(window\.dataLayer[\s\S]*?)<\/script>/', $html, $matches);
        $this->assertNotEmpty($matches[1] ?? null);

        $source = json_encode($matches[1], JSON_THROW_ON_ERROR);
        $script = <<<JS
        const assert = require('node:assert/strict');
        const vm = require('node:vm');
        for (const idleSupported of [true, false]) {
            for (const alreadyLoaded of [true, false]) {
                const scheduled = [];
                const inserted = [];
                let onLoad;
                const context = {
                    location: { href: 'https://harun.dev/' },
                    document: {
                        readyState: alreadyLoaded ? 'complete' : 'loading',
                        title: 'Homepage',
                        createElement: () => ({}),
                        head: { appendChild: script => inserted.push(script) },
                    },
                    addEventListener: (name, fn, options) => {
                        assert.equal(name, 'load');
                        assert.equal(options.once, true);
                        onLoad = fn;
                    },
                    setTimeout: fn => scheduled.push(fn),
                };
                if (idleSupported) context.requestIdleCallback = fn => scheduled.push(fn);
                context.window = context;
                vm.createContext(context);
                vm.runInContext({$source}, context);
                assert.equal(inserted.length, 0);
                assert.equal(scheduled.length, alreadyLoaded ? 1 : 0);
                context.gtag('event', 'generate_lead', { method: 'contact_form' });
                context.location.href = 'https://harun.dev/contact';
                if (!alreadyLoaded) onLoad();
                scheduled[0]();
                assert.equal(inserted.length, 1);
                assert.equal(inserted[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-PERFORMANCE');
                assert.equal(inserted[0].async, true);
                assert.equal(context.dataLayer[1][2].page_location, 'https://harun.dev/');
                assert.equal(context.dataLayer[2][1], 'generate_lead');
            }
        }
        JS;

        exec('node --eval '.escapeshellarg($script).' 2>&1', $output, $exit);
        $this->assertSame(0, $exit, implode("\n", $output));
    }
}
