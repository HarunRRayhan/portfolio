<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\BlogCommentController;
use App\Http\Controllers\Admin\BioLinkController;
use App\Models\BioLink;
use App\Models\BlogCommentThread;
use App\Support\BlogRepository;
use App\Support\CaseStudyRepository;
use App\Services\CountryResolver;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
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

Route::get('/dashboard', function () {
    $blog = new BlogRepository();
    $posts = $blog->posts();
    $publishedPosts = array_values(array_filter($posts, fn (array $post) => ! (bool) ($post['draft'] ?? false)));
    $draftPosts = array_values(array_filter($posts, fn (array $post) => (bool) ($post['draft'] ?? false)));

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
    ]);
})->middleware(['auth', 'verified', 'role:admin'])->name('dashboard');

Route::get('/admin', function () {
    $blog = new BlogRepository();
    $posts = $blog->posts();
    $publishedPosts = array_values(array_filter($posts, fn (array $post) => ! (bool) ($post['draft'] ?? false)));
    $draftPosts = array_values(array_filter($posts, fn (array $post) => (bool) ($post['draft'] ?? false)));

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
    ]);
})->middleware(['auth', 'verified', 'role:admin'])->name('admin');

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

// Public link-in-bio landing page (DB-driven, no auth)
Route::get('/bio', function (Request $request, CountryResolver $countries) {
    $country = $countries->resolve($request->ip());

    $links = BioLink::query()
        ->active()
        ->orderBy('priority')
        ->orderBy('id')
        ->get(['id', 'label', 'url', 'icon', 'tab', 'tab_slug', 'include_countries', 'exclude_countries'])
        ->filter(fn (BioLink $link) => $link->isVisibleInCountry($country))
        ->values()
        ->map(fn (BioLink $link) => [
            'id' => $link->id,
            'label' => $link->label,
            'url' => $link->url,
            'icon' => $link->icon,
            'tab' => $link->tab ?? 'default',
            'tab_slug' => $link->tab_slug ?? Str::slug($link->tab ?? 'default'),
        ])
        ->all();

    return Inertia::render('Bio', ['links' => $links]);
});

// Click tracking for bio links (no auth needed)
Route::post('/bio/click', function (Request $request, CountryResolver $countries) {
    $data = $request->validate([
        'id' => ['required', 'integer', 'exists:bio_links,id'],
    ]);

    App\Models\BioLinkClick::create([
        'bio_link_id' => $data['id'],
        'ip_address' => $request->ip(),
        'country' => $countries->resolve($request->ip()),
        'user_agent' => $request->userAgent(),
        'referer' => $request->header('referer'),
    ]);

    return response()->noContent();
})->name('bio.click');

Route::get('/about', function () {
    return Inertia::render('About');
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

Route::get('/book', function () {
    return Inertia::render('Book');
})->name('book');

Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

Route::post('/contact', [ContactController::class, 'submit'])->name('contact.submit');

Route::get('/case-studies', function (Request $request) {
    if ($request->getRequestUri() === '/case-studies/') {
        return redirect('/case-studies', 301);
    }

    $repo = new CaseStudyRepository();
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    return Inertia::render('CaseStudies/Index', [
        'studies' => $repo->indexStudies(),
        'canonicalUrl' => $siteUrl.'/case-studies',
    ]);
})->name('case-studies.index');

Route::get('/case-studies/feed.xml', function () {
    $repo = new CaseStudyRepository();
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
    $repo = new CaseStudyRepository();
    $study = $repo->find($slug);

    abort_unless($study, 404);

    if ((bool) ($study['draft'] ?? false)) {
        abort(404);
    }

    return Inertia::render('CaseStudies/Detail', [
        'study' => $repo->toDetailPayload($study),
        'relatedStudies' => $repo->related($slug, 3),
        'canonicalUrl' => $repo->absoluteUrl($slug),
    ]);
})->name('case-studies.show');

Route::get('/blog', function (Request $request) {
    if ($request->getRequestUri() === '/blog/') {
        return redirect('/blog', 301);
    }

    $blog = new BlogRepository();
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    return Inertia::render('Blog/Index', [
        'publication' => $blog->publication(),
        'posts' => $blog->indexPosts(),
        'canonicalUrl' => $siteUrl.'/blog',
    ]);
})->name('blog.index');

Route::get('/blog/feed.xml', function () {
    $blog = new BlogRepository();
    $publication = $blog->publication();
    $posts = array_slice($blog->indexPosts(), 0, 20);
    $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $siteUrl = rtrim(config('app.url', url('/')), '/');
    $publishedAt = now()->toRfc2822String();

    $items = collect($posts)->map(function (array $post) use ($escape, $blog) {
        $postUrl = $blog->absoluteUrl($post['slug']);
        $description = $post['brief'];
        $pubDate = Carbon::parse($post['publishedAt'])->toRfc2822String();

        return "<item>"
            ."<title>{$escape($post['title'])}</title>"
            ."<link>{$escape($postUrl)}</link>"
            ."<guid isPermaLink=\"true\">{$escape($postUrl)}</guid>"
            ."<pubDate>{$escape($pubDate)}</pubDate>"
            ."<description>{$escape($description)}</description>"
            ."</item>";
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
    $blog = new BlogRepository();
    $post = $blog->find($slug);

    abort_unless($post, 404);

    $isDraft = (bool) ($post['draft'] ?? false);
    $expectedToken = (string) ($post['draftToken'] ?? '');

    if ($isDraft) {
        abort_unless($expectedToken !== '' && hash_equals($expectedToken, $previewToken), 404);
    } else {
        abort(404);
    }

    $response = Inertia::render('Blog/Post', [
        'publication' => $blog->publication(),
        'post' => $blog->toPostPagePayload($post),
        'relatedPosts' => $blog->related($slug, 3),
        'canonicalUrl' => $blog->absoluteUrl($slug),
        'siteUrl' => rtrim(request()->root(), '/'),
        'commentCount' => 0,
        'comments' => [],
    ]);

    return $response;
})->where('previewToken', '[A-Fa-f0-9]{32}')->name('blog.preview');

// Track blog post views
Route::post('/blog/{slug}/view', function (string $slug) {
    $blog = new \App\Support\BlogRepository();
    $post = $blog->find($slug);
    abort_unless($post, 404);
    if ((bool) ($post['draft'] ?? false)) {
        abort(404);
    }
    // Persist to database immediately, warm the cache
    $now = \Illuminate\Support\Carbon::now();
    \Illuminate\Support\Facades\DB::table('blog_post_views')->upsert(
        ['slug' => $slug, 'count' => 1, 'created_at' => $now, 'updated_at' => $now],
        'slug',
        ['count' => \Illuminate\Support\Facades\DB::raw('blog_post_views.count + 1'), 'updated_at' => $now]
    );
    $viewRow = \Illuminate\Support\Facades\DB::table('blog_post_views')->where('slug', $slug)->first(['count']);
    $count = $viewRow ? (int) $viewRow->count : 0;
    \Illuminate\Support\Facades\Cache::put("post.views.".$slug, $count, 3600);
    return response()->json(['views' => $count]);
})->name('blog.view');

// Blog post
Route::get('/blog/{slug}', function (Request $request, string $slug) {
    $blog = new BlogRepository();
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
    } catch (\Throwable $exception) {
        report($exception);
    }

    $response = Inertia::render('Blog/Post', [
        'publication' => $blog->publication(),
        'post' => $blog->toPostPagePayload($post),
        'relatedPosts' => $blog->related($slug, 3),
        'canonicalUrl' => $blog->absoluteUrl($slug),
        'siteUrl' => rtrim(request()->root(), '/'),
        'commentCount' => $commentCount,
        'comments' => $comments,
    ]);

    return $response;
})->name('blog.post');

Route::post('/blog/{slug}/comments', [BlogCommentController::class, 'store'])
    ->middleware(['auth', 'throttle:20,1'])
    ->name('blog.comments.store');

Route::get('/sitemap.xml', function () {
    $blog = new BlogRepository();
    $siteUrl = rtrim(config('app.url', url('/')), '/');

    $staticUrls = [
        ['loc' => $siteUrl.'/', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/about', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/services', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/book', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/contact', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/privacy', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/terms', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/blog', 'lastmod' => now()->toDateString()],
        ['loc' => $siteUrl.'/case-studies', 'lastmod' => now()->toDateString()],
    ];

    $blogUrls = collect($blog->indexPosts())->map(fn (array $post) => [
        'loc' => $blog->absoluteUrl($post['slug']),
        'lastmod' => substr($post['publishedAtIso'], 0, 10),
    ]);

    $caseStudyRepo = new CaseStudyRepository();
    $caseStudyUrls = collect($caseStudyRepo->indexStudies())->map(fn (array $study) => [
        'loc' => $caseStudyRepo->absoluteUrl($study['slug']),
        'lastmod' => substr($study['publishedAtIso'], 0, 10),
    ]);

    $urls = collect($staticUrls)->merge($blogUrls)->merge($caseStudyUrls);
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
User-agent: *
Allow: /
Sitemap: {$siteUrl}/sitemap.xml
TXT;

    return response($txt, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
})->name('robots');

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

// Health check endpoint for blue-green deployment
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
