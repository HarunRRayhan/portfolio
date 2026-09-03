<?php

namespace App\Services\Consultation;

use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationSetting;
use App\Models\ConsultationTier;
use Carbon\Carbon;

class AvailabilityService
{
    public function __construct(
        protected GoogleCalendarService $google,
    ) {}

    /**
     * @return list<array{start: string, end: string}>
     */
    public function availableSlots(ConsultationTier $tier, ?Carbon $from = null, ?Carbon $to = null, ?int $excludeBookingId = null): array
    {
        $now = now('UTC');
        $horizonDays = max(1, (int) config('consultation.availability_horizon_days', 28));
        $from = ($from ?? $now)->copy()->utc();
        $to = ($to ?? $now->copy()->addDays($horizonDays))->copy()->utc();

        if ($to->lte($from)) {
            return [];
        }

        $horizonEnd = $now->copy()->addDays($horizonDays);
        if ($to->gt($from->copy()->addDays($horizonDays)) || $to->gt($horizonEnd)) {
            return [];
        }

        $minStart = $now->copy()->addHours((int) config('consultation.min_lead_hours', 48));
        if ($from->lt($minStart)) {
            $from = $minStart->copy();
        }

        if ($to->lte($from)) {
            return [];
        }

        $duration = (int) $tier->duration_minutes;
        $buffer = (int) config('consultation.buffer_minutes', 15);
        $interval = (int) config('consultation.slot_interval_minutes', 15);
        $timezone = ConsultationSetting::scheduleTimezone();

        $windows = ConsultationAvailabilityWindow::query()->active()->get();

        if ($windows->isEmpty()) {
            return [];
        }

        $busy = $this->collectBusyPeriods($from->copy()->subMinutes($buffer), $to->copy()->addMinutes($buffer), $excludeBookingId);
        $slots = [];

        $day = $from->copy()->timezone($timezone)->startOfDay();
        $endDay = $to->copy()->timezone($timezone)->startOfDay();

        while ($day->lte($endDay)) {
            $weekday = (int) $day->dayOfWeek;
            $dayWindows = $windows->where('weekday', $weekday);

            foreach ($dayWindows as $window) {
                $windowStart = Carbon::parse(
                    $day->toDateString().' '.$this->normalizeTime($window->start_time),
                    $timezone
                )->utc();
                $windowEnd = Carbon::parse(
                    $day->toDateString().' '.$this->normalizeTime($window->end_time),
                    $timezone
                )->utc();

                if ($windowEnd->lte($windowStart)) {
                    continue;
                }

                for ($cursor = $windowStart->copy(); $cursor->copy()->addMinutes($duration)->lte($windowEnd); $cursor->addMinutes($interval)) {
                    $slotStart = $cursor->copy();
                    $slotEnd = $cursor->copy()->addMinutes($duration);

                    if ($slotStart->lt($from) || $slotEnd->gt($to)) {
                        continue;
                    }

                    if ($this->overlapsBusy($slotStart, $slotEnd, $busy, $buffer)) {
                        continue;
                    }

                    $slots[$slotStart->toIso8601String()] = [
                        'start' => $slotStart->toIso8601String(),
                        'end' => $slotEnd->toIso8601String(),
                    ];
                }
            }

            $day->addDay();
        }

        return array_values($slots);
    }

    public function isSlotAvailable(
        ConsultationTier $tier,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $excludeBookingId = null,
    ): bool {
        $startsAt = $startsAt->copy()->utc();
        $endsAt = $endsAt->copy()->utc();

        $minStart = now('UTC')->addHours((int) config('consultation.min_lead_hours', 48));
        if ($startsAt->lt($minStart)) {
            return false;
        }

        if ($endsAt->lte($startsAt)) {
            return false;
        }

        if ($endsAt->gt(now('UTC')->addDays(max(1, (int) config('consultation.availability_horizon_days', 28))))) {
            return false;
        }

        $expectedEnd = $startsAt->copy()->addMinutes((int) $tier->duration_minutes);
        if (! $endsAt->equalTo($expectedEnd)) {
            // Allow small drift of 1 second from ISO parsing
            if (abs($endsAt->diffInSeconds($expectedEnd)) > 1) {
                return false;
            }
        }

        if (! $this->withinAvailabilityWindow($startsAt, $endsAt)) {
            return false;
        }

        $buffer = (int) config('consultation.buffer_minutes', 15);
        $busy = $this->collectBusyPeriods(
            $startsAt->copy()->subMinutes($buffer),
            $endsAt->copy()->addMinutes($buffer),
            $excludeBookingId,
        );

        return ! $this->overlapsBusy($startsAt, $endsAt, $busy, $buffer);
    }

    protected function withinAvailabilityWindow(Carbon $startsAt, Carbon $endsAt): bool
    {
        $timezone = ConsultationSetting::scheduleTimezone();
        $localStart = $startsAt->copy()->timezone($timezone);
        $localEnd = $endsAt->copy()->timezone($timezone);

        if ($localStart->toDateString() !== $localEnd->toDateString()) {
            return false;
        }

        $windows = ConsultationAvailabilityWindow::query()
            ->active()
            ->where('weekday', (int) $localStart->dayOfWeek)
            ->get();
        $intervalSeconds = max(1, (int) config('consultation.slot_interval_minutes', 15) * 60);

        foreach ($windows as $window) {
            $windowStart = Carbon::parse(
                $localStart->toDateString().' '.$this->normalizeTime($window->start_time),
                $timezone
            );
            $windowEnd = Carbon::parse(
                $localStart->toDateString().' '.$this->normalizeTime($window->end_time),
                $timezone
            );

            if (
                $localStart->gte($windowStart)
                && $localEnd->lte($windowEnd)
                && $windowStart->diffInSeconds($localStart) % $intervalSeconds === 0
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<array{start: Carbon, end: Carbon}>
     */
    protected function collectBusyPeriods(Carbon $from, Carbon $to, ?int $excludeBookingId): array
    {
        $excludedGoogleEventIds = $excludeBookingId
            ? ConsultationBooking::query()
                ->whereKey($excludeBookingId)
                ->get(['google_event_id', 'reschedule_hold_event_id'])
                ->flatMap(fn (ConsultationBooking $booking) => [
                    $booking->google_event_id,
                    $booking->reschedule_hold_event_id,
                ])
                ->filter()
                ->values()
                ->all()
            : [];
        $excludedGoogleEventId = count($excludedGoogleEventIds) === 1
            ? $excludedGoogleEventIds[0]
            : $excludedGoogleEventIds;

        $query = ConsultationBooking::query()
            ->where(function ($query) {
                $query->where('status', ConsultationBooking::STATUS_CONFIRMED)
                    ->orWhere('status', ConsultationBooking::STATUS_CANCEL_REQUESTED)
                    ->orWhere('status', ConsultationBooking::STATUS_RESCHEDULE_REQUESTED)
                    ->orWhere(function ($query) {
                        $query->whereIn('status', [
                            ConsultationBooking::STATUS_PENDING_APPROVAL,
                            ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
                            ConsultationBooking::STATUS_PAID_RESCHEDULE_PENDING_APPROVAL,
                        ])->where(function ($query) {
                            $query->whereNull('hold_expires_at')
                                ->orWhere('hold_expires_at', '>', now('UTC'));
                        });
                    })
                    ->orWhere(function ($query) {
                        $query->where('status', ConsultationBooking::STATUS_AWAITING_PAYMENT)
                            ->where(function ($query) {
                                $query->whereNull('payment_due_at')
                                    ->orWhere('payment_due_at', '>', now('UTC'));
                            });
                    });
            })
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from);

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        $bookings = $query->get(['id', 'starts_at', 'ends_at', 'google_event_id']);
        $busy = $excludedGoogleEventIds
            ? $this->google->busyPeriods($from, $to, $excludedGoogleEventId)
            : $this->google->busyPeriods($from, $to);

        foreach ($bookings as $booking) {
            $busy[] = [
                'start' => $booking->starts_at->copy()->utc(),
                'end' => $booking->ends_at->copy()->utc(),
            ];
        }

        return $busy;
    }

    /**
     * @param  list<array{start: Carbon, end: Carbon}>  $busy
     */
    protected function overlapsBusy(Carbon $slotStart, Carbon $slotEnd, array $busy, int $bufferMinutes): bool
    {
        $bufferedStart = $slotStart->copy()->subMinutes($bufferMinutes);
        $bufferedEnd = $slotEnd->copy()->addMinutes($bufferMinutes);

        foreach ($busy as $block) {
            if ($bufferedStart->lt($block['end']) && $bufferedEnd->gt($block['start'])) {
                return true;
            }
        }

        return false;
    }

    protected function normalizeTime(mixed $time): string
    {
        if ($time instanceof \DateTimeInterface) {
            return Carbon::instance(\DateTimeImmutable::createFromInterface($time))->format('H:i:s');
        }

        $str = (string) $time;

        if (preg_match('/^\d{2}:\d{2}$/', $str)) {
            return $str.':00';
        }

        return $str;
    }
}
