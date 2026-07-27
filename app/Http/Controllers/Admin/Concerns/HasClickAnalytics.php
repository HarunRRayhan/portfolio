<?php

namespace App\Http\Controllers\Admin\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Shared click-analytics helpers for the bio-link and short-link admin
 * dashboards. Both track clicks against a per-link table with the same shape
 * (created_at, country, referer), so the aggregation logic is identical.
 */
trait HasClickAnalytics
{
    /**
     * One row per day in the window, including days with no clicks -- a bar
     * chart with gaps silently rescales the x axis and misreads as continuous.
     *
     * The click query is passed in already scoped (e.g. to a single link) so
     * callers keep control over which rows are counted.
     *
     * @return list<array{date: string, clicks: int}>
     */
    protected function dailySeries(Builder $clicks, \DateTimeInterface $since, int $days): array
    {
        $counts = $clicks
            ->where('created_at', '>=', $since)
            ->selectRaw('date(created_at) as day, count(*) as clicks')
            ->groupBy('day')
            ->pluck('clicks', 'day');

        return collect(range(0, $days - 1))
            ->map(function (int $offset) use ($since, $counts) {
                $date = Carbon::parse($since)->addDays($offset)->toDateString();

                return [
                    'date' => $date,
                    'clicks' => (int) ($counts[$date] ?? 0),
                ];
            })
            ->all();
    }

    /**
     * Clicks per link within the window. The link model and the shape of each
     * returned row differ between dashboards, so the caller supplies both the
     * base query and a mapper.
     *
     * @param  callable(Model): array<string, mixed>  $mapper
     * @return list<array<string, mixed>>
     */
    protected function clicksByLink(Builder $links, \DateTimeInterface $since, callable $mapper): array
    {
        return $links
            ->withCount(['clicks as clicks' => fn ($q) => $q->where('created_at', '>=', $since)])
            ->orderByDesc('clicks')
            ->get()
            ->map($mapper)
            ->all();
    }

    /**
     * @return list<array{key: string, clicks: int}>
     */
    protected function groupCounts(Builder $query, string $column): array
    {
        return $query
            ->whereNotNull($column)
            ->selectRaw("{$column} as key, count(*) as clicks")
            ->groupBy($column)
            ->orderByDesc('clicks')
            ->limit(10)
            ->get()
            ->map(fn ($row) => ['key' => (string) $row->key, 'clicks' => (int) $row->clicks])
            ->all();
    }

    /**
     * Referers are grouped by host: the full URL fragments the counts into
     * near-duplicates that say nothing about where traffic came from.
     *
     * @return list<array{key: string, clicks: int}>
     */
    protected function refererCounts(Builder $query): array
    {
        return $query
            ->whereNotNull('referer')
            ->pluck('referer')
            ->map(fn (?string $url) => $url ? (parse_url($url, PHP_URL_HOST) ?: null) : null)
            ->filter()
            ->countBy()
            ->sortDesc()
            ->take(10)
            ->map(fn (int $clicks, string $host) => ['key' => $host, 'clicks' => $clicks])
            ->values()
            ->all();
    }
}
