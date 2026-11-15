<?php

namespace Tests\Feature;

use App\Support\BlogRepository;
use App\Support\RoadmapRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\Yaml\Yaml;
use Tests\TestCase;

class RoadmapContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_roadmap_is_valid(): void
    {
        $blog = new BlogRepository;
        $files = glob(resource_path('roadmaps/*.yml'));
        $this->assertNotEmpty($files);

        foreach ($files as $file) {
            $raw = Yaml::parseFile($file);
            $this->assertSame(basename($file, '.yml'), $raw['slug'], $file);
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', (string) ($raw['updated'] ?? ''), "{$file} needs updated: YYYY-MM-DD");
            $ids = [];
            foreach ($raw['stages'] as $stage) {
                $this->assertContains($stage['level'], RoadmapRepository::LEVELS, $file);
                foreach ($stage['steps'] as $step) {
                    $this->assertMatchesRegularExpression('/^[a-z0-9-]{1,64}$/', $step['id']);
                    $this->assertNotContains($step['id'], $ids, "Duplicate step id {$step['id']}");
                    $ids[] = $step['id'];
                    $this->assertNotEmpty($step['title']);
                    $this->assertNotEmpty($step['summary']);
                    $this->assertNotEmpty($step['learn'] ?? [], "{$step['id']} has no learn bullets");
                    $this->assertNotEmpty($step['resources'] ?? [], "{$step['id']} has no resources");
                    foreach ($step['resources'] as $resource) {
                        if (isset($resource['post'])) {
                            $post = $blog->find($resource['post']);
                            $this->assertNotNull($post, "Unknown post {$resource['post']}");

                            continue;
                        }
                        $this->assertNotEmpty($resource['label'] ?? null);
                        $this->assertStringStartsWith('https://', $resource['url'] ?? '');
                        $this->assertContains($resource['kind'] ?? 'article', RoadmapRepository::RESOURCE_KINDS);
                    }
                }
            }
        }
    }

    public function test_builds_on_points_at_a_real_roadmap(): void
    {
        $repo = new RoadmapRepository;
        foreach (['mlops', 'devsecops'] as $slug) {
            $roadmap = $repo->find($slug);
            $this->assertNotNull($roadmap, $slug);
            $this->assertSame('devops', $roadmap['builds_on']);
        }
        foreach ($repo->all() as $roadmap) {
            if (isset($roadmap['builds_on'])) {
                $this->assertNotNull($repo->find($roadmap['builds_on']), "{$roadmap['slug']} builds on a missing roadmap");
                $this->assertNotSame($roadmap['slug'], $roadmap['builds_on']);
            }
        }
    }

    public function test_internet_roadmap_has_all_three_stages(): void
    {
        $roadmap = (new RoadmapRepository)->find('internet-networking');

        $this->assertNotNull($roadmap);
        $this->assertSame(['beginner', 'intermediate', 'advanced'], array_column($roadmap['stages'], 'level'));
    }

    public function test_default_prompt_matches_template(): void
    {
        $repo = new RoadmapRepository;
        $roadmap = ['title' => 'How the Internet Works'];
        $step = ['title' => 'DNS', 'summary' => 'How names become addresses.', 'learn' => ['Resolvers', 'Records']];

        $this->assertSame(
            'I\'m learning How the Internet Works, at the beginner stage. Teach me "DNS": How names become addresses. Cover: Resolvers; Records. Explain it simply with a real-world example, then give me 3 questions to check I understood.',
            $repo->prompt($roadmap, 'beginner', $step),
        );
        $this->assertSame('Custom', $repo->prompt($roadmap, 'beginner', $step + ['prompt' => 'Custom']));
        $this->assertSame('https://www.google.com/search?q='.urlencode('DNS How the Internet Works'), $repo->searchUrl($roadmap, $step));
    }

    public function test_post_resources_resolve_to_own_links(): void
    {
        $roadmap = (new RoadmapRepository)->find('internet-networking');
        $own = collect($roadmap['stages'])->flatMap(fn ($s) => $s['steps'])->flatMap(fn ($s) => $s['resources'])->where('own', true);

        $this->assertNotEmpty($own);
        $this->assertStringContainsString('/blog/', $own->first()['url']);
        $this->assertNotEmpty($own->first()['label']);
    }

    public function test_draft_posts_are_left_out_until_public(): void
    {
        $roadmap = (new RoadmapRepository)->find('internet-networking');
        $urls = collect($roadmap['stages'])->flatMap(fn ($s) => $s['steps'])->flatMap(fn ($s) => $s['resources'])->pluck('url');

        // eight-load-balancer-algorithms is a draft scheduled in 2099.
        $this->assertFalse($urls->contains(fn ($u) => str_contains($u, 'eight-load-balancer-algorithms')));
        foreach (collect($roadmap['stages'])->flatMap(fn ($s) => $s['steps']) as $step) {
            $this->assertNotEmpty($step['resources'], "{$step['id']} has no public resources");
        }
    }

    public function test_unknown_slug_returns_null(): void
    {
        $this->assertNull((new RoadmapRepository)->find('nope'));
        $this->assertNull((new RoadmapRepository)->find('../etc'));
    }
}
