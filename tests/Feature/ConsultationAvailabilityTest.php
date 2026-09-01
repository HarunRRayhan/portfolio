<?php

namespace Tests\Feature;

use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationSetting;
use App\Models\ConsultationTier;
use App\Services\Consultation\AvailabilityService;
use App\Services\Consultation\GoogleCalendarService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsultationAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_slots_respect_windows_lead_time_and_duration(): void
    {
        ConsultationSetting::setValue('schedule_timezone', 'UTC');

        foreach (range(0, 6) as $weekday) {
            ConsultationAvailabilityWindow::create([
                'weekday' => $weekday,
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
                'is_active' => true,
            ]);
        }

        // Ensure a Light tier exists (migration seeds them; RefreshDatabase replays migrations)
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();

        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('busyPeriods')->willReturn([]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $service = $this->app->make(AvailabilityService::class);

        $from = now('UTC')->addDays(3)->startOfDay();
        $to = $from->copy()->addDays(14);
        $slots = $service->availableSlots($tier, $from, $to);

        $this->assertNotEmpty($slots);

        foreach ($slots as $slot) {
            $start = Carbon::parse($slot['start'])->utc();
            $end = Carbon::parse($slot['end'])->utc();
            $this->assertTrue($start->gte(now('UTC')->addHours(48)));
            $this->assertSame(30, (int) $start->diffInMinutes($end));
        }
    }

    public function test_arbitrary_times_inside_a_window_are_not_bookable(): void
    {
        ConsultationSetting::setValue('schedule_timezone', 'UTC');

        $startsAt = now('UTC')->addDays(3)->setTime(10, 1);
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);

        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $google = $this->createMock(GoogleCalendarService::class);
        $google->method('busyPeriods')->willReturn([]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $service = $this->app->make(AvailabilityService::class);

        $this->assertFalse(
            $service->isSlotAvailable($tier, $startsAt, $startsAt->copy()->addMinutes(30)),
        );
    }

    public function test_reversed_ranges_return_no_slots(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('busyPeriods');
        $this->app->instance(GoogleCalendarService::class, $google);

        $service = $this->app->make(AvailabilityService::class);

        $from = now('UTC')->addDays(10);
        $this->assertSame([], $service->availableSlots($tier, $from, $from->copy()->subDay()));
    }

    public function test_expired_pending_holds_do_not_block_a_slot(): void
    {
        ConsultationSetting::setValue('schedule_timezone', 'UTC');

        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);
        ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Expired hold',
            'client_email' => 'expired@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->subMinute(),
            'access_token_hash' => hash('sha256', 'expired-hold'),
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())->method('busyPeriods')->willReturn([]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $this->assertTrue(
            $this->app->make(AvailabilityService::class)->isSlotAvailable(
                $tier,
                $startsAt,
                $startsAt->copy()->addMinutes($tier->duration_minutes),
            ),
        );
    }

    public function test_excluded_booking_passes_its_google_event_to_busy_period_lookup(): void
    {
        ConsultationSetting::setValue('schedule_timezone', 'UTC');

        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Calendar hold',
            'client_email' => 'calendar@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'hold_expires_at' => now('UTC')->addHour(),
            'google_event_id' => 'hold-event',
            'access_token_hash' => hash('sha256', 'calendar-hold'),
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())
            ->method('busyPeriods')
            ->with(
                $this->isInstanceOf(Carbon::class),
                $this->isInstanceOf(Carbon::class),
                'hold-event',
            )
            ->willReturn([]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $this->assertTrue(
            $this->app->make(AvailabilityService::class)->isSlotAvailable(
                $tier,
                $startsAt,
                $startsAt->copy()->addMinutes($tier->duration_minutes),
                $booking->id,
            ),
        );
    }

    public function test_excluded_paid_reschedule_passes_both_google_events_to_busy_lookup(): void
    {
        ConsultationSetting::setValue('schedule_timezone', 'UTC');

        $startsAt = now('UTC')->addDays(3)->setTime(10, 0);
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
            'is_active' => true,
        ]);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Paid reschedule calendar hold',
            'client_email' => 'paid-calendar@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'google_event_id' => 'original-event',
            'reschedule_hold_event_id' => 'reschedule-hold',
            'confirmed_at' => now('UTC')->subDay(),
            'access_token_hash' => hash('sha256', 'paid-calendar-hold'),
        ]);

        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->once())
            ->method('busyPeriods')
            ->with(
                $this->isInstanceOf(Carbon::class),
                $this->isInstanceOf(Carbon::class),
                ['original-event', 'reschedule-hold'],
            )
            ->willReturn([]);
        $this->app->instance(GoogleCalendarService::class, $google);

        $this->assertTrue(
            $this->app->make(AvailabilityService::class)->isSlotAvailable(
                $tier,
                $startsAt,
                $startsAt->copy()->addMinutes($tier->duration_minutes),
                $booking->id,
            ),
        );
    }

    public function test_availability_rejects_ranges_longer_than_the_booking_horizon(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $google = $this->createMock(GoogleCalendarService::class);
        $google->expects($this->never())->method('busyPeriods');
        $this->app->instance(GoogleCalendarService::class, $google);

        $from = now('UTC')->addDays(3);
        $this->assertSame([], $this->app->make(AvailabilityService::class)->availableSlots(
            $tier,
            $from,
            $from->copy()->addDays(29),
        ));
    }
}
