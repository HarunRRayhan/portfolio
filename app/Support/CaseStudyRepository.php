<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Symfony\Component\Yaml\Yaml;

class CaseStudyRepository
{
    private const CONTENT_DIR = 'case-studies';

    private const CACHE_KEY = 'case_studies.repository.payload';

    private const CACHE_TTL_MINUTES = 15;

    /**
     * @var array<int, array<string, mixed>>|null
     */
    private ?array $studies = null;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function studies(): array
    {
        return $this->load();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function indexStudies(): array
    {
        return collect($this->studies())
            ->reject(fn (array $study) => (bool) ($study['draft'] ?? false))
            ->map(fn (array $study) => $this->summarize($study))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $slug): ?array
    {
        return collect($this->studies())
            ->first(fn (array $study) => $study['slug'] === $slug);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function related(string $slug, int $limit = 3): array
    {
        return collect($this->studies())
            ->reject(fn (array $study) => $study['slug'] === $slug)
            ->reject(fn (array $study) => (bool) ($study['draft'] ?? false))
            ->sortByDesc(fn (array $study) => Carbon::parse($study['publishedAt'])->timestamp)
            ->take($limit)
            ->map(fn (array $study) => $this->summarize($study))
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function featured(int $limit = 3): array
    {
        return array_slice($this->indexStudies(), 0, $limit);
    }

    /**
     * Case studies grouped by service route slug (e.g. devops, aws-cloud).
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function groupedByServiceSlug(): array
    {
        $grouped = [];

        foreach ($this->indexStudies() as $summary) {
            foreach ($summary['serviceSlugs'] as $serviceSlug) {
                $grouped[$serviceSlug][] = $summary;
            }
        }

        return $grouped;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function forServiceSlug(string $serviceSlug, int $limit = 6): array
    {
        $grouped = $this->groupedByServiceSlug();

        return array_slice($grouped[$serviceSlug] ?? [], 0, $limit);
    }

    public function relativeUrl(string $slug): string
    {
        return '/case-studies/'.$slug;
    }

    public function absoluteUrl(string $slug): string
    {
        return rtrim(config('app.url', url('/')), '/').$this->relativeUrl($slug);
    }

    /**
     * @return array<string, mixed>
     */
    public function toDetailPayload(array $study): array
    {
        $summary = $this->summarize($study);

        return array_merge($summary, [
            'contentHtml' => $study['content']['html'] ?? '',
            'contentText' => $study['content']['text'] ?? '',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function summarize(array $study): array
    {
        $outcomes = collect($study['outcome'] ?? [])
            ->map(fn ($line) => (string) $line)
            ->values()
            ->all();

        $serviceSlugs = collect($study['serviceSlugs'] ?? [])
            ->map(fn ($slug) => (string) $slug)
            ->filter()
            ->values()
            ->all();

        $services = collect($study['services'] ?? [])
            ->map(fn ($label) => (string) $label)
            ->values()
            ->all();

        $techStack = collect($study['techStack'] ?? [])
            ->map(fn ($tech) => (string) $tech)
            ->values()
            ->all();

        $tags = collect($study['tags'] ?? [])
            ->map(function ($tag): array {
                if (is_string($tag)) {
                    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $tag) ?? $tag);

                    return ['name' => $tag, 'slug' => trim($slug, '-')];
                }

                if (is_array($tag) && isset($tag['name'])) {
                    return [
                        'name' => (string) $tag['name'],
                        'slug' => (string) ($tag['slug'] ?? $tag['name']),
                    ];
                }

                return ['name' => 'General', 'slug' => 'general'];
            })
            ->values()
            ->all();

        $headlineOutcome = $outcomes[0] ?? (string) ($study['problem'] ?? '');

        return [
            'slug' => (string) $study['slug'],
            'codename' => (string) ($study['codename'] ?? $study['title'] ?? $study['slug']),
            'title' => (string) ($study['title'] ?? $study['codename'] ?? $study['slug']),
            'client' => (string) ($study['client'] ?? ''),
            'industry' => (string) ($study['industry'] ?? ''),
            'duration' => (string) ($study['duration'] ?? ''),
            'problem' => (string) ($study['problem'] ?? ''),
            'approach' => (string) ($study['approach'] ?? ''),
            'outcomes' => $outcomes,
            'headlineOutcome' => $headlineOutcome,
            'services' => $services,
            'serviceSlugs' => $serviceSlugs,
            'techStack' => $techStack,
            'tags' => $tags,
            'brief' => (string) ($study['brief'] ?? $study['problem'] ?? ''),
            'publishedAt' => (string) $study['publishedAt'],
            'publishedAtHuman' => Carbon::parse($study['publishedAt'])->format('M j, Y'),
            'publishedAtIso' => Carbon::parse($study['publishedAt'])->toAtomString(),
            'readTimeInMinutes' => (int) ($study['readTimeInMinutes'] ?? $this->estimateReadMinutes($study['content']['text'] ?? '')),
            'readTimeLabel' => ((int) ($study['readTimeInMinutes'] ?? $this->estimateReadMinutes($study['content']['text'] ?? ''))).' min read',
            'coverImageUrl' => $study['coverImageUrl'] ?? null,
            'isDraft' => (bool) ($study['draft'] ?? false),
            'url' => $this->relativeUrl((string) $study['slug']),
            'canonicalUrl' => $this->absoluteUrl((string) $study['slug']),
        ];
    }

    /**
     * @return array{hasPublished: bool, hasDraft: bool, publishedCount: int, draftCount: int, nextDraft: array<string, mixed>|null}
     */
    public function publishPipelineStatus(): array
    {
        $all = $this->studies();
        $published = collect($all)->reject(fn (array $s) => (bool) ($s['draft'] ?? false));
        $drafts = collect($all)->filter(fn (array $s) => (bool) ($s['draft'] ?? false))
            ->sortBy(fn (array $s) => Carbon::parse($s['publishedAt'])->timestamp);

        $nextDraft = $drafts->first();

        return [
            'hasPublished' => $published->isNotEmpty(),
            'hasDraft' => $drafts->isNotEmpty(),
            'publishedCount' => $published->count(),
            'draftCount' => $drafts->count(),
            'nextDraft' => $nextDraft ? $this->summarize($nextDraft) : null,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function load(): array
    {
        if ($this->studies !== null) {
            return $this->studies;
        }

        $this->studies = Cache::remember(self::CACHE_KEY, now()->addMinutes(self::CACHE_TTL_MINUTES), function (): array {
            $paths = glob(resource_path(self::CONTENT_DIR.'/[!_.]*.md')) ?: [];

            if ($paths === []) {
                return [];
            }

            return collect($paths)
                ->map(fn (string $path) => $this->parseFile($path))
                ->sortByDesc(fn (array $study) => Carbon::parse($study['publishedAt'])->timestamp)
                ->values()
                ->all();
        });

        return $this->studies;
    }

    /**
     * @return array<string, mixed>
     */
    private function parseFile(string $path): array
    {
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("Unable to read case study file: {$path}");
        }

        if (! preg_match('/^---\R(.*?)\R---\R(.*)\z/s', $contents, $matches)) {
            throw new RuntimeException("Case study file has invalid frontmatter: {$path}");
        }

        $meta = Yaml::parse($matches[1]);

        if (! is_array($meta) || ! isset($meta['slug'], $meta['codename'], $meta['publishedAt'])) {
            throw new RuntimeException("Case study file has unexpected metadata: {$path}");
        }

        $body = trim($matches[2]);

        if ($body === '') {
            throw new RuntimeException("Case study file has empty content body: {$path}");
        }

        $slug = (string) $meta['slug'];
        $text = $this->contentText($body);

        $serviceLabels = collect($meta['services'] ?? [])
            ->map(fn ($label) => (string) $label)
            ->values()
            ->all();

        return array_merge($meta, [
            'slug' => $slug,
            'publishedAt' => (string) $meta['publishedAt'],
            'readTimeInMinutes' => (int) ($meta['readTimeInMinutes'] ?? $this->estimateReadMinutes($text)),
            'draft' => filter_var($meta['draft'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'coverImageUrl' => $meta['coverImageUrl'] ?? '/case-studies-assets/'.$slug.'/cover.jpg',
            'serviceSlugs' => CaseStudyServiceMap::slugsForLabels($serviceLabels),
            'content' => [
                'html' => $body,
                'text' => $text,
            ],
        ]);
    }

    private function contentText(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }

    private function estimateReadMinutes(string $text): int
    {
        $words = str_word_count($text);

        return max(3, (int) ceil($words / 220));
    }
}