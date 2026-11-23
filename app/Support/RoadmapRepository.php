<?php

namespace App\Support;

use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;

/**
 * Learning roadmaps: one YAML file per roadmap in resources/roadmaps/{slug}.yml.
 * Step ids are stable keys for user progress; renaming one drops that tick.
 */
final class RoadmapRepository
{
    public const LEVELS = ['beginner', 'intermediate', 'advanced'];

    public const FREE_LEVEL = 'beginner';

    /** Lucide icons the roadmap art may use (mapped in resources/js/Components/Roadmap/RoadmapArt.tsx). */
    public const ICONS = ['globe', 'cloud', 'infinity', 'activity', 'brain-circuit', 'shield-check', 'network', 'database', 'sparkles', 'rocket', 'library', 'compass'];

    /** Accent palettes for the roadmap art. */
    public const COLORS = ['sky', 'amber', 'indigo', 'rose', 'violet', 'emerald', 'cyan', 'blue', 'fuchsia', 'orange', 'teal', 'lime'];

    /** Filter groups on /roadmaps, in display order. */
    public const CATEGORIES = ['foundations' => 'Foundations', 'cloud-devops' => 'Cloud & DevOps', 'ai-ml' => 'AI & ML', 'career' => 'Career paths'];

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

    /**
     * Every lesson in the roadmap, in order. Lesson ids are unique per roadmap and are the progress keys.
     *
     * @return array<string, array{level: string, free: bool, topic: string, optional: bool}>
     */
    public function lessonIndex(array $roadmap): array
    {
        $ids = [];
        foreach ($roadmap['stages'] as $stage) {
            foreach ($stage['topics'] as $topic) {
                foreach ($topic['lessons'] as $lesson) {
                    $ids[$lesson['id']] = ['level' => $stage['level'], 'free' => $stage['free'], 'topic' => $topic['id'], 'optional' => $lesson['optional']];
                }
            }
        }

        return $ids;
    }

    /**
     * Slugs a roadmap builds on. `builds_on` in the YAML is one slug or a list.
     *
     * @return list<string>
     */
    public function prerequisiteSlugs(array $roadmap): array
    {
        return array_values(array_filter(array_map('strval', (array) ($roadmap['builds_on'] ?? []))));
    }

    /**
     * Roadmaps that list this one as a prerequisite, in roadmap order.
     *
     * @return list<array<string, mixed>>
     */
    public function successors(string $slug): array
    {
        return array_values(array_filter($this->all(), fn (array $r) => in_array($slug, $this->prerequisiteSlugs($r), true)));
    }

    /** Where a topic or lesson went when it moved to a roadmap that builds on this one (ids are kept on a move). */
    public function movedTo(string $slug, string $topicId, ?string $lessonId = null): ?string
    {
        foreach ($this->successors($slug) as $child) {
            if ($lessonId !== null && isset($this->lessonIndex($child)[$lessonId])) {
                return '/roadmaps/'.$child['slug'].'/'.$this->lessonIndex($child)[$lessonId]['topic'].'/'.$lessonId;
            }
            if ($lessonId === null && $this->findTopic($child, $topicId)) {
                return '/roadmaps/'.$child['slug'].'/'.$topicId;
            }
        }

        return null;
    }

    /**
     * A topic with its stage and its neighbours on the path.
     *
     * @return array{stage: array<string, mixed>, topic: array<string, mixed>, number: int, prev: ?array<string, mixed>, next: ?array<string, mixed>}|null
     */
    public function findTopic(array $roadmap, string $topicId): ?array
    {
        $flat = [];
        foreach ($roadmap['stages'] as $stage) {
            foreach ($stage['topics'] as $topic) {
                $flat[] = ['stage' => $stage, 'topic' => $topic];
            }
        }
        foreach ($flat as $i => $item) {
            if ($item['topic']['id'] === $topicId) {
                return $item + ['number' => $i + 1, 'prev' => $flat[$i - 1]['topic'] ?? null, 'next' => $flat[$i + 1]['topic'] ?? null];
            }
        }

        return null;
    }

    public function prompt(array $roadmap, string $level, array $topic, array $lesson): string
    {
        $ask = filled($lesson['prompt'] ?? null) ? (string) $lesson['prompt'] : sprintf(
            'I\'m learning %s, at the %s stage, on the topic "%s". Teach me "%s": %s Cover: %s. Explain it simply with a real-world example, then give me 3 questions to check I understood.',
            $roadmap['title'], $level, $topic['title'], $lesson['title'], $lesson['summary'], implode('; ', $lesson['learn']),
        );

        // Tell the AI where this comes from, so it can follow the same path and point back to it.
        return $ask.sprintf(
            ' I\'m following the free %s roadmap at %s (this lesson: %s/%s).',
            $roadmap['title'], $this->absoluteUrl($roadmap['slug']), $this->topicUrl($roadmap['slug'], $topic['id']), $lesson['id'],
        );
    }

    public function searchUrl(array $topic, array $lesson): string
    {
        return 'https://www.google.com/search?q='.urlencode($lesson['title'].' '.$topic['title']);
    }

    /**
     * Lessons whose title, topic, summary or learn bullets contain every word of the query, best match first.
     * Paid-level lessons are left out unless the caller may open them.
     *
     * @return list<array{title: string, summary: string, roadmap: string, topic: string, url: string}>
     */
    public function searchLessons(string $query, bool $includePaid, int $limit = 20): array
    {
        $words = array_values(array_unique(preg_split('/\s+/', mb_strtolower(trim($query)), -1, PREG_SPLIT_NO_EMPTY) ?: []));
        if ($words === []) {
            return [];
        }

        $hits = [];
        foreach ($this->all() as $roadmap) {
            foreach ($roadmap['stages'] as $stage) {
                if (! $stage['free'] && ! $includePaid) {
                    continue;
                }
                foreach ($stage['topics'] as $topic) {
                    foreach ($topic['lessons'] as $lesson) {
                        $title = mb_strtolower($lesson['title']);
                        $rest = mb_strtolower($topic['title'].' '.$lesson['summary'].' '.implode(' ', $lesson['learn']).' '.$roadmap['title']);
                        $score = 0;
                        foreach ($words as $w) {
                            if (str_contains($title, $w)) {
                                $score += 3 + (str_starts_with($title, $w) ? 1 : 0);
                            } elseif (str_contains($rest, $w)) {
                                $score += 1;
                            } else {
                                continue 2; // every word must match somewhere
                            }
                        }
                        $hits[] = [$score, [
                            'title' => $lesson['title'], 'summary' => $lesson['summary'], 'roadmap' => $roadmap['title'], 'topic' => $topic['title'],
                            'url' => '/roadmaps/'.$roadmap['slug'].'/'.$topic['id'].'/'.$lesson['id'],
                        ]];
                    }
                }
            }
        }
        usort($hits, fn ($a, $b) => $b[0] <=> $a[0]); // stable: ties keep roadmap order

        return array_map(fn ($h) => $h[1], array_slice($hits, 0, $limit));
    }

    public function topicUrl(string $slug, string $topicId): string
    {
        return $this->absoluteUrl($slug).'/'.$topicId;
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
                // Beginner is always free; `free: true` on a roadmap opens every level of it.
                $stage['free'] = $stage['level'] === self::FREE_LEVEL || (bool) ($raw['free'] ?? false);
                foreach ($stage['topics'] as &$topic) {
                    foreach ($topic['lessons'] as &$lesson) {
                        $lesson['optional'] = (bool) ($lesson['optional'] ?? false);
                        $lesson['learn'] = array_values($lesson['learn'] ?? []);
                        // The short written lesson: Markdown in the YAML, raw HTML and unsafe links stripped.
                        $lesson['bodyHtml'] = filled($lesson['body'] ?? null)
                            ? Str::markdown((string) $lesson['body'], ['html_input' => 'strip', 'allow_unsafe_links' => false])
                            : null;
                        // Diagrams live in public/images and are served from the media CDN like other images.
                        $lesson['bodyHtml'] = $lesson['bodyHtml'] ? preg_replace_callback('#src="(/images/[^"]+)"#', fn ($m) => 'src="'.e(Cdn::url($m[1])).'"', $lesson['bodyHtml']) : null;
                        $resources = array_values(array_filter(array_map(
                            fn (array $r) => $this->resource($r, $blog), $lesson['resources'] ?? [],
                        )));
                        // Own posts first, then outside sources, each group in file order.
                        usort($resources, fn ($a, $b) => $b['own'] <=> $a['own']);
                        $lesson['resources'] = $resources;
                    }
                    unset($lesson);
                }
                unset($topic);
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
