<?php

namespace Tests\Feature;

use App\Exceptions\ConsultationGoogleException;
use App\Services\Consultation\GoogleCalendarService;
use Carbon\Carbon;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\Resource\Events;
use Google\Service\Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsultationGoogleCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_events_use_a_stable_google_event_id(): void
    {
        $stableEventId = 'consultation'.substr(hash('sha256', 'hold-key'), 0, 48);
        $events = $this->createMock(Events::class);
        $events->expects($this->once())
            ->method('insert')
            ->with(
                'primary',
                $this->callback(fn (Event $event): bool => $event->getId() === $stableEventId),
                [],
            )
            ->willReturn(new Event(['id' => $stableEventId]));

        $service = $this->serviceWithEvents($events);

        $result = $service->createHoldEvent(
            'Consultation hold',
            Carbon::now('UTC')->addDays(3),
            Carbon::now('UTC')->addDays(3)->addMinutes(30),
            'Pending request',
            'hold-key',
        );

        $this->assertSame($stableEventId, $result);
    }

    public function test_event_deletion_fails_closed_when_calendar_is_disconnected(): void
    {
        $this->expectException(ConsultationGoogleException::class);
        $this->expectExceptionMessage('disconnected');

        app(GoogleCalendarService::class)->deleteEvent('orphaned-event');
    }

    public function test_a_google_event_conflict_is_resolved_by_fetching_the_stable_event(): void
    {
        $stableEventId = 'consultation'.substr(hash('sha256', 'retry-key'), 0, 48);
        $start = Carbon::now('UTC')->addDays(3);
        $end = $start->copy()->addMinutes(30);
        $events = $this->createMock(Events::class);
        $events->expects($this->once())
            ->method('insert')
            ->willThrowException(new Exception('event already exists', 409));
        $events->expects($this->once())
            ->method('get')
            ->with('primary', $stableEventId)
            ->willReturn(new Event([
                'id' => $stableEventId,
                'summary' => 'Consultation hold',
                'start' => ['dateTime' => $start->toRfc3339String()],
                'end' => ['dateTime' => $end->toRfc3339String()],
            ]));

        $service = $this->serviceWithEvents($events);

        $result = $service->createHoldEvent(
            'Consultation hold',
            $start,
            $end,
            'Pending request',
            'retry-key',
        );

        $this->assertSame($stableEventId, $result);
    }

    public function test_confirmed_event_lookup_failures_use_the_retryable_google_exception(): void
    {
        $events = $this->createMock(Events::class);
        $events->expects($this->once())
            ->method('insert')
            ->willReturn(new Event(['id' => 'confirmed-event']));
        $events->expects($this->once())
            ->method('get')
            ->willThrowException(new Exception('temporary calendar failure', 503));

        $service = $this->serviceWithEvents($events);

        $this->expectException(ConsultationGoogleException::class);
        $service->createConfirmedEvent(
            'Confirmed consultation',
            Carbon::now('UTC')->addDays(3),
            Carbon::now('UTC')->addDays(3)->addMinutes(30),
            'Details',
            'client@example.com',
        );
    }

    private function serviceWithEvents(Events $events): GoogleCalendarService
    {
        $calendar = $this->createStub(Calendar::class);
        $calendar->events = $events;

        return new class($calendar) extends GoogleCalendarService
        {
            public function __construct(private Calendar $fakeCalendar) {}

            public function calendar(): ?Calendar
            {
                return $this->fakeCalendar;
            }
        };
    }
}
