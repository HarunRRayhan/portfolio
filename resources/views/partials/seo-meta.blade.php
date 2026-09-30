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
    <title data-inertia="">{{ $title }}</title>
    <meta property="og:title" content="{{ $title }}" data-inertia="og:title">
    <meta name="twitter:title" content="{{ $title }}" data-inertia="twitter:title">
@endif
@if ($description !== '')
    <meta name="description" content="{{ $description }}" data-inertia="description">
    <meta property="og:description" content="{{ $description }}" data-inertia="og:description">
    <meta name="twitter:description" content="{{ $description }}" data-inertia="twitter:description">
@endif
@if ($canonicalUrl !== '')
    <link rel="canonical" href="{{ $canonicalUrl }}" data-inertia="canonical">
    <meta property="og:url" content="{{ $canonicalUrl }}" data-inertia="og:url">
@endif
<meta property="og:type" content="{{ $ogType }}" data-inertia="og:type">
<meta property="og:site_name" content="{{ $siteName }}" data-inertia="og:site_name">
<meta name="twitter:card" content="summary_large_image" data-inertia="twitter:card">
<meta property="og:image" content="{{ $ogImage }}" data-inertia="og:image">
<meta property="og:image:width" content="1200" data-inertia="og:image:width">
<meta property="og:image:height" content="630" data-inertia="og:image:height">
<meta name="twitter:image" content="{{ $ogImage }}" data-inertia="twitter:image">
@if ($noindex)
    <meta name="robots" content="noindex, nofollow, noarchive" data-inertia="robots">
    <meta name="googlebot" content="noindex, nofollow, noarchive" data-inertia="googlebot">
@endif
@foreach ($jsonLd as $index => $graph)
    @php
        $encoded = json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
    @endphp
    @if (is_string($encoded))
        <script type="application/ld+json" data-inertia="seo-jsonld-{{ $index }}">{!! $encoded !!}</script>
    @endif
@endforeach
