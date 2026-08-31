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
        $from = ($from ?? now('UTC'))->copy()->utc();
        $to = ($to ?? now('UTC')->addDays(28))->copy()->utc();

        $minStart = now('UTC')->addHours((int) config('consultation.min_lead_hours', 48));
        if ($from->lt($minStart)) {
            $from = $minStart->copy();
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

                    $slots[] = [
                        'start' => $slotStart->toIso8601String(),
                        'end' => $slotEnd->toIso8601String(),
                    ];
                }
            }

            $day->addDay();
        }

        return $slots;
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

        foreach ($windows as $window) {
            $windowStart = Carbon::parse(
                $localStart->toDateString().' '.$this->normalizeTime($window->start_time),
                $timezone
            );
            $windowEnd = Carbon::parse(
                $localStart->toDateString().' '.$this->normalizeTime($window->end_time),
                $timezone
            );

            if ($localStart->gte($windowStart) && $localEnd->lte($windowEnd)) {
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
        $busy = $this->google->busyPeriods($from, $to);

        $holdingStatuses = [
            ConsultationBooking::STATUS_PENDING_APPROVAL,
            ConsultationBooking::STATUS_AWAITING_PAYMENT,
            ConsultationBooking::STATUS_RESCHEDULE_PROPOSED,
            ConsultationBooking::STATUS_CANCEL_REQUESTED,
            ConsultationBooking::STATUS_RESCHEDULE_REQUESTED,
            ConsultationBooking::STATUS_CONFIRMED,
        ];

        $query = ConsultationBooking::query()
            ->whereIn('status', $holdingStatuses)
            ->where('starts_at', '<', $to)
            ->where('ends_at', '>', $from);

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        foreach ($query->get(['starts_at', 'ends_at']) as $booking) {
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
