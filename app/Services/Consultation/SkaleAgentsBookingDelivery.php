<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use App\Models\ConsultationBookingEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SkaleAgentsBookingDelivery
{
    public function enqueue(ConsultationBooking $booking, ConsultationBookingEvent $event): void
    {
        $booking->loadMissing('tier');
        $payload = [
            'eventId' => 'portfolio-booking-'.$booking->public_id.'-event-'.$event->id,
            'sequence' => $event->id,
            'referralHash' => $booking->skaleagents_referral_hash,
            'bookingPublicId' => $booking->public_id,
            'event' => $event->event,
            'bookingStatus' => $booking->status,
            'occurredAt' => $event->created_at->copy()->utc()->toIso8601String(),
            'packageSlug' => $booking->tier->slug,
            'amountDueCents' => (int) $booking->amount_due_cents,
            'currency' => strtoupper($booking->currency),
            'startsAt' => $booking->starts_at->copy()->utc()->toIso8601String(),
            'endsAt' => $booking->ends_at->copy()->utc()->toIso8601String(),
            'paidAt' => $booking->stripe_paid_at?->copy()->utc()->toIso8601String(),
            'refundedAt' => $booking->stripe_refunded_at?->copy()->utc()->toIso8601String(),
        ];

        DB::table('skaleagents_booking_deliveries')->insertOrIgnore([
            'consultation_booking_id' => $booking->id,
            'consultation_booking_event_id' => $event->id,
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            'created_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);
    }

    public function sendDue(int $limit = 100): int
    {
        if (! config('consultation.skaleagents_handoff_enabled')) {
            return 0;
        }
        $url = config('consultation.skaleagents_events_url');
        $secret = config('consultation.skaleagents_events_secret');
        if (! is_string($url) || ! str_starts_with($url, 'https://') || ! is_string($secret) || $secret === '') {
            return 0;
        }

        $rows = DB::table('skaleagents_booking_deliveries as delivery')
            ->whereNull('delivery.delivered_at')
            ->whereNull('delivery.terminal_at')
            ->where(function ($query): void {
                $query->whereNull('delivery.next_attempt_at')
                    ->orWhere('delivery.next_attempt_at', '<=', now('UTC'));
            })
            ->whereNotExists(function ($query): void {
                $query->selectRaw('1')
                    ->from('skaleagents_booking_deliveries as earlier')
                    ->whereColumn('earlier.consultation_booking_id', 'delivery.consultation_booking_id')
                    ->whereColumn('earlier.consultation_booking_event_id', '<', 'delivery.consultation_booking_event_id')
                    ->whereNull('earlier.delivered_at')
                    ->whereNull('earlier.terminal_at');
            })
            ->orderBy('delivery.consultation_booking_event_id')
            ->limit(max(1, $limit))
            ->get(['delivery.*']);

        $delivered = 0;
        foreach ($rows as $row) {
            $timestamp = (string) now('UTC')->timestamp;
            $signature = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$row->payload, $secret);
            $status = null;
            try {
                $response = Http::withHeaders([
                    'X-Portfolio-Timestamp' => $timestamp,
                    'X-Portfolio-Signature' => $signature,
                ])->timeout(10)->withBody($row->payload, 'application/json')->post($url);
                $status = $response->status();
            } catch (\Throwable) {
                // A transport failure stays retryable in the outbox.
            }

            $attempts = $row->attempt_count + 1;
            $changes = [
                'attempt_count' => $attempts,
                'last_http_status' => $status,
                'updated_at' => now('UTC'),
            ];
            if ($status !== null && $status >= 200 && $status < 300) {
                $changes['delivered_at'] = now('UTC');
                $changes['next_attempt_at'] = null;
                $changes['last_error'] = null;
                $delivered++;
            } elseif (in_array($status, [404, 410], true)) {
                $changes['terminal_at'] = now('UTC');
                $changes['next_attempt_at'] = null;
                $changes['last_error'] = 'Referral unavailable';
            } else {
                $changes['next_attempt_at'] = now('UTC')->addSeconds(min(3600, 60 * (2 ** min($attempts - 1, 6))));
                $changes['last_error'] = $status === null ? 'Transport failure' : 'HTTP '.$status;
            }

            DB::table('skaleagents_booking_deliveries')->where('id', $row->id)->update($changes);
        }

        return $delivered;
    }

    /** @return array{pending: int, retrying: int, terminal: int} */
    public function counts(): array
    {
        $query = DB::table('skaleagents_booking_deliveries');

        return [
            'pending' => (clone $query)->whereNull('delivered_at')->whereNull('terminal_at')->count(),
            'retrying' => (clone $query)->where('attempt_count', '>', 0)->whereNull('delivered_at')->whereNull('terminal_at')->count(),
            'terminal' => (clone $query)->whereNotNull('terminal_at')->count(),
        ];
    }
}
