<?php

use App\Http\Controllers\Admin\ApiKeyController;
use App\Http\Controllers\Admin\BioLinkController;
use App\Http\Controllers\Admin\MediaItemController;
use App\Http\Controllers\Admin\NewsletterController as AdminNewsletterController;
use App\Http\Controllers\Admin\ShortLinkController;
use App\Http\Controllers\BlogCommentController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\ProfileController;
use App\Models\BioLink;
use App\Models\BioLinkClick;
use App\Models\BlogCommentThread;
use App\Models\MediaItem;
use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use App\Services\CountryResolver;
use App\Support\BlogRepository;
use App\Support\CaseStudyRepository;
use App\Support\MediaEmbeds;
use App\Support\SeoCatalog;
use App\Support\SiteCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::domain('blog.harun.dev')->any('{path?}', function (Request $request, ?string $path = null) {
    $targetPath = '/blog/'.ltrim((string) $path, '/');
    $targetPath = rtrim($targetPath, '/');

    if ($targetPath === '/blog') {
        $targetPath .= '/';
    }

    $query = $request->getQueryString();
    $targetUrl = 'https://harun.dev'.$targetPath.($query ? '?'.$query : '');

    return redirect()->away($targetUrl, 301);
})->where('path', '.*');

Route::get('/', function () {
    return Inertia::render('Homepage');
})->name('home');

// The admin dashboard view is served at /admin/dashboard; /admin itself just
// redirects there. The payload-building logic lives in this closure.
$renderDashboard = function () {
    $blog = new BlogRepository;
    $posts = $blog->posts();
    $publishedPosts = array_values(array_filter($posts, fn (array $post) => ! (bool) ($post['draft'] ?? false)));
    $draftPosts = array_values(array_filter($posts, fn (array $post) => (bool) ($post['draft'] ?? false)));

    $postsByMonth = [];
    foreach ($publishedPosts as $post) {
        $month = Carbon::parse($post['publishedAt'])->format('Y-m');
        $postsByMonth[$month] = ($postsByMonth[$month] ?? 0) + 1;
    }

    $postsTrend = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = Carbon::now()->subMonths($i);
        $postsTrend[] = [
            'label' => $month->format('M'),
            'count' => $postsByMonth[$month->format('Y-m')] ?? 0,
        ];
    }

    return Inertia::render('Dashboard', [
        'stats' => [
            'totalPosts' => count($posts),
            'publishedPosts' => count($publishedPosts),
            'draftPosts' => count($draftPosts),
            'previewReadyDrafts' => count(array_filter($draftPosts, fn (array $post) => ! empty($blog->previewUrl((string) $post['slug'])))),
        ],
        'panelStatus' => 'Ready',
        'panelStatusDetail' => 'Protected by auth + verified and wired to the live blog content source.',
        'recentPosts' => array_slice($blog->indexPosts(), 0, 5),
        'draftPostsList' => array_map(fn (array $post) => [
            'title' => (string) $post['title'],
            'slug' => (string) $post['slug'],
            'brief' => (string) $post['brief'],
            'publishedAtHuman' => (string) ($post['publishedAtHuman'] ?? ''),
            'readTimeLabel' => (string) ($post['readTimeLabel'] ?? ''),
            'draftPreviewUrl' => $blog->previewUrl((string) $post['slug']),
        ], $draftPosts),
        'postsTrend' => $postsTrend,
    ]);
};

Route::get('/admin/dashboard', $renderDashboard)
    ->middleware(['auth', 'verified', 'role:admin'])
    ->name('dashboard');

Route::get('/admin', fn () => redirect()->route('dashboard'))
    ->middleware(['auth', 'verified', 'role:admin'])
    ->name('admin');

// Legacy bookmark support: the dashboard used to live at /dashboard.
Route::redirect('/dashboard', '/admin/dashboard');

// Admin CRUD for link-in-bio entries
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin/bio')
    ->name('admin.bio.')
    ->group(function () {
        Route::get('/', [BioLinkController::class, 'index'])->name('index');
        Route::get('/analytics', [BioLinkController::class, 'analytics'])->name('analytics');
        Route::get('/create', [BioLinkController::class, 'create'])->name('create');
        Route::post('/', [BioLinkController::class, 'store'])->name('store');
        Route::post('/reorder', [BioLinkController::class, 'reorder'])->name('reorder');
        Route::get('/{bioLink}/edit', [BioLinkController::class, 'edit'])->name('edit');
        Route::put('/{bioLink}', [BioLinkController::class, 'update'])->name('update');
        Route::patch('/{bioLink}/toggle', [BioLinkController::class, 'toggle'])->name('toggle');
        Route::delete('/{bioLink}', [BioLinkController::class, 'destroy'])->name('destroy');
    });

// Admin CRUD for slides/videos media items
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin/media')
    ->name('admin.media.')
    ->group(function () {
        Route::get('/', [MediaItemController::class, 'index'])->name('index');
        Route::get('/create', [MediaItemController::class, 'create'])->name('create');
        Route::post('/', [MediaItemController::class, 'store'])->name('store');
        Route::post('/reorder', [MediaItemController::class, 'reorder'])->name('reorder');
        Route::get('/{mediaItem}/edit', [MediaItemController::class, 'edit'])->name('edit');
        Route::put('/{mediaItem}', [MediaItemController::class, 'update'])->name('update');
        Route::patch('/{mediaItem}/toggle', [MediaItemController::class, 'toggle'])->name('toggle');
        Route::delete('/{mediaItem}', [MediaItemController::class, 'destroy'])->name('destroy');
    });

// Admin CRUD for the URL shortener
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin/short')
    ->name('admin.short.')
    ->group(function () {
        Route::get('/', [ShortLinkController::class, 'index'])->name('index');
        Route::get('/analytics', [ShortLinkController::class, 'analytics'])->name('analytics');
        Route::get('/create', [ShortLinkController::class, 'create'])->name('create');
        Route::post('/', [ShortLinkController::class, 'store'])->name('store');
        Route::get('/{shortLink}/edit', [ShortLinkController::class, 'edit'])->name('edit');
        Route::put('/{shortLink}', [ShortLinkController::class, 'update'])->name('update');
        Route::patch('/{shortLink}/toggle', [ShortLinkController::class, 'toggle'])->name('toggle');
        Route::delete('/{shortLink}', [ShortLinkController::class, 'destroy'])->name('destroy');
    });

// Admin management of Sanctum API keys used by the public /api/v1 endpoints
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin/api-keys')
    ->name('admin.api-keys.')
    ->group(function () {
        Route::get('/', [ApiKeyController::class, 'index'])->name('index');
        Route::post('/', [ApiKeyController::class, 'store'])->name('store');
        Route::delete('/{id}', [ApiKeyController::class, 'destroy'])->name('destroy');
    });

// Admin read-only view of newsletter subscribers
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin/newsletter')
    ->name('admin.newsletter.')
    ->group(function () {
        Route::get('/', [AdminNewsletterController::class, 'index'])->name('index');
        // POST, not GET: reveal() writes an audit-log entry and consumes
        // throttle budget, so it needs CSRF protection -- a GET here could
        // be triggered by an admin's browser just following a link.
        Route::post('/{subscriber}/reveal', [AdminNewsletterController::class, 'reveal'])
            ->where('subscriber', '[0-9]{1,18}')
            ->middleware('throttle:30,1')
            ->name('reveal');
    });

// Shared by the click-recording routes below: a raw 'src' value (query or
// body) is untrusted visitor input, so we normalize defensively rather than
// reject it — bad input just means no source tag, never a dropped click.
$normalizeClickSource = fn ($value): ?string => is_string($value) && $value !== '' ? mb_substr($value, 0, 60) : null;

// Public short-link redirect + click tracking (no auth needed). 302 so
// browsers/CDNs never cache the redirect and skip recording a hit.
Route::get('/s/{code}', function (string $code, Request $request, CountryResolver $countries) use ($normalizeClickSource) {
    $link = ShortLink::query()->active()->where('code', $code)->first();

    abort_unless($link, 404);

    $country = $countries->resolve($request);

    ShortLinkClick::create([
        'short_link_id' => $link->id,
        'ip_address' => $request->ip(),
        'country' => $country,
        'user_agent' => $request->userAgent(),
        'referer' => $request->header('referer'),
        'source' => $normalizeClickSource($request->query('src')),
    ]);

    return redirect()->away($link->resolveDestination($country), 302);
})->name('short.redirect');

// Public link-in-bio landing page (DB-driven, no auth)
Route::get('/bio', function (Request $request, CountryResolver $countries) {
    $country = $countries->resolve($request);

    $links = BioLink::query()
        ->active()
        ->visibleForLocale('en')
        ->orderBy('priority')
        ->orderBy('id')
        ->get(['id', 'label', 'description', 'url', 'short_link_id', 'icon', 'thumbnail_path', 'featured', 'tab', 'tab_slug', 'include_countries', 'exclude_countries'])
        ->load('shortLink:id,code')
        ->filter(fn (BioLink $link) => $link->isVisibleInCountry($country))
        ->values()
        ->map(fn (BioLink $link) => [
            'id' => $link->id,
            'label' => $link->label,
            'description' => $link->description,
            'url' => $link->url,
            'share_url' => $link->shortLink?->short_url ?? $link->url,
            'icon' => $link->icon,
            'thumbnail_url' => $link->thumbnail_url,
            'featured' => (bool) $link->featured,
            'tab' => $link->tab ?? 'default',
            'tab_slug' => $link->tab_slug ?? Str::slug($link->tab ?? 'default'),
        ])
        ->all();

    $pageShareUrl = ShortLink::getOrCreateForUrl(url('/bio'), 'Bio page')?->short_url ?? url('/bio');

    $tabShareUrls = collect($links)
        ->pluck('tab_slug')
        ->unique()
        ->mapWithKeys(function (string $slug) {
            $tabUrl = url('/bio').'?tab='.$slug;

            return [$slug => ShortLink::getOrCreateForUrl($tabUrl, "Bio: {$slug}")?->short_url ?? $tabUrl];
        });

    return Inertia::render('Bio', [
        'links' => $links,
        'page_share_url' => $pageShareUrl,
        'tab_share_urls' => $tabShareUrls,
        'locale' => 'en',
    ]);
});

// Bangla-language twin of /bio. Same component and same data, minus the
// Products tab and with the Bangla-audience social handles in place of the
// English ones (LinkedIn/GitHub/website/email are shared, so they stay).
Route::get('/hrr', function (Request $request, CountryResolver $countries) {
    app()->setLocale('bn');

    $country = $countries->resolve($request);

    $links = BioLink::query()
        ->active()
        ->visibleForLocale('bn')
        // Products is English-only. Null-safe because Postgres drops rows
        // where the comparison is NULL, which would silently hide any link
        // saved before tab_slug was backfilled.
        ->where(fn ($q) => $q->whereNull('tab_slug')->orWhere('tab_slug', '!=', 'products'))
        ->orderBy('priority')
        ->orderBy('id')
        ->get(['id', 'label', 'description', 'url', 'short_link_id', 'icon', 'thumbnail_path', 'featured', 'tab', 'tab_slug', 'include_countries', 'exclude_countries'])
        ->load('shortLink:id,code')
        ->filter(fn (BioLink $link) => $link->isVisibleInCountry($country))
        ->values()
        ->map(fn (BioLink $link) => [
            'id' => $link->id,
            'label' => $link->label,
            'description' => $link->description,
            'url' => $link->url,
            'share_url' => $link->shortLink?->short_url ?? $link->url,
            'icon' => $link->icon,
            'thumbnail_url' => $link->thumbnail_url,
            'featured' => (bool) $link->featured,
            'tab' => $link->tab ?? 'default',
            'tab_slug' => $link->tab_slug ?? Str::slug($link->tab ?? 'default'),
        ])
        ->all();

    $pageShareUrl = ShortLink::getOrCreateForUrl(url('/hrr'), 'Bio (Bangla) page')?->short_url ?? url('/hrr');

    $tabShareUrls = collect($links)
        ->pluck('tab_slug')
        ->unique()
        ->mapWithKeys(function (string $slug) {
            $tabUrl = url('/hrr').'?tab='.$slug;

            return [$slug => ShortLink::getOrCreateForUrl($tabUrl, "Bio (Bangla): {$slug}")?->short_url ?? $tabUrl];
        });

    return Inertia::render('Bio', [
        'links' => $links,
        'page_share_url' => $pageShareUrl,
        'tab_share_urls' => $tabShareUrls,
        'locale' => 'bn',
    ]);
});

// Click tracking for bio links (no auth needed)
Route::post('/bio/click', function (Request $request, CountryResolver $countries) use ($normalizeClickSource) {
    $data = $request->validate([
        'id' => ['required', 'integer', 'exists:bio_links,id'],
    ]);

    BioLinkClick::create([
        'bio_link_id' => $data['id'],
        'ip_address' => $request->ip(),
        'country' => $countries->resolve($request),
        'user_agent' => $request->userAgent(),
        'referer' => $request->header('referer'),
        'source' => $normalizeClickSource($request->input('src')),
    ]);

    return response()->noContent();
})->middleware('throttle:30,1')->name('bio.click');

Route::get('/about', function () {
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    return Inertia::render('About', [
        'canonicalUrl' => $siteUrl.'/about',
    ]);
})->name('about');

Route::get('/products', function () {
    return Inertia::render('Products');
})->name('products');

Route::get('/services', function () {
    return Inertia::render('Services');
})->name('services');

Route::get('/services/cloud-architecture', function () {
    return Inertia::render('Services/CloudArchitecture');
})->name('services.cloud-architecture');

Route::get('/services/devops', function () {
    return Inertia::render('Services/DevOps');
})->name('services.devops');

Route::get('/services/infrastructure-as-code', function () {
    return Inertia::render('Services/InfrastructureAsCode');
})->name('services.infrastructure-as-code');

Route::get('/services/serverless-infrastructure', function () {
    return Inertia::render('Services/ServerlessInfrastructure');
})->name('services.serverless-infrastructure');

Route::get('/services/automated-deployment', function () {
    return Inertia::render('Services/AutomatedDeployment');
})->name('services.automated-deployment');

Route::get('/services/security-consulting', function () {
    return Inertia::render('Services/SecurityConsulting');
})->name('services.security-consulting');

Route::get('/services/performance-optimization', function () {
    return Inertia::render('Services/PerformanceOptimization');
})->name('services.performance-optimization');

Route::get('/services/infrastructure-migration', function () {
    return Inertia::render('Services/InfrastructureMigration');
})->name('services.infrastructure-migration');

Route::get('/services/mlops', function () {
    return Inertia::render('Services/MLOps');
})->name('services.mlops');

Route::get('/services/database-migration', function () {
    return Inertia::render('Services/DatabaseMigration');
})->name('services.database-migration');

Route::get('/services/monitoring-observability', function () {
    return Inertia::render('Services/MonitoringObservability');
})->name('services.monitoring-observability');

Route::get('/services/database-optimization', function () {
    return Inertia::render('Services/DatabaseOptimization');
})->name('services.database-optimization');

Route::get('/services/aws-cloud', function () {
    return Inertia::render('Services/AWSCloud');
})->name('services.aws-cloud');

Route::get('/services/multi-cloud-architecture', function () {
    return Inertia::render('Services/MultiCloudArchitecture');
})->name('services.multi-cloud-architecture');

Route::get('/services/vibe-scaling', function () {
    return Inertia::render('Services/VibeScaling');
})->name('services.vibe-scaling');

Route::get('/services/vibe-code-migration', function () {
    return Inertia::render('Services/VibeCodeMigration');
})->name('services.vibe-code-migration');

Route::get('/book', function () {
    return Inertia::render('Book');
})->name('book');

Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

Route::post('/contact', [ContactController::class, 'submit'])
    ->middleware('throttle:5,1')
    ->name('contact.submit');

Route::post('/subscribe', [NewsletterController::class, 'subscribe'])
    ->middleware('throttle:5,1')
    ->name('subscribe');

Route::get('/case-studies', function (Request $request) {
    if ($request->getRequestUri() === '/case-studies/') {
        return redirect('/case-studies', 301);
    }

    $repo = new CaseStudyRepository;
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $seo = SeoCatalog::forPath('/case-studies');

    return Inertia::render('CaseStudies/Index', [
        'studies' => $repo->indexStudies(),
        'canonicalUrl' => $siteUrl.'/case-studies',
        'seo' => $seo?->toArray(),
    ]);
})->name('case-studies.index');

Route::get('/case-studies/feed.xml', function () {
    $repo = new CaseStudyRepository;
    $studies = array_slice($repo->indexStudies(), 0, 20);
    $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $siteUrl = rtrim(config('app.url', url('/')), '/');
    $publishedAt = now()->toRfc2822String();

    $items = collect($studies)->map(function (array $study) use ($escape, $repo) {
        $url = $repo->absoluteUrl($study['slug']);
        $description = (string) ($study['brief'] ?? $study['problem'] ?? '');
        $pubDate = Carbon::parse($study['publishedAt'])->toRfc2822String();

        return '<item>'
            .'<title>'.$escape($study['codename']).'</title>'
            .'<link>'.$escape($url).'</link>'
            .'<guid isPermaLink="true">'.$escape($url).'</guid>'
            .'<pubDate>'.$escape($pubDate).'</pubDate>'
            .'<description>'.$escape($description).'</description>'
            .'</item>';
    })->implode('');

    $xml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Case Studies | Harun R. Rayhan</title>
    <link>{$escape($siteUrl.'/case-studies')}</link>
    <description>Anonymized cloud and DevOps case studies (constellation codenames).</description>
    <language>en</language>
    <lastBuildDate>{$escape($publishedAt)}</lastBuildDate>
    {$items}
  </channel>
</rss>
XML;

    return response($xml, 200)->header('Content-Type', 'application/rss+xml; charset=UTF-8');
})->name('case-studies.feed');

Route::get('/case-studies/{slug}', function (string $slug) {
    $repo = new CaseStudyRepository;
    $study = $repo->find($slug);

    abort_unless($study, 404);

    if ((bool) ($study['draft'] ?? false)) {
        abort(404);
    }

    $detail = $repo->toDetailPayload($study);
    $canonicalUrl = $repo->absoluteUrl($slug);
    $seo = SeoCatalog::forCaseStudy(
        (string) $detail['title'],
        (string) ($detail['brief'] ?? ''),
        $canonicalUrl,
        isset($detail['coverImageUrl']) ? (string) $detail['coverImageUrl'] : null,
        isset($detail['publishedAtIso']) ? (string) $detail['publishedAtIso'] : null,
    );

    return Inertia::render('CaseStudies/Detail', [
        'study' => $detail,
        'relatedStudies' => $repo->related($slug, 3),
        'canonicalUrl' => $canonicalUrl,
        'siteUrl' => rtrim(config('app.url', url('/')), '/'),
        'seo' => $seo->toArray(),
    ]);
})->name('case-studies.show');

Route::get('/slides', function (Request $request) {
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $items = MediaItem::query()->active()->ofType('slide')
        ->orderBy('priority')->orderByDesc('published_at')->get();

    return Inertia::render('Media/Index', [
        'type' => 'slide',
        'items' => $items->map(fn (MediaItem $item) => [
            'slug' => $item->slug,
            'title' => $item->title,
            'summary' => $item->summary,
            'thumbnailUrl' => $item->thumbnail_url,
            'sourceLabel' => $item->source_label,
            'publishedAtHuman' => $item->published_at?->format('M j, Y'),
            'detailUrl' => '/slides/'.$item->slug,
        ]),
        'canonicalUrl' => $siteUrl.'/slides',
        'seo' => SeoCatalog::forMedia(
            'Slides | Harun R. Rayhan',
            'Talk decks and presentations on cloud, DevOps, and AWS.',
            $siteUrl.'/slides',
        )->toArray(),
    ]);
})->name('slides.index');

Route::get('/slides/{slug}', function (string $slug) {
    $item = MediaItem::query()->active()->ofType('slide')->where('slug', $slug)->first();
    abort_unless($item, 404);
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $related = MediaItem::query()->active()->ofType('slide')
        ->where('slug', '!=', $slug)
        ->orderBy('priority')->orderByDesc('published_at')->limit(3)->get();

    return Inertia::render('Media/Detail', [
        'type' => 'slide',
        'item' => [
            'slug' => $item->slug,
            'title' => $item->title,
            'summary' => $item->summary,
            'thumbnailUrl' => $item->thumbnail_url,
            'sourceLabel' => $item->source_label,
            'publishedAtHuman' => $item->published_at?->format('M j, Y'),
            'shareUrl' => $item->share_url,
            'embedUrl' => MediaEmbeds::slideEmbedUrl($item->url),
        ],
        'related' => $related->map(fn (MediaItem $r) => [
            'slug' => $r->slug, 'title' => $r->title,
            'thumbnailUrl' => $r->thumbnail_url, 'detailUrl' => '/slides/'.$r->slug,
        ]),
        'canonicalUrl' => $siteUrl.'/slides/'.$item->slug,
        'seo' => SeoCatalog::forMedia(
            $item->title,
            (string) ($item->summary ?? $item->title),
            $siteUrl.'/slides/'.$item->slug,
            $item->thumbnail_url,
        )->toArray(),
    ]);
})->name('slides.show');

Route::get('/videos', function (Request $request) {
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $items = MediaItem::query()->active()->ofType('video')
        ->orderBy('priority')->orderByDesc('published_at')->get();

    return Inertia::render('Media/Index', [
        'type' => 'video',
        'items' => $items->map(fn (MediaItem $item) => [
            'slug' => $item->slug,
            'title' => $item->title,
            'summary' => $item->summary,
            'thumbnailUrl' => $item->thumbnail_url,
            'sourceLabel' => $item->source_label,
            'publishedAtHuman' => $item->published_at?->format('M j, Y'),
            'detailUrl' => '/videos/'.$item->slug,
        ]),
        'canonicalUrl' => $siteUrl.'/videos',
        'seo' => SeoCatalog::forMedia(
            'Videos | Harun R. Rayhan',
            'Recorded talks and walkthroughs on cloud, DevOps, and AWS.',
            $siteUrl.'/videos',
        )->toArray(),
    ]);
})->name('videos.index');

Route::get('/videos/{slug}', function (string $slug) {
    $item = MediaItem::query()->active()->ofType('video')->where('slug', $slug)->first();
    abort_unless($item, 404);
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $related = MediaItem::query()->active()->ofType('video')
        ->where('slug', '!=', $slug)
        ->orderBy('priority')->orderByDesc('published_at')->limit(3)->get();

    return Inertia::render('Media/Detail', [
        'type' => 'video',
        'item' => [
            'slug' => $item->slug,
            'title' => $item->title,
            'summary' => $item->summary,
            'thumbnailUrl' => $item->thumbnail_url,
            'sourceLabel' => $item->source_label,
            'publishedAtHuman' => $item->published_at?->format('M j, Y'),
            'shareUrl' => $item->share_url,
            'embedUrl' => MediaEmbeds::youtubeEmbedUrl($item->url),
        ],
        'related' => $related->map(fn (MediaItem $r) => [
            'slug' => $r->slug, 'title' => $r->title,
            'thumbnailUrl' => $r->thumbnail_url, 'detailUrl' => '/videos/'.$r->slug,
        ]),
        'canonicalUrl' => $siteUrl.'/videos/'.$item->slug,
        'seo' => SeoCatalog::forMedia(
            $item->title,
            (string) ($item->summary ?? $item->title),
            $siteUrl.'/videos/'.$item->slug,
            $item->thumbnail_url,
        )->toArray(),
    ]);
})->name('videos.show');

Route::get('/blog', function (Request $request) {
    if ($request->getRequestUri() === '/blog/') {
        return redirect('/blog', 301);
    }

    $blog = new BlogRepository;
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $seo = SeoCatalog::forPath('/blog');

    return Inertia::render('Blog/Index', [
        'publication' => $blog->publication(),
        'posts' => $blog->indexPosts(),
        'canonicalUrl' => $siteUrl.'/blog',
        'seo' => $seo?->toArray(),
    ]);
})->name('blog.index');

Route::get('/blog/feed.xml', function () {
    $blog = new BlogRepository;
    $publication = $blog->publication();
    $posts = array_slice($blog->indexPosts(), 0, 20);
    $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $siteUrl = rtrim(config('app.url', url('/')), '/');
    $publishedAt = now()->toRfc2822String();

    $items = collect($posts)->map(function (array $post) use ($escape, $blog) {
        $postUrl = $blog->absoluteUrl($post['slug']);
        $description = $post['brief'];
        $pubDate = Carbon::parse($post['publishedAt'])->toRfc2822String();

        return '<item>'
            ."<title>{$escape($post['title'])}</title>"
            ."<link>{$escape($postUrl)}</link>"
            ."<guid isPermaLink=\"true\">{$escape($postUrl)}</guid>"
            ."<pubDate>{$escape($pubDate)}</pubDate>"
            ."<description>{$escape($description)}</description>"
            .'</item>';
    })->implode('');

    $xml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>{$escape($publication['title'])}</title>
    <link>{$escape($siteUrl.'/blog')}</link>
    <description>{$escape('AWS, DevOps, Laravel, and serverless articles from Harun.')}</description>
    <language>en</language>
    <lastBuildDate>{$escape($publishedAt)}</lastBuildDate>
    {$items}
  </channel>
</rss>
XML;

    return response($xml, 200)->header('Content-Type', 'application/rss+xml; charset=UTF-8');
})->name('blog.feed');

Route::get('/blog/{slug}/draft/{previewToken}', function (Request $request, string $slug, string $previewToken) {
    $blog = new BlogRepository;
    $post = $blog->find($slug);

    abort_unless($post, 404);

    $isDraft = (bool) ($post['draft'] ?? false);
    $expectedToken = (string) ($post['draftToken'] ?? '');

    if ($isDraft) {
        abort_unless($expectedToken !== '' && hash_equals($expectedToken, $previewToken), 404);
    } else {
        abort(404);
    }

    $payload = $blog->toPostPagePayload($post);
    $canonicalUrl = $blog->absoluteUrl($slug);
    $publication = $blog->publication();
    $seo = SeoCatalog::forBlogPost(
        (string) $payload['title'],
        (string) $payload['brief'],
        $canonicalUrl,
        isset($payload['coverImageUrl']) ? (string) $payload['coverImageUrl'] : null,
        true,
        isset($payload['publishedAtIso']) ? (string) $payload['publishedAtIso'] : null,
        isset($publication['title']) ? (string) $publication['title'] : null,
        isset($publication['url']) ? (string) $publication['url'] : null,
    );

    $response = Inertia::render('Blog/Post', [
        'publication' => $blog->publication(),
        'post' => $payload,
        'relatedPosts' => $blog->related($slug, 3),
        'canonicalUrl' => $canonicalUrl,
        'siteUrl' => rtrim(request()->root(), '/'),
        'commentCount' => 0,
        'comments' => [],
        'seo' => $seo->toArray(),
    ]);

    return $response;
})->where('previewToken', '[A-Fa-f0-9]{32}')->name('blog.preview');

// Track blog post views
Route::post('/blog/{slug}/view', function (string $slug) {
    $blog = new BlogRepository;
    $post = $blog->find($slug);
    abort_unless($post, 404);
    if ((bool) ($post['draft'] ?? false)) {
        abort(404);
    }
    // Persist to database immediately, warm the cache
    $now = Carbon::now();
    DB::table('blog_post_views')->upsert(
        ['slug' => $slug, 'count' => 1, 'created_at' => $now, 'updated_at' => $now],
        'slug',
        ['count' => DB::raw('blog_post_views.count + 1'), 'updated_at' => $now]
    );
    $viewRow = DB::table('blog_post_views')->where('slug', $slug)->first(['count']);
    $count = $viewRow ? (int) $viewRow->count : 0;
    Cache::put('post.views.'.$slug, $count, 3600);

    return response()->json(['views' => $count]);
})->middleware('throttle:30,1')->name('blog.view');

// Blog post
Route::get('/blog/{slug}', function (Request $request, string $slug) {
    $blog = new BlogRepository;
    $post = $blog->find($slug);

    abort_unless($post, 404);

    if ((bool) ($post['draft'] ?? false)) {
        abort(404);
    }

    $commentCacheKey = 'blog.post.'.$slug.'.comments.'.($request->user()?->id ?? 'guest');
    $commentCount = 0;
    $comments = [];

    try {
        $commentPayload = Cache::remember($commentCacheKey, now()->addMinutes(5), function () use (
            $blog,
            $slug,
            $post,
            $request,
        ): array {
            $viewer = $request->user();
            $thread = BlogCommentThread::resolveForPost(
                $slug,
                (string) $post['title'],
                $blog->absoluteUrl($slug),
                (string) ($post['sourceUrl'] ?? $blog->sourceUrl($slug)),
            );

            return [
                'count' => $thread->visibleCommentCountForViewer($viewer),
                'comments' => $thread->commentTree(),
            ];
        });

        $commentCount = $commentPayload['count'];
        $comments = $commentPayload['comments'];
    } catch (Throwable $exception) {
        report($exception);
    }

    $payload = $blog->toPostPagePayload($post);
    $canonicalUrl = $blog->absoluteUrl($slug);
    $publication = $blog->publication();
    $seo = SeoCatalog::forBlogPost(
        (string) $payload['title'],
        (string) $payload['brief'],
        $canonicalUrl,
        isset($payload['coverImageUrl']) ? (string) $payload['coverImageUrl'] : null,
        false,
        isset($payload['publishedAtIso']) ? (string) $payload['publishedAtIso'] : null,
        isset($publication['title']) ? (string) $publication['title'] : null,
        isset($publication['url']) ? (string) $publication['url'] : null,
    );

    $response = Inertia::render('Blog/Post', [
        'publication' => $blog->publication(),
        'post' => $payload,
        'relatedPosts' => $blog->related($slug, 3),
        'canonicalUrl' => $canonicalUrl,
        'siteUrl' => rtrim(request()->root(), '/'),
        'commentCount' => $commentCount,
        'comments' => $comments,
        'seo' => $seo->toArray(),
    ]);

    return $response;
})->name('blog.post');

Route::post('/blog/{slug}/comments', [BlogCommentController::class, 'store'])
    ->middleware(['auth', 'throttle:20,1'])
    ->name('blog.comments.store');

Route::get('/sitemap.xml', function () {
    $blog = new BlogRepository;
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $staticUrls = collect(SiteCatalog::sitemapStaticPaths())->map(fn (string $path) => [
        'loc' => $siteUrl.$path,
        'lastmod' => now()->toDateString(),
    ]);

    $blogUrls = collect($blog->indexPosts())->map(fn (array $post) => [
        'loc' => $blog->absoluteUrl($post['slug']),
        'lastmod' => substr($post['publishedAtIso'], 0, 10),
    ]);

    $caseStudyRepo = new CaseStudyRepository;
    $caseStudyUrls = collect($caseStudyRepo->indexStudies())->map(fn (array $study) => [
        'loc' => $caseStudyRepo->absoluteUrl($study['slug']),
        'lastmod' => substr($study['publishedAtIso'], 0, 10),
    ]);

    $slideUrls = MediaItem::query()->active()->ofType('slide')->get()->map(fn (MediaItem $item) => [
        'loc' => $siteUrl.'/slides/'.$item->slug,
        'lastmod' => ($item->published_at ?? $item->updated_at)->toDateString(),
    ]);

    $videoUrls = MediaItem::query()->active()->ofType('video')->get()->map(fn (MediaItem $item) => [
        'loc' => $siteUrl.'/videos/'.$item->slug,
        'lastmod' => ($item->published_at ?? $item->updated_at)->toDateString(),
    ]);

    $urls = $staticUrls->merge($blogUrls)->merge($caseStudyUrls)->merge($slideUrls)->merge($videoUrls);
    $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

    $entries = $urls->map(fn (array $url) => <<<XML
    <url>
      <loc>{$escape($url['loc'])}</loc>
      <lastmod>{$escape($url['lastmod'])}</lastmod>
    </url>
XML)->implode("\n");

    $xml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{$entries}
</urlset>
XML;

    return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
})->name('sitemap');

Route::get('/robots.txt', function () {
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $txt = <<<TXT
# Cite and quote with attribution. Training and retrieval are welcome if you link back.
# AI agents: see {$siteUrl}/llms.txt
User-agent: *
Allow: /
Sitemap: {$siteUrl}/sitemap.xml
TXT;

    return response($txt, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
})->name('robots');

// /llms.txt and /llms-full.txt follow the llmstxt.org convention: a markdown index
// of the site written for LLM consumption. Both are generated from SiteCatalog
// (same lists as /sitemap.xml) so they never drift from what is published.

Route::get('/llms.txt', function () {
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $blog = new BlogRepository;
    $caseStudyRepo = new CaseStudyRepository;

    $blogLinks = collect($blog->indexPosts())
        ->map(fn (array $post) => '- ['.$post['title'].']('.$post['canonicalUrl'].'): '.$post['brief'])
        ->implode("\n");

    $caseStudyLinks = collect($caseStudyRepo->indexStudies())
        ->map(fn (array $study) => '- ['.$study['codename'].']('.$study['canonicalUrl'].'): '.$study['brief'])
        ->implode("\n");

    $linkSections = SiteCatalog::llmsLinkSections($siteUrl);

    $md = <<<MD
    # Harun R. Rayhan

    > Cloud, DevOps, and AWS consultant. I help teams design cloud architecture, automate infrastructure, and ship production systems that stay up. This file indexes the services, writing, and case studies published at {$siteUrl}.
    >
    > Cite and quote with attribution. Training and retrieval are welcome if you link back.

    {$linkSections}

    ## Blog

    {$blogLinks}

    ## Case Studies

    {$caseStudyLinks}
    MD;

    return response($md, 200)->header('Content-Type', 'text/markdown; charset=UTF-8');
})->name('llms');

Route::get('/llms-full.txt', function () {
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $blog = new BlogRepository;
    $caseStudyRepo = new CaseStudyRepository;

    // posts()/studies() return the raw parsed files, whose content['html'] key holds
    // the original post body as authored (markdown for some posts, raw HTML blocks
    // for others). Unlike indexPosts()/indexStudies() they keep the body but also
    // include drafts, so drafts are filtered out here.
    $blogBodies = collect($blog->posts())
        ->reject(fn (array $post) => (bool) ($post['draft'] ?? false))
        ->map(function (array $post) use ($blog) {
            $url = $blog->absoluteUrl($post['slug']);
            $body = trim((string) ($post['content']['html'] ?? ''));

            return "### {$post['title']}\n\n{$url}\n\n{$body}\n\n---\n";
        })
        ->implode("\n");

    $caseStudyBodies = collect($caseStudyRepo->studies())
        ->reject(fn (array $study) => (bool) ($study['draft'] ?? false))
        ->map(function (array $study) use ($caseStudyRepo) {
            $slug = (string) $study['slug'];
            $codename = (string) ($study['codename'] ?? $study['title'] ?? $slug);
            $url = $caseStudyRepo->absoluteUrl($slug);
            $body = trim((string) ($study['content']['html'] ?? ''));

            return "### {$codename}\n\n{$url}\n\n{$body}\n\n---\n";
        })
        ->implode("\n");

    $linkSections = SiteCatalog::llmsLinkSections($siteUrl);

    $md = <<<MD
    # Harun R. Rayhan

    > Cloud, DevOps, and AWS consultant. I help teams design cloud architecture, automate infrastructure, and ship production systems that stay up. This file indexes the services, writing, and case studies published at {$siteUrl}, with the full text of every post and case study inlined.
    >
    > Cite and quote with attribution. Training and retrieval are welcome if you link back.

    {$linkSections}

    ## Blog

    {$blogBodies}
    ## Case Studies

    {$caseStudyBodies}
    MD;

    return response($md, 200)->header('Content-Type', 'text/markdown; charset=UTF-8');
})->name('llms.full');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Legal Routes
Route::get('/privacy', function () {
    return Inertia::render('Privacy');
})->name('privacy');

Route::get('/terms', function () {
    return Inertia::render('Terms');
})->name('terms');

// Health check endpoint used by Railway's deployment healthcheck
Route::get('/health', function () {
    $app = config('app');

    return response()->json([
        'status' => 'ok',
        'build_version' => $app['build_version'] ?? 'local',
        'deployment_id' => $app['deployment_id'] ?? 'local',
        'timestamp' => now()->toISOString(),
    ])->header('X-App-Version', $app['build_version'] ?? 'local')
        ->header('X-Deployment-Id', $app['deployment_id'] ?? 'local');
})->name('health');

require __DIR__.'/auth.php';
