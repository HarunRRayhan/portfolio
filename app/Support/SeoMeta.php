<?php

namespace App\Support;

final class SeoMeta
{
    /**
     * @param  list<array<string, mixed>>  $jsonLd
     */
    public function __construct(
        public readonly string $title,
        public readonly string $description,
        public readonly string $canonicalUrl,
        public readonly ?string $ogImage = null,
        public readonly string $ogType = 'website',
        public readonly array $jsonLd = [],
        public readonly bool $noindex = false,
        public readonly ?string $ogTitle = null,
    ) {}

    /**
     * @return array{
     *     title: string,
     *     description: string,
     *     canonicalUrl: string,
     *     ogImage: ?string,
     *     ogType: string,
     *     jsonLd: list<array<string, mixed>>,
     *     noindex: bool,
     *     ogTitle: string
     * }
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => self::clampDescription($this->description),
            'canonicalUrl' => $this->canonicalUrl,
            'ogImage' => $this->ogImage ?: SeoCatalog::defaultOgImage(),
            'ogType' => $this->ogType,
            'jsonLd' => $this->jsonLd,
            'noindex' => $this->noindex,
            'ogTitle' => $this->ogTitle ?? $this->title,
        ];
    }

    /**
     * Search engines truncate meta descriptions past about 160 characters.
     * Cut at a word boundary and count the ellipsis inside the limit.
     */
    public static function clampDescription(string $description): string
    {
        $description = trim($description);

        if (mb_strlen($description) <= 160) {
            return $description;
        }

        $cut = mb_substr($description, 0, 159);
        $space = mb_strrpos($cut, ' ');

        if ($space !== false) {
            $cut = mb_substr($cut, 0, $space);
        }

        return rtrim($cut, " ,;:.-\u{2013}\u{2014}\u{2026}").'…';
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            title: (string) $data['title'],
            description: (string) $data['description'],
            canonicalUrl: (string) $data['canonicalUrl'],
            ogImage: isset($data['ogImage']) ? (string) $data['ogImage'] : null,
            ogType: (string) ($data['ogType'] ?? 'website'),
            jsonLd: is_array($data['jsonLd'] ?? null) ? $data['jsonLd'] : [],
            noindex: (bool) ($data['noindex'] ?? false),
            ogTitle: isset($data['ogTitle']) ? (string) $data['ogTitle'] : null,
        );
    }

    /**
     * @return array<string, string>
     */
    public static function organizationGraph(?string $siteUrl = null): array
    {
        $siteUrl = rtrim($siteUrl ?? (string) config('app.url', url('/')), '/');

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            '@id' => $siteUrl.'/#organization',
            'name' => 'Harun R. Rayhan',
            'url' => $siteUrl,
            'logo' => $siteUrl.'/android-chrome-512x512.png',
        ];
    }
}
