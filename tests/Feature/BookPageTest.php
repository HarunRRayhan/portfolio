<?php

namespace Tests\Feature;

use App\Models\ConsultationCoupon;
use App\Models\ConsultationSetting;
use App\Models\ConsultationTier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_book_page_renders_tiers(): void
    {
        $this->assertGreaterThanOrEqual(3, ConsultationTier::query()->count());

        $response = $this->get('/book');

        $response->assertOk();
        $response->assertSee('<meta name="csrf-token"', false);
        $response->assertInertia(fn ($page) => $page
            ->component('Book')
            ->has('tiers', 3)
            ->has('timezones')
            ->where('tiers.0.price_cents', 24900)
            ->where('tiers.1.price_cents', 34900)
            ->where('tiers.2.price_cents', 44900)
            ->where('launchPromotion.discount_cents', 10000)
            ->where('launchPromotion.limit', 1001)
            ->where('launchPromotion.remaining_bookings', 1001));
    }

    public function test_coupon_preview_stacks_after_the_launch_discount(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        ConsultationCoupon::create([
            'code' => 'STACK20',
            'percent_off' => 20,
            'tier_slugs' => [$tier->slug],
            'is_active' => true,
        ]);

        $response = $this->postJson('/book/coupon', [
            'code' => 'stack20',
            'tier' => $tier->slug,
        ]);

        $response->assertOk()->assertJson([
            'valid' => true,
            'percent_off' => 20,
            'campaign_discount_cents' => 10000,
            'amount_due_cents' => 11920,
        ]);
        $this->assertSame('0', ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')
            ->value('value'));
    }
}
