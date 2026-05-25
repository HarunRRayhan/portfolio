---
title: "Everything New in Laravel 13: The Complete Guide"
slug: "everything-new-in-laravel-13"
brief: "Laravel 13 dropped on March 17, 2026, and I've spent the last two days digging through every commit, PR, and doc page. There's a lot to unpack here. This isn't one of those \"minor version bump\" releas"
publishedAt: "2026-03-23T09:00:00.000Z"
readTimeInMinutes: 11
reactionCount: 0
responseCount: 0
replyCount: 0
sourceUrl: "https://web.archive.org/web/*/https://blog.harun.dev/everything-new-in-laravel-13"
coverImageUrl: "https://raw.githubusercontent.com/HarunRRayhan/blog-assets/main/covers/everything-new-in-laravel-13/cover.jpg"
tags:
  - name: "Laravel"
    slug: "laravel"
  - name: "PHP"
    slug: "php"
  - name: "webdev"
    slug: "webdev"
  - name: "AI"
    slug: "ai"
  - name: "Beginner Developers"
    slug: "beginners"
---
<p>Laravel 13 dropped on March 17, 2026, and I've spent the last two days digging through every commit, PR, and doc page. There's a lot to unpack here. This isn't one of those "minor version bump" releases. The framework took some real swings this time around.</p>
<p>I'm going to walk you through every major feature, the stuff that matters, and the stuff you'll actually use in your day-to-day work. We're talking PHP attributes across the entire framework, a first-party AI SDK, native vector search, passkey auth, and a bunch of smaller quality-of-life improvements that add up fast.</p>
<p>If you want the official changelog, check out the <a href="https://laravel.com/docs/13.x/releases">Laravel 13 release notes</a>. But if you want the practical breakdown with real code examples and honest opinions, keep reading.</p>
<p>Let's get into it.</p>
<p><img src="https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Developer working on laptop with code" />
<sub>Photo by <a href="https://www.pexels.com/@goumbik">Lukas Blazek</a> on <a href="https://www.pexels.com/photo/laptop-computer-showing-c-application-574069/">Pexels</a></sub></p>
<h2>PHP Attributes Everywhere</h2>
<p>This is the biggest developer experience change in Laravel 13, and honestly, it's the one I'm most excited about. The framework now supports PHP attributes in over 15 different locations. All of them are fully optional and backward-compatible. Your existing code keeps working. You just get a cleaner way to do things if you want it.</p>
<p>Let me show you what this looks like in practice. PR <a href="https://github.com/laravel/framework/pull/58578">#58578</a> is the main one to follow.</p>
<p><strong>Eloquent models</strong> can now use attributes for observers and scopes:</p>
<pre><code class="language-php">use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;

#[ObservedBy(UserObserver::class)]
#[ScopedBy(ActiveScope::class)]
class HrrUser extends Model
{
    // No more boot() boilerplate
}
</code></pre>
<p><strong>Queue jobs</strong> get rate limiting and overlap prevention right on the class:</p>
<pre><code class="language-php">use Illuminate\Queue\Attributes\WithoutOverlapping;
use Illuminate\Queue\Attributes\RateLimited;

#[WithoutOverlapping(key: 'user-{userId}')]
#[RateLimited('default')]
class HrrProcessPaymentJob implements ShouldQueue
{
    public function __construct(public int $userId) {}

    public function handle(): void
    {
        // payment logic
    }
}
</code></pre>
<p><strong>Controllers</strong> can apply middleware to individual methods instead of the constructor:</p>
<pre><code class="language-php">use Illuminate\Routing\Attributes\Middleware;

class HrrOrderController extends Controller
{
    #[Middleware(['auth', 'verified'])]
    public function store(Request $request): Response
    {
        // create order
    }
}
</code></pre>
<p>And <strong>Artisan commands</strong> can define their schedule right on the class:</p>
<pre><code class="language-php">use Illuminate\Console\Attributes\Schedule;

#[Schedule('daily')]
class HrrSendDailyReportCommand extends Command
{
    protected $signature = 'hrr:daily-report';

    public function handle(): void
    {
        // send report
    }
}
</code></pre>
<p>So what's actually going away? Nothing. The old <code>$casts</code> array, the <code>boot()</code> method, the <code>Kernel.php</code> scheduling, all of that still works. Attributes are just a cleaner alternative that keeps your configuration closer to the code it affects. No breaking changes.</p>
<p>This is my favorite change in this release. It makes your code more scannable and cuts down on the boilerplate you have to remember.</p>
<p><img src="https://images.pexels.com/photos/14553707/pexels-photo-14553707.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Clean organized code structure" />
<sub>Photo by <a href="https://www.pexels.com/@bibekghosh">Bibek ghosh</a> on <a href="https://www.pexels.com/photo/programming-data-on-a-computer-14553707/">Pexels</a></sub></p>
<h2>Laravel AI SDK</h2>
<p>The <code>laravel/ai</code> package hit stable 1.0 alongside this release, and it's a big deal. Laravel now has first-party support for AI across multiple providers. OpenAI, Anthropic, and Gemini all work out of the box. You get text generation, image generation, audio transcription, embeddings, and even agents with tool support.</p>
<p>The API is clean and fluent, exactly what you'd expect from a Laravel package:</p>
<pre><code class="language-php">use Laravel\AI\Facades\AI;

// Text generation
\(response = AI::text('Write a product description for ' . \)product-&gt;name);

// With a specific provider
\(response = AI::provider('anthropic')-&gt;text('Summarize this document: ' . \)doc-&gt;content);

// Embeddings for semantic search
$vector = AI::embeddings('Laravel is a PHP framework');

// Agent with tools
$result = AI::agent()
    -&gt;tools([new HrrSearchTool(), new HrrCalculateTool()])
    -&gt;run('Find the best product for under $50 and calculate shipping');
</code></pre>
<p>Setting up multiple providers is straightforward in the config:</p>
<pre><code class="language-php">// config/ai.php
'providers' =&gt; [
    'openai' =&gt; [
        'driver' =&gt; 'openai',
        'api_key' =&gt; env('OPENAI_API_KEY'),
        'model' =&gt; 'gpt-4o',
    ],
    'anthropic' =&gt; [
        'driver' =&gt; 'anthropic',
        'api_key' =&gt; env('ANTHROPIC_API_KEY'),
        'model' =&gt; 'claude-sonnet-4-6',
    ],
],
'default' =&gt; env('AI_PROVIDER', 'openai'),
</code></pre>
<p>The agents feature is the one that caught my eye. You define tool classes, hand them to the agent, and it figures out when to call them. It's the kind of thing you'd normally need LangChain or a custom orchestrator for. Now it's built into your Laravel app with a one-liner.</p>
<p>Check out the full package at <a href="https://github.com/laravel/ai">github.com/laravel/ai</a>. I'll be writing a deeper dive on this one soon.</p>
<p><img src="https://images.pexels.com/photos/29393022/pexels-photo-29393022.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Robot and AI technology" />
<sub>Photo by <a href="https://www.pexels.com/@vladimirsrajber">Vladimir Srajber</a> on <a href="https://www.pexels.com/photo/robotic-dog-in-indoor-setting-with-red-chairs-29393022/">Pexels</a></sub></p>
<h2>Semantic Search with pgvector</h2>
<p>Laravel 13 ships first-class pgvector support, and it pairs perfectly with the AI SDK embeddings from the previous section. If you've ever wanted to build "search by meaning" into your app instead of just keyword matching, this is how you do it now.</p>
<p>Start with a migration. The new <code>vector</code> column type handles everything:</p>
<pre><code class="language-php">Schema::create('hrr_articles', function (Blueprint $table) {
    $table-&gt;id();
    $table-&gt;string('title');
    $table-&gt;text('content');
    $table-&gt;vector('embedding', dimensions: 1536);
    $table-&gt;timestamps();
});
</code></pre>
<p>Your model uses the new <code>HasVector</code> attribute to declare the vector column:</p>
<pre><code class="language-php">use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\HasVector;

#[HasVector('embedding', dimensions: 1536)]
class HrrArticle extends Model
{
    protected $fillable = ['title', 'content', 'embedding'];
}
</code></pre>
<p>Now querying by similarity is just a few lines:</p>
<pre><code class="language-php">use Laravel\AI\Facades\AI;

// Get embedding for the search query
\(queryVector = AI::embeddings(\)request-&gt;query('q'));

// Find similar articles
\(articles = HrrArticle::whereVectorSimilarTo('embedding', \)queryVector)
    -&gt;orderByVectorDistance('embedding', $queryVector)
    -&gt;limit(10)
    -&gt;get();
</code></pre>
<p>Notice how the AI SDK embeddings feed directly into the vector query. Generate the embedding, pass it to the Eloquent query builder, done. No external vector databases. No complicated setup. Just PostgreSQL with the pgvector extension and your normal Laravel app.</p>
<p>You will need PostgreSQL with pgvector installed. If you're on a managed database like AWS RDS or Neon, pgvector is usually available as an extension you can enable. For local development, the official pgvector Docker image works great.</p>
<h2>JSON:API Resources and Passkey Authentication</h2>
<p>Two distinct features here, but both are things people have been asking for. Let's cover them together.</p>
<h3>JSON:API Resources</h3>
<p>Laravel 13 adds a <code>JsonApiResource</code> class that produces spec-compliant JSON:API responses. If you've ever had to build a JSON:API backend by hand or pull in a third-party package, you know how tedious that envelope format can be. Now it's built in.</p>
<pre><code class="language-php">use Illuminate\Http\Resources\Json\JsonApiResource;

class HrrUserResource extends JsonApiResource
{
    public function toAttributes(Request $request): array
    {
        return [
            'name' =&gt; $this-&gt;name,
            'email' =&gt; $this-&gt;email,
            'created_at' =&gt; $this-&gt;created_at,
        ];
    }

    public function toRelationships(Request $request): array
    {
        return [
            'posts' =&gt; HrrPostResource::collection($this-&gt;posts),
        ];
    }
}
</code></pre>
<p>That automatically produces the proper JSON:API envelope with <code>data.type</code>, <code>data.id</code>, <code>data.attributes</code>, and <code>data.relationships</code>. No manual wrapping. No string concatenation for the type field. It just works.</p>
<h3>Passkey Authentication (WebAuthn)</h3>
<p>Laravel 13 starter kits now include passkey authentication out of the box. Touch ID, Face ID, hardware security keys. No third-party packages. No paid services. It's all built in.</p>
<pre><code class="language-php">// routes/web.php
Route::post('/passkeys/register', [PasskeyController::class, 'store'])
    -&gt;middleware('auth');

Route::post('/passkeys/authenticate', [PasskeyController::class, 'authenticate']);
</code></pre>
<pre><code class="language-php">use Laravel\Auth\Passkeys\PasskeyRegistration;
use Laravel\Auth\Passkeys\PasskeyAuthentication;

class HrrPasskeyController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        \(passkey = PasskeyRegistration::verify(\)request);
        \(request-&gt;user()-&gt;passkeys()-&gt;save(\)passkey);

        return response()-&gt;json(['registered' =&gt; true]);
    }
}
</code></pre>
<p>I've been waiting for native passkey support in Laravel for a while. The WebAuthn spec is complex and the existing packages required a lot of configuration. This implementation is clean. You add a few routes, call the verify method, and your users can log in with their fingerprint or face. That's it.</p>
<p><img src="https://images.pexels.com/photos/8369513/pexels-photo-8369513.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Biometric security authentication" />
<sub>Photo by <a href="https://www.pexels.com/@cottonbro">cottonbro studio</a> on <a href="https://www.pexels.com/photo/close-up-photo-of-fingerpints-on-paper-8369513/">Pexels</a></sub></p>
<h2>Laravel Boost MCP Server</h2>
<p>This one is interesting. Laravel 13 ships <code>laravel/boost</code>, a first-party MCP (Model Context Protocol) server that lets AI agents interact with your Laravel application. It comes with 15 built-in tools for things like running Artisan commands, querying your database, inspecting routes and models, running migrations, and executing tests.</p>
<pre><code class="language-bash"># Install Boost
composer require laravel/boost

# Start the MCP server
php artisan boost:serve

# Or use the CLI directly
./vendor/bin/boost
</code></pre>
<p>To connect it to your AI editor (Claude Desktop, Cursor, or anything that supports MCP), just add it to your config:</p>
<pre><code class="language-json">// .mcp.json (for Claude Desktop, Cursor, etc.)
{
  "mcpServers": {
    "laravel-boost": {
      "command": "./vendor/bin/boost",
      "args": [],
      "cwd": "/path/to/your/app"
    }
  }
}
</code></pre>
<p>The 15 built-in tools cover most of what you'd want an AI agent to do with your app. Artisan runner, route inspector, model explorer, migration runner, test runner, log reader, and more. But here's the thing that really stands out. Boost includes a <code>/upgrade-laravel-v13</code> prompt that walks AI agents through the entire upgrade process automatically. It inspects your codebase, identifies deprecated patterns, and suggests the changes you need.</p>
<p>If you're already using AI-assisted development, this is a natural extension of your workflow. And if you're not, this might be the feature that gets you started.</p>
<p>Check out the full tool list at <a href="https://github.com/laravel/boost">github.com/laravel/boost</a>.</p>
<h2>Everything Else Worth Knowing</h2>
<p>There are a handful of smaller changes in Laravel 13 that don't warrant their own section but are still worth knowing about. Let me run through them quickly.</p>
<h3>PreventRequestForgery Middleware</h3>
<p>You can now explicitly opt in or out of CSRF-like verification on specific routes:</p>
<pre><code class="language-php">use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

Route::post('/webhook/stripe', HrrStripeWebhookController::class)
    -&gt;withoutMiddleware(PreventRequestForgery::class);

Route::post('/api/internal', HrrInternalController::class)
    -&gt;middleware(PreventRequestForgery::class);
</code></pre>
<h3>Queue::route() for Dynamic Queue Routing</h3>
<p>Route jobs to different queues based on their type or data. No more hardcoding queue names in every job class:</p>
<pre><code class="language-php">use Illuminate\Support\Facades\Queue;

Queue::route(function ($job) {
    if ($job instanceof HrrProcessLargeFileJob) {
        return 'heavy';
    }
    if ($job-&gt;priority === 'high') {
        return 'critical';
    }
    return 'default';
});
</code></pre>
<h3>Cache::touch()</h3>
<p>Reset the TTL on a cache key without fetching and re-storing the value. Simple but useful for sliding window patterns:</p>
<pre><code class="language-php">// Extend cache entry TTL by another hour without re-fetching
Cache::touch('hrr_user_session_' . $userId, now()-&gt;addHour());

// Useful for sliding window expiration
Cache::touch('hrr_rate_limit_' . $ip, 60);
</code></pre>
<h3>Reverb Database Driver</h3>
<p>You can now use your existing database as a Reverb backend instead of Redis. Great for smaller apps where you don't want to run a separate Redis instance:</p>
<pre><code class="language-php">// config/broadcasting.php
'reverb' =&gt; [
    'driver' =&gt; 'reverb',
    'storage' =&gt; env('REVERB_STORAGE', 'database'), // was 'redis' only before
],
</code></pre>
<h3>Teams in Starter Kits</h3>
<p>The Breeze and Jetstream-style starter kits now include Teams support out of the box. One flag and you're set:</p>
<pre><code class="language-bash">php artisan install:breeze react --teams
php artisan install:api --teams
</code></pre>
<h3>PHP 8.5 Closure Attributes</h3>
<p>Laravel 13 uses PHP 8.5's new closure attributes internally. This enables cleaner attribute-based hooks across the framework:</p>
<pre><code class="language-php">// New in PHP 8.5 + Laravel 13 internals
$fn = #[SomeAttribute] function() { return 42; };
</code></pre>
<p>Each of these is a small win on its own. Together, they add up to a release that touches almost every part of the framework.</p>
<p><img src="https://images.pexels.com/photos/5846253/pexels-photo-5846253.jpeg?auto=compress&amp;cs=tinysrgb&amp;h=650&amp;w=940" alt="Collection of tools and equipment" />
<sub>Photo by <a href="https://www.pexels.com/@tima-miroshnichenko">Tima Miroshnichenko</a> on <a href="https://www.pexels.com/photo/a-variety-of-tools-at-a-workshop-5846253/">Pexels</a></sub></p>
<h2>Breaking Changes and Upgrade Guide</h2>
<p>Now for the part nobody loves but everybody needs. Let's talk about what breaks and what you need to do about it.</p>
<p><strong>Minimum requirements have changed:</strong></p>
<ul>
<li>PHP 8.3 or higher (PHP 8.1 and 8.2 are no longer supported)</li>
<li>Symfony 7.4 or 8.0</li>
</ul>
<p>Here's a quick breakdown of the breaking changes:</p>
<table>
<thead>
<tr>
<th>Change</th>
<th>Impact</th>
<th>Fix</th>
</tr>
</thead>
<tbody><tr>
<td>PHP 8.1/8.2 dropped</td>
<td>Medium</td>
<td>Upgrade PHP to 8.3+</td>
</tr>
<tr>
<td>Symfony 7.4/8.0 required</td>
<td>Medium</td>
<td>Update via composer</td>
</tr>
<tr>
<td><code>Model::unguard()</code> removed</td>
<td>Low</td>
<td>Use <code>$guarded = []</code> instead</td>
</tr>
<tr>
<td>Old <code>Schedule</code> kernel removed</td>
<td>Low</td>
<td>Move to route or attribute scheduling</td>
</tr>
<tr>
<td><code>assertStatus()</code> strict mode</td>
<td>Low</td>
<td>Check test assertions</td>
</tr>
</tbody></table>
<p>To upgrade, start with composer and then verify your tests:</p>
<pre><code class="language-bash"># Upgrade Laravel to 13
composer require laravel/framework:^13.0

# Run the upgrade checks via Boost (if installed)
php artisan boost:check-upgrade

# Run existing tests to find breaking changes
php artisan test

# Check for deprecated usages
php artisan about
</code></pre>
<p>The impact here is moderate. If you're already on PHP 8.3 and your tests pass, you're probably fine. The <code>Model::unguard()</code> removal and schedule kernel changes are easy fixes. And if you installed Boost, the upgrade prompt can walk you through the rest automatically.</p>
<p>Laravel 13 is a clear signal that the framework is moving toward AI-native PHP. The AI SDK, vector search, and MCP server aren't experiments. They're first-party packages with long-term support. Taylor and the team are betting that AI features belong in the framework, not just in third-party packages.</p>
<p>Hope you enjoyed this rundown of Laravel 13. There's a lot here, and I'll be writing deeper dives on the AI SDK and pgvector integration in future posts.</p>
<p>Follow me on <a href="https://x.com/HarunRRayhan">Twitter/X</a> for more Laravel and PHP content. Drop a comment if you've already upgraded or if you have questions.</p>
