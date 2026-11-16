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
        $id = '/^[a-z0-9-]{1,64}$/';

        foreach ($files as $file) {
            $name = basename($file);
            $raw = Yaml::parseFile($file);
            $this->assertSame(basename($file, '.yml'), $raw['slug'], $name);
            $this->assertNotEmpty($raw['title'] ?? null, $name);
            $this->assertNotEmpty($raw['summary'] ?? null, $name);
            $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', (string) ($raw['updated'] ?? ''), "{$name} needs updated: 'YYYY-MM-DD'");
            $this->assertSame(['beginner', 'intermediate', 'advanced'], array_column($raw['stages'], 'level'), "{$name}: stages must be beginner, intermediate, advanced");
            $this->assertContains($raw['icon'] ?? null, RoadmapRepository::ICONS, "{$name}: icon must be one of RoadmapRepository::ICONS");
            $this->assertContains($raw['color'] ?? null, RoadmapRepository::COLORS, "{$name}: color must be one of RoadmapRepository::COLORS");
            $this->assertLessThanOrEqual(4, count($raw['logos'] ?? []), "{$name}: at most 4 logos");
            foreach ($raw['logos'] ?? [] as $logo) {
                $this->assertMatchesRegularExpression('#^/images/[a-z0-9/_.-]+\.(svg|png|webp)$#i', $logo, $name);
                $this->assertFileExists(public_path(ltrim($logo, '/')), "{$name}: missing logo {$logo}");
            }
            $topicIds = [];
            $lessonIds = [];
            foreach ($raw['stages'] as $stage) {
                $this->assertNotEmpty($stage['title'] ?? null, "{$name}: stage title");
                $this->assertNotEmpty($stage['topics'] ?? [], "{$name}: {$stage['level']} has no topics");
                foreach ($stage['topics'] as $topic) {
                    $where = "{$name} topic {$topic['id']}";
                    $this->assertMatchesRegularExpression($id, $topic['id'], $where);
                    $this->assertNotContains($topic['id'], $topicIds, "{$where}: duplicate topic id");
                    $this->assertNotContains($topic['id'], ['view', 'start', 'love', 'wishlist', 'lessons', 'comments'], "{$where}: reserved id");
                    $topicIds[] = $topic['id'];
                    $this->assertNotEmpty($topic['title'] ?? null, $where);
                    $this->assertNotEmpty($topic['summary'] ?? null, $where);
                    $lessons = $topic['lessons'] ?? [];
                    $this->assertGreaterThanOrEqual(2, count($lessons), "{$where}: needs at least 2 lessons");
                    $this->assertNotEmpty(array_filter($lessons, fn ($l) => ! ($l['optional'] ?? false)), "{$where}: needs a required lesson");
                    foreach ($lessons as $lesson) {
                        $lw = "{$where} lesson {$lesson['id']}";
                        $this->assertMatchesRegularExpression($id, $lesson['id'], $lw);
                        $this->assertNotContains($lesson['id'], $lessonIds, "{$lw}: lesson ids must be unique in the roadmap");
                        $this->assertNotSame('comments', $lesson['id'], "{$lw}: reserved id");
                        $lessonIds[] = $lesson['id'];
                        $this->assertNotEmpty($lesson['title'] ?? null, $lw);
                        $this->assertNotEmpty($lesson['summary'] ?? null, $lw);
                        $this->assertIsBool($lesson['optional'] ?? false, $lw);
                        $this->assertNotEmpty($lesson['learn'] ?? [], "{$lw}: no learn bullets");
                        if (isset($lesson['body'])) {
                            $this->assertIsString($lesson['body'], "{$lw}: body must be Markdown text");
                            $this->assertLessThanOrEqual(3000, strlen($lesson['body']), "{$lw}: keep the body short");
                            $this->assertStringNotContainsString('<', $lesson['body'], "{$lw}: no raw HTML in body");
                        }
                        $this->assertNotEmpty($lesson['resources'] ?? [], "{$lw}: no resources");
                        $public = 0;
                        foreach ($lesson['resources'] as $resource) {
                            if (isset($resource['post'])) {
                                $post = $blog->find($resource['post']);
                                $this->assertNotNull($post, "{$lw}: unknown post {$resource['post']}");
                                $public += $blog->isPublic($post) ? 1 : 0;

                                continue;
                            }
                            $public++;
                            $this->assertNotEmpty($resource['label'] ?? null, $lw);
                            $this->assertStringStartsWith('https://', $resource['url'] ?? '', $lw);
                            $this->assertContains($resource['kind'] ?? 'article', RoadmapRepository::RESOURCE_KINDS, $lw);
                        }
                        $this->assertGreaterThan(0, $public, "{$lw}: needs at least one public resource");
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
        $roadmap = ['title' => 'How the Internet Works', 'slug' => 'internet-networking'];
        $topic = ['id' => 'dns-basics', 'title' => 'DNS'];
        $site = rtrim(config('app.url'), '/');
        $tail = " I'm following the free How the Internet Works roadmap at {$site}/roadmaps/internet-networking (this lesson: {$site}/roadmaps/internet-networking/dns-basics/dns-records).";
        $lesson = ['id' => 'dns-records', 'title' => 'DNS records', 'summary' => 'How names become addresses.', 'learn' => ['A and AAAA', 'CNAME']];

        $this->assertSame(
            'I\'m learning How the Internet Works, at the beginner stage, on the topic "DNS". Teach me "DNS records": How names become addresses. Cover: A and AAAA; CNAME. Explain it simply with a real-world example, then give me 3 questions to check I understood.'.$tail,
            $repo->prompt($roadmap, 'beginner', $topic, $lesson),
        );
        $this->assertSame('Custom'.$tail, $repo->prompt($roadmap, 'beginner', $topic, $lesson + ['prompt' => 'Custom']));
        $this->assertSame('https://www.google.com/search?q='.urlencode('DNS records DNS'), $repo->searchUrl($topic, $lesson));
    }

    public function test_own_posts_resolve_and_come_first(): void
    {
        $lessons = collect((new RoadmapRepository)->all())
            ->flatMap(fn ($r) => $r['stages'])->flatMap(fn ($s) => $s['topics'])->flatMap(fn ($t) => $t['lessons']);
        $own = $lessons->flatMap(fn ($l) => $l['resources'])->where('own', true);

        $this->assertNotEmpty($own);
        $this->assertStringContainsString('/blog/', $own->first()['url']);
        foreach ($lessons as $lesson) {
            $flags = array_column($lesson['resources'], 'own');
            $sorted = $flags;
            rsort($sorted);
            $this->assertSame($sorted, $flags, "{$lesson['id']}: own posts must come first");
        }
    }

    public function test_draft_posts_are_left_out_until_public(): void
    {
        $blog = new BlogRepository;
        $urls = collect((new RoadmapRepository)->all())
            ->flatMap(fn ($r) => $r['stages'])->flatMap(fn ($s) => $s['topics'])->flatMap(fn ($t) => $t['lessons'])
            ->flatMap(fn ($l) => $l['resources'])->pluck('url');

        foreach ($urls as $url) {
            if (preg_match('#/blog/([a-z0-9-]+)$#', $url, $m) && ($post = $blog->find($m[1]))) {
                $this->assertTrue($blog->isPublic($post), "{$m[1]} is not public but is linked");
            }
        }
    }

    public function test_unknown_slug_returns_null(): void
    {
        $this->assertNull((new RoadmapRepository)->find('nope'));
        $this->assertNull((new RoadmapRepository)->find('../etc'));
    }
}
