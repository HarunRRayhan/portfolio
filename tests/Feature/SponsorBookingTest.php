<?php

namespace Tests\Feature;

use App\Mail\Consultation\BookingPendingAdminMail;
use App\Mail\Consultation\BookingPendingClientMail;
use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationCredit;
use App\Models\ConsultationSetting;
use App\Models\GithubSponsorship;
use App\Models\User;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Sponsorship\SponsorCreditService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\Support\CreatesSponsorCredits;
use Tests\TestCase;

class SponsorBookingTest extends TestCase
{
    use CreatesSponsorCredits;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['mail.owner.address' => 'owner@example.com']);

        ConsultationSetting::setValue('schedule_timezone', 'UTC');
        ConsultationAvailabilityWindow::query()->delete();
        foreach ([1, 2, 3, 4, 5] as $weekday) {
            ConsultationAvailabilityWindow::create([
                'weekday' => $weekday, 'start_time' => '09:00:00', 'end_time' => '17:00:00', 'is_active' => true,
            ]);
        }
    }

    private function slot(int $days = 3, int $hour = 10): Carbon
    {
        $at = now('UTC')->addDays($days)->setTime($hour, 0);
        while ($at->isWeekend()) {
            $at->addDay();
        }

        return $at;
    }

    private function payload(ConsultationCredit $credit, ?Carbon $startsAt = null): array
    {
        return [
            'credit_id' => $credit->id,
            'client_name' => 'Client Person',
            'company_name' => 'Acme',
            'website' => 'https://acme.test',
            'notes' => 'Kubernetes help',
            'starts_at' => ($startsAt ?? $this->slot())->toIso8601String(),
        ];
    }

    private function book(User $user, ConsultationCredit $credit, ?Carbon $startsAt = null): ConsultationBooking
    {
        $this->actingAs($user)->post('/book', $this->payload($credit, $startsAt))
            ->assertSessionHasNoErrors()->assertRedirect();

        return ConsultationBooking::query()->latest('id')->firstOrFail();
    }

    private function workflow(): BookingWorkflowService
    {
        return app(BookingWorkflowService::class);
    }

    public function test_store_with_credit_creates_pending_booking_holds_credit_and_mails_owner(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'client@example.com']);
        $credit = $this->sponsorCredit($user, 'max');

        $booking = $this->book($user, $credit);

        $this->assertSame(ConsultationBooking::STATUS_PENDING_APPROVAL, $booking->status);
        $this->assertSame('max', $booking->tier->slug);
        $this->assertSame(0, $booking->amount_due_cents);
        $this->assertSame((int) $booking->tier->price_cents, $booking->list_price_cents);
        $this->assertSame(0, $booking->campaign_discount_cents);
        $this->assertNull($booking->consultation_coupon_id);
        $credit->refresh();
        $this->assertSame($booking->id, $credit->used_by_booking_id);
        $this->assertNotNull($credit->used_at);
        $this->assertSame('0', ConsultationSetting::query()
            ->where('key', 'consultation_booking_promotion_claimed_count')->value('value') ?? '0');
        Mail::assertSent(BookingPendingAdminMail::class, fn ($m) => $m->hasTo('owner@example.com'));
        Mail::assertSent(BookingPendingClientMail::class, fn ($m) => $m->hasTo('client@example.com'));
    }

    public function test_approve_credit_booking_confirms_without_payment(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $booking = $this->book($user, $this->sponsorCredit($user));

        $approved = $this->workflow()->approve($booking);

        $this->assertSame(ConsultationBooking::STATUS_CONFIRMED, $approved->status);
        $this->assertNotNull($approved->confirmed_at);
        $this->assertNull($approved->stripe_checkout_session_id);
        $this->assertFalse($booking->events()->where('event', 'approved_awaiting_payment')->exists());
    }

    public function test_expired_hold_returns_credit(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $credit = $this->sponsorCredit($user);
        $booking = $this->book($user, $credit, $this->slot(5));

        $this->travelTo($booking->hold_expires_at->copy()->addMinute());
        $this->assertSame(1, $this->workflow()->expireStaleHolds());

        $this->assertSame(ConsultationBooking::STATUS_EXPIRED, $booking->fresh()->status);
        $credit->refresh();
        $this->assertNull($credit->used_by_booking_id);
        $this->assertNull($credit->used_at);
    }

    public function test_store_without_credit_rejected(): void
    {
        $this->actingAs(User::factory()->create())->post('/book', [
            'tier' => 'light',
            'client_name' => 'Client Person',
            'company_name' => 'Acme',
            'website' => 'https://acme.test',
            'notes' => 'Kubernetes help',
            'starts_at' => $this->slot()->toIso8601String(),
        ])->assertSessionHasErrors('credit_id');

        $this->assertDatabaseCount('consultation_bookings', 0);
    }

    public function test_slot_after_expiry_rejected(): void
    {
        $user = User::factory()->create();
        $credit = $this->sponsorCredit($user, 'light', ['expires_at' => $this->slot(5)->subDay()]);

        $this->actingAs($user)->post('/book', $this->payload($credit, $this->slot(5)))
            ->assertSessionHasErrors(['starts_at' => 'That credit has expired or was already used.']);

        $this->assertDatabaseCount('consultation_bookings', 0);
        $this->assertNull($credit->fresh()->used_at);
    }

    public function test_used_credit_cannot_book_twice(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $credit = $this->sponsorCredit($user);
        $first = $this->book($user, $credit, $this->slot(3, 10));

        $this->actingAs($user)->post('/book', $this->payload($credit, $this->slot(3, 14)))
            ->assertSessionHasErrors(['starts_at' => 'That credit has expired or was already used.']);

        $this->assertDatabaseCount('consultation_bookings', 1);
        $this->assertSame($first->id, $credit->fresh()->used_by_booking_id);
    }

    public function test_decline_returns_credit(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $credit = $this->sponsorCredit($user);
        $booking = $this->book($user, $credit);

        $this->workflow()->decline($booking);

        $this->assertSame(ConsultationBooking::STATUS_DECLINED, $booking->fresh()->status);
        $this->assertNull($credit->fresh()->used_by_booking_id);
    }

    public function test_approved_cancel_returns_credit(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $credit = $this->sponsorCredit($user);
        $booking = $this->workflow()->approve($this->book($user, $credit));
        $this->workflow()->requestCancel($booking);

        $this->workflow()->approveCancel($booking->fresh());

        $this->assertSame(ConsultationBooking::STATUS_CANCELLED, $booking->fresh()->status);
        $this->assertNull($credit->fresh()->used_by_booking_id);
        $this->assertTrue(ConsultationCredit::query()->usable()->whereKey($credit->id)->exists());
    }

    public function test_show_claims_credits_and_flags_missing_github_identity(): void
    {
        $user = User::factory()->create(['email' => 'sponsor@example.com', 'provider_name' => 'google', 'provider_id' => 'g-1']);
        app(SponsorCreditService::class)->recordSponsorship([
            'github_sponsor_id' => '4242', 'github_login' => 'sponsor', 'tier_slug' => 'max',
            'kind' => 'one_time', 'status' => 'active', 'source' => GithubSponsorship::SOURCE_MANUAL,
            'grant_email' => 'Sponsor@example.com', 'started_at' => now(),
        ]);

        $this->actingAs($user)->get('/consultation')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Book')
            ->has('credits', 1)
            ->where('credits.0.tier_slug', 'max')
            ->where('credits.0.kind', 'call')
            ->has('credits.0.id')
            ->has('credits.0.tier_name')
            ->has('credits.0.expires_at')
            ->where('hasGithubIdentity', false)
            ->where('githubLinkUrl', route('social.redirect', ['provider' => 'github', 'redirect' => '/consultation']))
            ->where('contactUrl', route('contact'))
            ->where('sponsorsUrl', config('sponsors.url'))
            ->has('sponsorTiers', 4)
            ->has('sponsorTiers.0', fn ($t) => $t->hasAll(['slug', 'url', 'kind']))
            ->missing('stripeConfigured')
            ->missing('launchPromotion')
            ->where('seo.jsonLd.0.description', 'Sponsor on GitHub, then book a time.'));

        DB::table('social_identities')->insert([
            'user_id' => $user->id, 'provider' => 'github', 'provider_id' => '4242',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->actingAs($user)->get('/consultation')
            ->assertInertia(fn ($page) => $page->where('hasGithubIdentity', true));
    }

    public function test_other_users_credit_rejected(): void
    {
        $owner = User::factory()->create();
        $credit = $this->sponsorCredit($owner);

        $this->actingAs(User::factory()->create())->post('/book', $this->payload($credit))
            ->assertSessionHasErrors('credit_id');

        $this->assertDatabaseCount('consultation_bookings', 0);
        $this->assertNull($credit->fresh()->used_at);
    }

    public function test_availability_is_capped_at_credit_expiry(): void
    {
        $user = User::factory()->create();
        $expires = $this->slot(5)->setTime(12, 0);
        $credit = $this->sponsorCredit($user, 'light', ['expires_at' => $expires]);

        $slots = $this->actingAs($user)->getJson('/book/availability?tier=light&credit='.$credit->id)
            ->assertOk()->json('slots');

        $this->assertNotEmpty($slots);
        foreach ($slots as $slot) {
            $this->assertTrue(Carbon::parse($slot['start'])->lte($expires));
        }
    }

    public function test_availability_for_credit_beyond_horizon_returns_slots(): void
    {
        $user = User::factory()->create();
        $credit = $this->sponsorCredit($user, 'light', ['expires_at' => now()->addDays(60)]);

        $slots = $this->actingAs($user)->getJson('/book/availability?tier=light&credit='.$credit->id)
            ->assertOk()->json('slots');

        $this->assertNotEmpty($slots);
    }

    public function test_show_includes_scan_credit_for_monthly_sponsor(): void
    {
        $user = User::factory()->create(['provider_name' => 'github', 'provider_id' => '5151']);
        app(SponsorCreditService::class)->recordSponsorship([
            'github_sponsor_id' => '5151', 'github_login' => 'sponsor', 'tier_slug' => 'monthly',
            'kind' => 'monthly', 'status' => 'active', 'source' => GithubSponsorship::SOURCE_WEBHOOK,
            'started_at' => now(),
        ]);

        $this->actingAs($user)->get('/consultation')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Book')
            ->has('credits', 3)
            ->where('credits', fn ($credits) => collect($credits)->where('kind', 'scan')->count() === 1
                && collect($credits)->where('kind', 'call')->count() === 2));
    }
}
