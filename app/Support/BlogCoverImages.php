<?php

namespace App\Support;

final class BlogCoverImages
{
    private array $manifest;

    public function __construct(?string $manifestPath = null)
    {
        $path = $manifestPath ?? public_path('blog-assets/card-variants/manifest.json');
        $decoded = is_file($path) ? json_decode((string) file_get_contents($path), true) : [];
        $this->manifest = is_array($decoded) ? $decoded : [];
    }

    public function fallbackUrl(mixed $cover): ?string
    {
        return is_string($cover) && str_starts_with($cover, '/blog-assets/') ? url($cover) : null;
    }

    /** @return list<array{url: string, width: int}> */
    public function sources(mixed $cover): array
    {
        if (! is_string($cover) || ! str_starts_with($cover, '/blog-assets/')) {
            return [];
        }

        return array_values(array_map(fn (array $variant) => [
            'url' => Cdn::url($variant['path']),
            'width' => $variant['width'],
        ], $this->manifest[$cover] ?? []));
    }
}
