<?php

namespace Tests\Feature;

use App\Models\BioLink;
use App\Models\BioLinkClick;
use App\Models\ShortLink;
use App\Models\ShortLinkClick;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_panel_redirects_guests(): void
    {
        $this->get(route('admin'))->assertRedirect('/login');
    }

    public function test_admin_panel_renders_status_data_for_verified_users(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(function (Assert $page): void {
                $page->component('Dashboard')
                    ->where('panelStatus', 'Ready')
                    ->has('stats')
                    ->has('recentPosts')
                    ->has('draftPostsList');
            });
    }

    public function test_admin_panel_redirects_verified_users_to_dashboard(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);

        $this->actingAs($user)
            ->get(route('admin'))
            ->assertRedirect(route('dashboard'));
    }

    public function test_analytics_overview_is_admin_only_and_renders_link_summaries(): void
    {
        $this->get(route('admin.analytics'))->assertRedirect('/login');

        $regularUser = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'user',
        ]);
        $this->actingAs($regularUser)->get(route('admin.analytics'))->assertForbidden();

        $bioLink = BioLink::create(['label' => 'Blog', 'url' => 'https://example.com', 'icon' => 'link', 'tab' => 'default']);
        $shortLink = ShortLink::create(['destination_url' => 'https://example.com']);
        BioLinkClick::forceCreate(['bio_link_id' => $bioLink->id, 'created_at' => now()]);
        BioLinkClick::forceCreate(['bio_link_id' => $bioLink->id, 'created_at' => now()->subDays(31)]);
        ShortLinkClick::forceCreate(['short_link_id' => $shortLink->id, 'created_at' => now()]);
        DB::table('blog_post_views')->insert([
            'slug' => 'github-actions-lambda-terraform-cicd', 'count' => 12, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $user = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);

        $this->actingAs($user)
            ->get(route('admin.analytics'))
            ->assertOk()
            ->assertInertia(function (Assert $page): void {
                $page->component('Admin/Analytics')
                    ->where('bioClicks', 1)
                    ->where('shortClicks', 1)
                    ->where('bioLinks', 1)
                    ->where('shortLinks', 2)
                    ->where('blogViews', 12);
            });
    }

    public function test_posts_directory_is_admin_only_and_includes_published_post_views(): void
    {
        $this->get(route('admin.posts.index'))->assertRedirect('/login');

        $regularUser = User::factory()->create(['role' => 'user']);
        $this->actingAs($regularUser)->get(route('admin.posts.index'))->assertForbidden();

        DB::table('blog_post_views')->insert([
            'slug' => 'github-actions-lambda-terraform-cicd',
            'count' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $this->actingAs($admin)->get(route('admin.posts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Posts/Index')
                ->where('stats.totalViews', 7)
                ->where('posts', fn ($posts) => collect($posts)->contains(
                    fn ($post) => $post['slug'] === 'github-actions-lambda-terraform-cicd' && $post['viewCount'] === 7
                ))
                ->etc());
    }

    public function test_post_analytics_is_admin_only_and_ranks_published_posts(): void
    {
        $this->get(route('admin.posts.analytics'))->assertRedirect('/login');

        $regularUser = User::factory()->create(['role' => 'user']);
        $this->actingAs($regularUser)->get(route('admin.posts.analytics'))->assertForbidden();

        DB::table('blog_post_views')->insert([
            'slug' => 'github-actions-lambda-terraform-cicd',
            'count' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $this->actingAs($admin)->get(route('admin.posts.analytics'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Posts/Analytics')
                ->where('totalViews', 7)
                ->where('postsWithViews', 1)
                ->where('posts.0.slug', 'github-actions-lambda-terraform-cicd')
                ->where('posts.0.views', 7)
                ->etc());
    }
}
