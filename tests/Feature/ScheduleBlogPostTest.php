<?php

namespace Tests\Feature;

use App\Models\BlogPostSchedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\CreatesDraftBlogPost;
use Tests\TestCase;

class ScheduleBlogPostTest extends TestCase
{
    use CreatesDraftBlogPost;
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_admin_can_schedule_a_draft_and_it_goes_live_without_rewriting_the_file(): void
    {
        $draft = $this->createDraftBlogPost();
        $path = resource_path('blog/posts/'.$draft['slug'].'.md');
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->post(route('admin.posts.schedule', $draft['slug']), [
            'publish_at' => '2026-10-13T11:00',
        ])->assertRedirect('/login');

        $this->actingAs($admin)
            ->get(route('admin.posts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Posts/Index')
                ->where('scheduleTimezone', 'Asia/Dhaka')
                ->where('posts', fn ($posts) => collect($posts)->contains(
                    fn ($post) => $post['slug'] === $draft['slug']
                        && $post['canSchedule'] === true
                        && $post['isScheduled'] === false
                )));

        $this->actingAs($admin)
            ->post(route('admin.posts.schedule', $draft['slug']), [
                'publish_at' => '2020-01-01T11:00',
            ])
            ->assertSessionHasErrors('publish_at');

        $this->actingAs($admin)
            ->post(route('admin.posts.schedule', $draft['slug']), [
                'publish_at' => '2026-10-13T11:00',
            ])
            ->assertRedirect(route('admin.posts.index'));

        $schedule = BlogPostSchedule::query()->where('slug', $draft['slug'])->first();
        $this->assertNotNull($schedule);
        $this->assertSame('2026-10-13 05:00:00', $schedule->publish_at->utc()->format('Y-m-d H:i:s'));
        $this->assertNull($schedule->notified_at);

        $this->get('/blog/'.$draft['slug'])->assertNotFound();
        $this->get('/blog/'.$draft['slug'].'/draft/'.$draft['token'])->assertOk();

        Carbon::setTestNow(Carbon::parse('2026-10-13 05:00:00', 'UTC'));

        $this->get('/blog/'.$draft['slug'])->assertOk();
        $this->get('/blog/'.$draft['slug'].'/draft/'.$draft['token'])->assertRedirect('/blog/'.$draft['slug']);
        $this->get('/sitemap.xml')->assertSee('/blog/'.$draft['slug'], false);
        $this->get('/blog/feed.xml')->assertSee('/blog/'.$draft['slug'], false);
        $this->get('/blog/feed.xml')->assertSee('rel="hub"', false);

        Http::fake([
            'https://api.indexnow.org/indexnow' => Http::response('', 200),
        ]);
        config([
            'app.url' => 'https://harun.dev',
            'ai.indexnow_key' => '0123456789abcdef',
        ]);

        $this->artisan('blog:publish-scheduled')
            ->expectsOutputToContain('Notified IndexNow about 1 new post URL(s).')
            ->expectsOutputToContain('Google retired /ping?sitemap=')
            ->assertSuccessful();

        $this->assertStringContainsString('draft: true', (string) file_get_contents($path));
        $this->assertNotNull($schedule->fresh()?->notified_at);

        Http::assertSent(function ($request) use ($draft): bool {
            $data = $request->data();

            return $request->url() === 'https://api.indexnow.org/indexnow'
                && ($data['urlList'] ?? null) === ['https://harun.dev/blog/'.$draft['slug']];
        });

        $this->artisan('blog:publish-scheduled')->assertSuccessful();
        Http::assertSentCount(1);
    }
}
