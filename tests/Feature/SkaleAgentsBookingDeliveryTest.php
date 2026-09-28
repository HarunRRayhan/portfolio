<?php

namespace Tests\Feature;

use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Services\Consultation\SkaleAgentsBookingDelivery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SkaleAgentsBookingDeliveryTest extends TestCase
{
    use RefreshDatabase;

    private function linkedBooking(): ConsultationBooking
    {
        $tier = ConsultationTier::query()->where('slug', 'pro')->firstOrFail();

        return ConsultationBooking::query()->create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Private Client',
            'client_email' => 'private@example.com',
            'notes' => 'Sensitive audit context',
            'starts_at' => now()->addDays(3),
            'ends_at' => now()->addDays(3)->addHour(),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => 24900,
            'amount_due_cents' => 24900,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'private-token'),
            'skaleagents_referral_hash' => hash('sha256', 'opaque-reference'),
        ]);
    }

    public function test_linked_event_creates_a_minimal_delivery_in_the_same_transaction(): void
    {
        config()->set('consultation.skaleagents_handoff_enabled', true);
        $booking = $this->linkedBooking();

        $event = $booking->recordEvent('requested', 'client');
        $delivery = DB::table('skaleagents_booking_deliveries')->first();
        $payload = json_decode($delivery->payload, true);
        $this->assertSame($event->id, $delivery->consultation_booking_event_id);
        $this->assertSame('portfolio-booking-'.$booking->public_id.'-event-'.$event->id, $payload['eventId']);
        $this->assertSame($booking->skaleagents_referral_hash, $payload['referralHash']);
        $this->assertSame('pending_approval', $payload['bookingStatus']);
        $this->assertNull($payload['paidAt']);
        $this->assertSame([
            'eventId', 'sequence', 'referralHash', 'bookingPublicId', 'event', 'bookingStatus',
            'occurredAt', 'packageSlug', 'amountDueCents', 'currency', 'startsAt', 'endsAt',
            'paidAt', 'refundedAt',
        ], array_keys($payload));
        foreach (['Private Client', 'private@example.com', 'Sensitive audit context', 'private-token'] as $secret) {
            $this->assertStringNotContainsString($secret, $delivery->payload);
        }

        try {
            DB::transaction(function () use ($booking): void {
                $booking->recordEvent('cancel_requested', 'client');
                throw new \RuntimeException('rollback');
            });
        } catch (\RuntimeException) {
        }
        $this->assertDatabaseCount('skaleagents_booking_deliveries', 1);
    }

    public function test_failed_delivery_retries_with_the_same_payload_and_a_new_signature_timestamp(): void
    {
        config()->set('consultation.skaleagents_handoff_enabled', true);
        config()->set('consultation.skaleagents_events_url', 'https://api.skaleagents.test/api/integrations/portfolio-bookings/events');
        config()->set('consultation.skaleagents_events_secret', 'test-handoff-secret');
        $booking = $this->linkedBooking();
        $booking->recordEvent('requested', 'client');
        $sent = [];
        Http::fake(function ($request) use (&$sent) {
            $sent[] = $request;

            return Http::response(['ok' => true], count($sent) === 1 ? 503 : 200);
        });

        $delivery = app(SkaleAgentsBookingDelivery::class);
        $this->assertSame(0, $delivery->sendDue());
        $first = DB::table('skaleagents_booking_deliveries')->first();
        $this->assertSame(1, $first->attempt_count);
        $this->assertNull($first->delivered_at);
        DB::table('skaleagents_booking_deliveries')->update(['next_attempt_at' => now()->subSecond()]);
        $this->assertSame(1, $delivery->sendDue());
        $this->assertSame($sent[0]->body(), $sent[1]->body());
        foreach ($sent as $request) {
            $timestamp = $request->header('X-Portfolio-Timestamp')[0];
            $expected = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$request->body(), 'test-handoff-secret');
            $this->assertSame($expected, $request->header('X-Portfolio-Signature')[0]);
        }
        $this->assertNotNull(DB::table('skaleagents_booking_deliveries')->value('delivered_at'));
    }

    public function test_removed_referrals_are_terminal_and_disabled_handoff_does_not_send(): void
    {
        config()->set('consultation.skaleagents_handoff_enabled', true);
        config()->set('consultation.skaleagents_events_url', 'https://api.skaleagents.test/api/integrations/portfolio-bookings/events');
        config()->set('consultation.skaleagents_events_secret', 'test-handoff-secret');
        $booking = $this->linkedBooking();
        $booking->recordEvent('requested', 'client');
        Http::fake(['*' => Http::response(['error' => 'Referral unavailable'], 410)]);

        $this->assertSame(0, app(SkaleAgentsBookingDelivery::class)->sendDue());
        $this->assertNotNull(DB::table('skaleagents_booking_deliveries')->value('terminal_at'));

        config()->set('consultation.skaleagents_handoff_enabled', false);
        $booking->recordEvent('confirmed', 'system');
        $this->assertDatabaseCount('skaleagents_booking_deliveries', 1);
        Http::assertSentCount(1);
    }

    public function test_payment_fields_come_only_from_stripe_timestamps(): void
    {
        config()->set('consultation.skaleagents_handoff_enabled', true);
        $booking = $this->linkedBooking();
        $booking->status = ConsultationBooking::STATUS_CONFIRMED;
        $booking->save();
        $booking->recordEvent('confirmed', 'system');
        $first = json_decode(DB::table('skaleagents_booking_deliveries')->orderBy('id')->value('payload'), true);
        $this->assertNull($first['paidAt']);

        $booking->stripe_paid_at = now('UTC');
        $booking->save();
        $booking->recordEvent('confirmed', 'system');
        $second = json_decode(DB::table('skaleagents_booking_deliveries')->orderByDesc('id')->value('payload'), true);
        $this->assertNotNull($second['paidAt']);
        $this->assertNull($second['refundedAt']);

        $booking->stripe_refunded_at = now('UTC');
        $booking->save();
        $booking->recordEvent('cancel_approved', 'admin');
        $third = json_decode(DB::table('skaleagents_booking_deliveries')->orderByDesc('id')->value('payload'), true);
        $this->assertNotNull($third['refundedAt']);
    }

    public function test_a_later_event_waits_for_an_earlier_failed_delivery(): void
    {
        config()->set('consultation.skaleagents_handoff_enabled', true);
        config()->set('consultation.skaleagents_events_url', 'https://api.skaleagents.test/api/integrations/portfolio-bookings/events');
        config()->set('consultation.skaleagents_events_secret', 'test-handoff-secret');
        $booking = $this->linkedBooking();
        $booking->recordEvent('requested', 'client');
        $booking->status = ConsultationBooking::STATUS_AWAITING_PAYMENT;
        $booking->save();
        $booking->recordEvent('approved_awaiting_payment', 'admin');
        Http::fake(['*' => Http::response(['error' => 'Unavailable'], 503)]);

        $this->assertSame(0, app(SkaleAgentsBookingDelivery::class)->sendDue());
        Http::assertSentCount(1);
        $this->assertSame(0, app(SkaleAgentsBookingDelivery::class)->sendDue());
        Http::assertSentCount(1);
    }
}
