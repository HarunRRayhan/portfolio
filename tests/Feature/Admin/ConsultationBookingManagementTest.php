<?php

namespace Tests\Feature\Admin;

use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Models\User;
use App\Services\Consultation\AvailabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConsultationBookingManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->actingAs(User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]));
    }

    public function test_bookings_beyond_the_previous_hundred_limit_are_reachable(): void
    {
        for ($i = 0; $i < 102; $i++) {
            $this->booking(['client_name' => 'Pagination client '.$i]);
        }

        $this->get('/admin/consultations/bookings?page=5')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Consultations/Bookings/Index')
                ->where('bookings.total', 102)
                ->where('bookings.current_page', 5)
                ->where('bookings.from', 101)
                ->where('bookings.to', 102)
                ->has('bookings.data', 2));
    }

    public function test_search_matches_each_identity_field_case_insensitively_and_keeps_status(): void
    {
        foreach (['client_name', 'client_email', 'company_name', 'public_id'] as $field) {
            $value = $field === 'client_email' ? 'SearchNeedle@example.test' : 'SearchNeedle '.$field;
            $this->booking([$field => $value, 'status' => 'confirmed']);
        }
        $this->booking(['client_name' => 'SearchNeedle declined', 'status' => 'declined']);
        $this->booking(['client_name' => 'Other confirmed', 'status' => 'confirmed']);

        $this->get('/admin/consultations/bookings?q=searchneedle&status=confirmed')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filterStatus', 'confirmed')
                ->where('searchQuery', 'searchneedle')
                ->where('bookings.total', 4)
                ->has('bookings.data', 4));
    }

    public function test_pagination_preserves_search_and_status_and_treats_wildcards_as_text(): void
    {
        for ($i = 0; $i < 26; $i++) {
            $this->booking(['company_name' => '100%_Match', 'status' => 'confirmed']);
        }
        $this->booking(['company_name' => '100XXMatch', 'status' => 'confirmed']);

        $this->get('/admin/consultations/bookings?q=100%25_Match&status=confirmed')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.total', 26)
                ->where('bookings.next_page_url', function ($url): bool {
                    parse_str(parse_url($url, PHP_URL_QUERY), $query);

                    return $query['q'] === '100%_Match' && $query['status'] === 'confirmed' && $query['page'] === '2';
                }));
    }

    public function test_cancellation_summary_matches_the_backend_refund_conditions(): void
    {
        $this->mock(AvailabilityService::class)->shouldReceive('availableSlots')->andReturn([]);
        foreach ([
            ['stripe_payment_intent_id' => null, 'stripe_refund_id' => null, 'expected' => 'not_needed'],
            ['stripe_payment_intent_id' => 'pi_test_fixture', 'stripe_refund_id' => null, 'expected' => 'pending'],
            ['stripe_payment_intent_id' => 'pi_test_fixture', 'stripe_refund_id' => 're_test_fixture', 'expected' => 'refunded'],
        ] as $case) {
            $expected = $case['expected'];
            unset($case['expected']);
            $booking = $this->booking($case + ['status' => 'cancel_requested', 'amount_due_cents' => 14900, 'currency' => 'usd']);
            $this->get('/admin/consultations/bookings/'.$booking->id)->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('cancellation.refundStatus', $expected)
                    ->where('cancellation.bookingAmountCents', 14900)
                    ->where('cancellation.currency', 'usd')
                    ->missing('cancellation.stripe_payment_intent_id'));
        }
    }

    private function booking(array $attributes = []): ConsultationBooking
    {
        return ConsultationBooking::create($attributes + [
            'consultation_tier_id' => ConsultationTier::where('slug', 'light')->firstOrFail()->id,
            'client_name' => 'Default client',
            'client_email' => 'default@example.test',
            'starts_at' => now()->addDays(7),
            'ends_at' => now()->addDays(7)->addMinutes(30),
            'status' => 'pending_approval',
            'list_price_cents' => 24900,
            'amount_due_cents' => 14900,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', random_bytes(32)),
        ]);
    }
}
