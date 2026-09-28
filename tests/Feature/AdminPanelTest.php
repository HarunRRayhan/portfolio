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
            'slug' => 'example-post', 'count' => 12, 'created_at' => now(), 'updated_at' => now(),
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
}
