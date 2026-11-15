<?php

namespace App\Support;

use Symfony\Component\Yaml\Yaml;

/**
 * Learning roadmaps: one YAML file per roadmap in resources/roadmaps/{slug}.yml.
 * Step ids are stable keys for user progress; renaming one drops that tick.
 */
final class RoadmapRepository
{
    public const LEVELS = ['beginner', 'intermediate', 'advanced'];

    public const FREE_LEVEL = 'beginner';

    public const RESOURCE_KINDS = ['article', 'docs', 'video', 'course', 'tool'];

    /** Per instance, not static: a long-lived worker would otherwise keep stale content and draft status. */
    /** @var array<string, array<string, mixed>>|null */
    private ?array $cache = null;

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        $roadmaps = array_values($this->load());
        usort($roadmaps, fn ($a, $b) => ($a['order'] ?? 99) <=> ($b['order'] ?? 99));

        return $roadmaps;
    }

    /** @return array<string, mixed>|null */
    public function find(string $slug): ?array
    {
        return $this->load()[$slug] ?? null;
    }

    /** @return array<string, string> step id => level */
    public function stepIds(array $roadmap): array
    {
        $ids = [];
        foreach ($roadmap['stages'] as $stage) {
            foreach ($stage['steps'] as $step) {
                $ids[$step['id']] = $stage['level'];
            }
        }

        return $ids;
    }

    public function prompt(array $roadmap, string $level, array $step): string
    {
        if (filled($step['prompt'] ?? null)) {
            return (string) $step['prompt'];
        }

        return sprintf(
            'I\'m learning %s, at the %s stage. Teach me "%s": %s Cover: %s. Explain it simply with a real-world example, then give me 3 questions to check I understood.',
            $roadmap['title'], $level, $step['title'], $step['summary'], implode('; ', $step['learn'] ?? []),
        );
    }

    public function searchUrl(array $roadmap, array $step): string
    {
        return 'https://www.google.com/search?q='.urlencode($step['title'].' '.$roadmap['title']);
    }

    public function absoluteUrl(string $slug): string
    {
        return SiteCatalog::siteUrl().'/roadmaps/'.$slug;
    }

    /** @return array<string, array<string, mixed>> */
    private function load(): array
    {
        if ($this->cache !== null) {
            return $this->cache;
        }

        $blog = new BlogRepository;
        $roadmaps = [];
        foreach (glob(resource_path('roadmaps/*.yml')) ?: [] as $file) {
            $raw = Yaml::parseFile($file);
            foreach ($raw['stages'] as &$stage) {
                foreach ($stage['steps'] as &$step) {
                    $step['learn'] = array_values($step['learn'] ?? []);
                    $step['resources'] = array_values(array_filter(array_map(
                        fn (array $r) => $this->resource($r, $blog), $step['resources'] ?? [],
                    )));
                }
                unset($step);
            }
            unset($stage);
            $roadmaps[$raw['slug']] = $raw;
        }

        return $this->cache = $roadmaps;
    }

    /** @return array{label: string, url: string, kind: string, own: bool}|null */
    private function resource(array $r, BlogRepository $blog): ?array
    {
        if (isset($r['post'])) {
            $post = $blog->find((string) $r['post']);

            // Drafts stay out until they go public, then appear with no YAML change.
            return $post && $blog->isPublic($post) ? [
                'label' => (string) $post['title'],
                'url' => $blog->absoluteUrl((string) $post['slug']),
                'kind' => 'article',
                'own' => true,
            ] : null;
        }

        return [
            'label' => (string) $r['label'],
            'url' => (string) $r['url'],
            'kind' => (string) ($r['kind'] ?? 'article'),
            'own' => false,
        ];
    }
}
