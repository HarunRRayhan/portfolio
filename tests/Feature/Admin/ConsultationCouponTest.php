<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsultationCouponTest extends TestCase
{
    use RefreshDatabase;

    public function test_coupon_creation_requires_authentication(): void
    {
        $this->post('/admin/consultations/coupons', $this->payload())
            ->assertRedirect('/login');
    }

    public function test_non_admins_cannot_create_coupons(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->post('/admin/consultations/coupons', $this->payload())
            ->assertForbidden();
    }

    public function test_admins_can_create_coupons(): void
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->post('/admin/consultations/coupons', $this->payload())
            ->assertRedirect('/admin/consultations/coupons');

        $this->assertDatabaseHas('consultation_coupons', [
            'code' => 'LAUNCH20',
            'percent_off' => 20,
            'is_active' => true,
        ]);
    }

    private function payload(): array
    {
        return [
            'code' => 'LAUNCH20',
            'percent_off' => 20,
            'tier_slugs' => ['light', 'pro', 'max'],
            'max_redemptions' => null,
            'expires_at' => null,
            'is_active' => true,
        ];
    }
}
