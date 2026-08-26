@php
    /** @var array<string, mixed> $seo */
    $title = (string) ($seo['title'] ?? '');
    $description = (string) ($seo['description'] ?? '');
    $canonicalUrl = (string) ($seo['canonicalUrl'] ?? '');
    $ogImage = isset($seo['ogImage']) && $seo['ogImage'] !== ''
        ? (string) $seo['ogImage']
        : \App\Support\SeoCatalog::defaultOgImage();
    $ogType = (string) ($seo['ogType'] ?? 'website');
    $siteName = \App\Support\SeoCatalog::siteName();
    $noindex = (bool) ($seo['noindex'] ?? false);
    $jsonLd = is_array($seo['jsonLd'] ?? null) ? $seo['jsonLd'] : [];
@endphp
@if ($title !== '')
    <title>{{ $title }}</title>
    <meta property="og:title" content="{{ $title }}">
    <meta name="twitter:title" content="{{ $title }}">
@endif
@if ($description !== '')
    <meta name="description" content="{{ $description }}">
    <meta property="og:description" content="{{ $description }}">
    <meta name="twitter:description" content="{{ $description }}">
@endif
@if ($canonicalUrl !== '')
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
@endif
<meta property="og:type" content="{{ $ogType }}">
<meta property="og:site_name" content="{{ $siteName }}">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:image" content="{{ $ogImage }}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:image" content="{{ $ogImage }}">
@if ($noindex)
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="googlebot" content="noindex, nofollow, noarchive">
@endif
@foreach ($jsonLd as $graph)
    @php
        $encoded = json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    @endphp
    @if (is_string($encoded))
        <script type="application/ld+json">{!! $encoded !!}</script>
    @endif
@endforeach
