<?php

namespace Tests\Feature;

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    public function test_admin_panel_redirects_guests(): void
    {
        $this->get(route('admin'))->assertRedirect('/login');
    }

    public function test_admin_panel_renders_status_data_for_verified_users(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('admin'))
            ->assertOk()
            ->assertInertia(function (Assert $page): void {
                $page->component('Dashboard')
                    ->where('panelStatus', 'Ready')
                    ->has('stats')
                    ->has('recentPosts')
                    ->has('draftPostsList');
            });
    }
}
