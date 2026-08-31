<?php

namespace Tests\Feature;

use App\Models\ConsultationAvailabilityWindow;
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
}
