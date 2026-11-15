<?php

namespace Tests\Feature\Admin;

use App\Models\RoadmapAccessGrant;
use App\Models\User;
use App\Support\RoadmapAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapAccessAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'terms_accepted_at' => now()]);
    }

    public function test_non_admins_are_forbidden(): void
    {
        $user = User::factory()->create();
        $grant = RoadmapAccessGrant::create(['email' => 'a@b.com', 'expires_at' => now()->addDay()]);

        $this->actingAs($user)->get('/admin/roadmap-access')->assertForbidden();
        $this->actingAs($user)->post('/admin/roadmap-access', ['email' => 'x@y.com', 'expires_at' => now()->addWeek()->toDateString()])->assertForbidden();
        $this->actingAs($user)->post("/admin/roadmap-access/{$grant->id}/revoke")->assertForbidden();
        $this->assertSame(1, RoadmapAccessGrant::count());
        // A missing id must look the same as an existing one to non-admins.
        $this->actingAs($user)->post('/admin/roadmap-access/999999/revoke')->assertForbidden();
    }

    public function test_admin_grants_and_revokes_access(): void
    {
        $admin = $this->admin();
        $student = User::factory()->create(['email' => 'student@example.com']);

        $this->actingAs($admin)->post('/admin/roadmap-access', [
            'email' => 'Student@Example.com',
            'expires_at' => now()->addMonth()->toDateString(),
            'note' => 'Workshop attendee',
        ])->assertRedirect();

        $grant = RoadmapAccessGrant::firstOrFail();
        $this->assertSame('student@example.com', $grant->email);
        $this->assertSame($student->id, $grant->user_id);
        $this->assertSame($admin->id, $grant->granted_by);
        $this->assertTrue(RoadmapAccess::canAccessPaid($student));

        $this->actingAs($admin)->get('/admin/roadmap-access')->assertOk()->assertInertia(fn ($p) => $p
            ->component('Admin/RoadmapAccess/Index')
            ->where('grants.0.email', 'student@example.com')
            ->where('grants.0.status', 'active'));

        $this->actingAs($admin)->post("/admin/roadmap-access/{$grant->id}/revoke")->assertRedirect();
        $this->assertFalse(RoadmapAccess::canAccessPaid($student));
    }

    public function test_expiry_must_be_in_the_future(): void
    {
        $this->actingAs($this->admin())->post('/admin/roadmap-access', [
            'email' => 'x@y.com',
            'expires_at' => now()->subDay()->toDateString(),
        ])->assertSessionHasErrors('expires_at');

        $this->assertSame(0, RoadmapAccessGrant::count());
    }
}
