<?php

namespace App\Support;

use Illuminate\Support\Carbon;

final class ContentDates
{
    /** updatedAt is editorial metadata for a substantive change, never file mtime. */
    public static function lastModified(string $publishedAt, mixed $updatedAt): string
    {
        $published = Carbon::parse($publishedAt);
        if (is_string($updatedAt) && preg_match('/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2}))?$/D', $updatedAt)) {
            try {
                $parsed = new \DateTimeImmutable($updatedAt);
                $errors = \DateTimeImmutable::getLastErrors();
                if ($errors !== false && ($errors['warning_count'] || $errors['error_count'])) {
                    return $published->toAtomString();
                }
                $updated = Carbon::instance($parsed);
                if ($updated->greaterThanOrEqualTo($published) && ! $updated->isFuture()) {
                    return $updated->toAtomString();
                }
            } catch (\Exception) {
                // Invalid optional metadata must not break the public sitemap.
            }
        }

        return $published->toAtomString();
    }
}
