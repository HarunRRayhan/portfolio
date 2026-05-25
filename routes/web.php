<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ContactController;
use App\Support\BlogRepository;
use Illuminate\Foundation\Application;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Homepage');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

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

Route::get('/blog', function () {
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

Route::get('/blog/{slug}', function (string $slug) {
    $blog = new BlogRepository();
    $post = $blog->find($slug);

    abort_unless($post, 404);

    return Inertia::render('Blog/Post', [
        'publication' => $blog->publication(),
        'post' => $blog->toPostPagePayload($post),
        'relatedPosts' => $blog->related($slug, 3),
        'canonicalUrl' => $blog->absoluteUrl($slug),
    ]);
})->name('blog.post');

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
    ];

    $blogUrls = collect($blog->indexPosts())->map(fn (array $post) => [
        'loc' => $blog->absoluteUrl($post['slug']),
        'lastmod' => substr($post['publishedAtIso'], 0, 10),
    ]);

    $urls = collect($staticUrls)->merge($blogUrls);
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

    try {
        // Test database connection silently
        \DB::connection()->getPdo();
        
        return response()->json([
            'status' => 'ok',
            'build_version' => $app['build_version'] ?? 'local',
            'deployment_id' => $app['deployment_id'] ?? 'local',
            'timestamp' => now()->toISOString()
        ])->header('X-App-Version', $app['build_version'] ?? 'local')
          ->header('X-Deployment-Id', $app['deployment_id'] ?? 'local');
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'build_version' => $app['build_version'] ?? 'local',
            'deployment_id' => $app['deployment_id'] ?? 'local',
            'timestamp' => now()->toISOString()
        ], 503)->header('X-App-Version', $app['build_version'] ?? 'local')
          ->header('X-Deployment-Id', $app['deployment_id'] ?? 'local');
    }
})->name('health');

require __DIR__.'/auth.php';
