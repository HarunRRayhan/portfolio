<?php

namespace App\Services\Consultation;

use App\Mail\Consultation\BookingAwaitingPaymentMail;
use App\Mail\Consultation\BookingCancellationDeniedMail;
use App\Mail\Consultation\BookingCancelledMail;
use App\Mail\Consultation\BookingConfirmedMail;
use App\Mail\Consultation\BookingDeclinedMail;
use App\Mail\Consultation\BookingExpiredMail;
use App\Mail\Consultation\BookingPendingAdminMail;
use App\Mail\Consultation\BookingPendingClientMail;
use App\Mail\Consultation\BookingRescheduleDeniedMail;
use App\Mail\Consultation\BookingRescheduleProposedMail;
use App\Mail\Consultation\StripeWebhookUnmatchedMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationNotification;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ConsultationNotificationService
{
    public const TYPE_PENDING_ADMIN = 'pending_admin';

    public const TYPE_PENDING_CLIENT = 'pending_client';

    public const TYPE_AWAITING_PAYMENT = 'awaiting_payment';

    public const TYPE_DECLINED = 'declined';

    public const TYPE_RESCHEDULE_DENIED = 'reschedule_denied';

    public const TYPE_RESCHEDULE_PROPOSED = 'reschedule_proposed';

    public const TYPE_CONFIRMED = 'confirmed';

    public const TYPE_CANCELLED = 'cancelled';

    public const TYPE_CANCELLATION_DENIED = 'cancellation_denied';

    public const TYPE_EXPIRED = 'expired';

    public const TYPE_STRIPE_WEBHOOK_UNMATCHED = 'stripe_webhook_unmatched';

    public function enqueue(
        ?ConsultationBooking $booking,
        string $recipient,
        string $mailType,
        array $payload,
        string $deduplicationKey,
    ): ConsultationNotification {
        $now = now('UTC');
        DB::table('consultation_notifications')->insertOrIgnore([
            'consultation_booking_id' => $booking?->id,
            'deduplication_key' => $deduplicationKey,
            'recipient' => $recipient,
            'mail_type' => $mailType,
            'payload' => Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR)),
            'status' => ConsultationNotification::STATUS_PENDING,
            'available_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return ConsultationNotification::query()
            ->where('deduplication_key', $deduplicationKey)
            ->firstOrFail();
    }

    public function supersedePaymentNotifications(int $bookingId): int
    {
        return ConsultationNotification::query()
            ->where('consultation_booking_id', $bookingId)
            ->where('mail_type', self::TYPE_AWAITING_PAYMENT)
            ->whereIn('status', [
                ConsultationNotification::STATUS_PENDING,
                ConsultationNotification::STATUS_PROCESSING,
                ConsultationNotification::STATUS_FAILED,
            ])
            ->update([
                'status' => ConsultationNotification::STATUS_SUPERSEDED,
                'last_error' => 'The Stripe checkout was superseded.',
                'available_at' => null,
                'updated_at' => now('UTC'),
            ]);
    }

    public function deliverDueForBooking(int $bookingId): int
    {
        $notifications = ConsultationNotification::query()
            ->where('consultation_booking_id', $bookingId)
            ->where(function ($query) {
                $query->where(function ($query) {
                    $query->whereIn('status', [
                        ConsultationNotification::STATUS_PENDING,
                        ConsultationNotification::STATUS_FAILED,
                    ])->where(function ($query) {
                        $query->whereNull('available_at')->orWhere('available_at', '<=', now('UTC'));
                    });
                })->orWhere(function ($query) {
                    $query->where('status', ConsultationNotification::STATUS_PROCESSING)
                        ->where('updated_at', '<=', now('UTC')->subMinutes((int) config('consultation.notification_processing_timeout_minutes', 10)));
                });
            })
            ->orderBy('id')
            ->limit(25)
            ->get();

        $sent = 0;
        foreach ($notifications as $notification) {
            $sent += $this->deliver($notification) ? 1 : 0;
        }

        return $sent;
    }

    public function deliverDue(int $limit = 100): int
    {
        $notifications = ConsultationNotification::query()
            ->where(function ($query) {
                $query->where(function ($query) {
                    $query->whereIn('status', [
                        ConsultationNotification::STATUS_PENDING,
                        ConsultationNotification::STATUS_FAILED,
                    ])->where(function ($query) {
                        $query->whereNull('available_at')->orWhere('available_at', '<=', now('UTC'));
                    });
                })->orWhere(function ($query) {
                    $query->where('status', ConsultationNotification::STATUS_PROCESSING)
                        ->where('updated_at', '<=', now('UTC')->subMinutes((int) config('consultation.notification_processing_timeout_minutes', 10)));
                });
            })
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $sent = 0;
        foreach ($notifications as $notification) {
            $sent += $this->deliver($notification) ? 1 : 0;
        }

        return $sent;
    }

    public function deliver(ConsultationNotification|int $notification): bool
    {
        $notificationId = $notification instanceof ConsultationNotification
            ? $notification->id
            : $notification;

        $claimed = DB::transaction(function () use ($notificationId): ?ConsultationNotification {
            $initial = ConsultationNotification::query()->find($notificationId);

            if (! $initial) {
                return null;
            }

            $booking = null;
            if ($initial->mail_type === self::TYPE_AWAITING_PAYMENT && $initial->consultation_booking_id) {
                $booking = ConsultationBooking::query()
                    ->with('tier')
                    ->lockForUpdate()
                    ->find($initial->consultation_booking_id);
            }

            $current = ConsultationNotification::query()->lockForUpdate()->find($notificationId);

            if (
                ! $current
                || ! in_array($current->status, [
                    ConsultationNotification::STATUS_PENDING,
                    ConsultationNotification::STATUS_PROCESSING,
                    ConsultationNotification::STATUS_FAILED,
                ], true)
            ) {
                return null;
            }

            $now = now('UTC');
            if (
                $current->status === ConsultationNotification::STATUS_PROCESSING
                && $current->updated_at?->gt($now->copy()->subMinutes((int) config('consultation.notification_processing_timeout_minutes', 10)))
            ) {
                return null;
            }

            if (
                $current->mail_type === self::TYPE_AWAITING_PAYMENT
                && ! $this->isCurrentPaymentNotification($current, $booking)
            ) {
                $this->markSuperseded($current);

                return null;
            }

            if ($current->available_at && $current->available_at->isFuture()) {
                return null;
            }

            $current->forceFill([
                'status' => ConsultationNotification::STATUS_PROCESSING,
                'attempts' => $current->attempts + 1,
                'last_error' => null,
            ])->save();

            return $current->fresh();
        });

        if (! $claimed) {
            return false;
        }

        $sent = DB::transaction(function () use ($claimed): bool {
            if ($claimed->consultation_booking_id) {
                $booking = ConsultationBooking::query()
                    ->with('tier')
                    ->lockForUpdate()
                    ->find($claimed->consultation_booking_id);
            } else {
                $booking = null;
            }

            $current = ConsultationNotification::query()
                ->lockForUpdate()
                ->find($claimed->id);

            if (! $current || $current->status !== ConsultationNotification::STATUS_PROCESSING) {
                return false;
            }

            if (
                $current->mail_type === self::TYPE_AWAITING_PAYMENT
                && ! $this->isCurrentPaymentNotification($current, $booking)
            ) {
                $current->forceFill([
                    'status' => ConsultationNotification::STATUS_SUPERSEDED,
                    'last_error' => 'The Stripe checkout was superseded.',
                    'available_at' => null,
                ])->save();

                return false;
            }

            // Keep the booking lock until the provider accepts the message.
            // Booking transitions use the same lock, so an invalidating state
            // change cannot commit while this mail is being sent.
            try {
                Mail::to($current->recipient)->send($this->mailable($current, $booking));
            } catch (\Throwable $e) {
                $this->markFailed($current, $e);

                Log::error('Consultation notification delivery failed', [
                    'notification' => $current->id,
                    'type' => $current->mail_type,
                    'booking' => $current->consultation_booking_id,
                    'error' => $e->getMessage(),
                ]);

                return false;
            }

            $current->forceFill([
                'status' => ConsultationNotification::STATUS_SENT,
                'last_error' => null,
                'sent_at' => now('UTC'),
                'available_at' => null,
            ])->save();

            $this->activateAccessToken($current, $booking);

            return true;
        });

        return $sent;
    }

    protected function isCurrentPaymentNotification(
        ConsultationNotification $notification,
        ?ConsultationBooking $booking = null,
    ): bool {
        $booking ??= $notification->booking()->first();
        $payload = $notification->payload ?? [];
        $sessionId = $payload['stripe_checkout_session_id'] ?? null;
        $idempotencyKey = $payload['stripe_checkout_idempotency_key'] ?? null;

        return $booking !== null
            && $booking->status === ConsultationBooking::STATUS_AWAITING_PAYMENT
            && is_string($sessionId)
            && $sessionId !== ''
            && $booking->stripe_checkout_session_id === $sessionId
            && (! is_string($idempotencyKey) || $booking->stripe_checkout_idempotency_key === $idempotencyKey);
    }

    protected function markSuperseded(ConsultationNotification $notification): void
    {
        ConsultationNotification::query()
            ->whereKey($notification->id)
            ->whereIn('status', [
                ConsultationNotification::STATUS_PENDING,
                ConsultationNotification::STATUS_PROCESSING,
                ConsultationNotification::STATUS_FAILED,
            ])
            ->where('attempts', $notification->attempts)
            ->update([
                'status' => ConsultationNotification::STATUS_SUPERSEDED,
                'last_error' => 'The Stripe checkout was superseded.',
                'available_at' => null,
                'updated_at' => now('UTC'),
            ]);
    }

    protected function markFailed(ConsultationNotification $notification, \Throwable $exception): void
    {
        $delay = min(
            60 * 24,
            max(5, 2 ** min($notification->attempts, 8)),
        );

        ConsultationNotification::query()
            ->whereKey($notification->id)
            ->where('status', ConsultationNotification::STATUS_PROCESSING)
            ->where('attempts', $notification->attempts)
            ->update([
                'status' => ConsultationNotification::STATUS_FAILED,
                'last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'available_at' => now('UTC')->addMinutes($delay),
                'updated_at' => now('UTC'),
            ]);
    }

    protected function activateAccessToken(
        ConsultationNotification $notification,
        ?ConsultationBooking $booking = null,
    ): void {
        $payload = $notification->payload ?? [];
        $tokenHash = $payload['activate_access_token_hash'] ?? null;

        if (! is_string($tokenHash) || $tokenHash === '' || ! $notification->consultation_booking_id) {
            return;
        }

        $booking ??= ConsultationBooking::query()
            ->lockForUpdate()
            ->find($notification->consultation_booking_id);

        if (! $booking) {
            return;
        }

        if ($notification->mail_type === self::TYPE_AWAITING_PAYMENT) {
            $sessionId = $payload['stripe_checkout_session_id'] ?? null;
            $idempotencyKey = $payload['stripe_checkout_idempotency_key'] ?? null;

            if (
                ! is_string($sessionId)
                || $sessionId === ''
                || ! in_array($booking->status, [
                    ConsultationBooking::STATUS_AWAITING_PAYMENT,
                    ConsultationBooking::STATUS_CONFIRMED,
                ], true)
                || $booking->stripe_checkout_session_id !== $sessionId
                || (is_string($idempotencyKey) && $booking->stripe_checkout_idempotency_key !== $idempotencyKey)
            ) {
                return;
            }

            $booking->access_token_hash = $tokenHash;
            $booking->access_token_expires_at = $payload['activate_access_token_expires_at'] ?? $booking->access_token_expires_at;
            $booking->save();

            return;
        }

        if ($notification->mail_type !== self::TYPE_RESCHEDULE_PROPOSED) {
            return;
        }

        if ($booking->status !== ConsultationBooking::STATUS_RESCHEDULE_PROPOSED) {
            return;
        }

        $proposalEventId = $payload['proposal_event_id'] ?? null;

        if ($proposalEventId === null) {
            $pattern = '/^consultation-booking-'.preg_quote((string) $notification->consultation_booking_id, '/').'-event-(\d+)-reschedule-proposed$/';
            if (preg_match($pattern, $notification->deduplication_key, $matches) === 1) {
                $proposalEventId = (int) $matches[1];
            }
        }

        if ($proposalEventId === null) {
            $proposalEventId = $this->legacyProposalEventId($notification, $booking);
        }

        $latestProposalEventId = $booking->events()
            ->where('event', 'reschedule_proposed')
            ->latest('id')
            ->value('id');

        if (
            ($proposalEventId !== null && ! is_numeric($proposalEventId))
            || ($proposalEventId !== null && (int) $latestProposalEventId !== (int) $proposalEventId)
            || ($proposalEventId === null && $latestProposalEventId !== null)
        ) {
            return;
        }

        $booking->access_token_hash = $tokenHash;
        $booking->access_token_expires_at = $payload['activate_access_token_expires_at'] ?? $booking->access_token_expires_at;
        $booking->save();
    }

    protected function legacyProposalEventId(
        ConsultationNotification $notification,
        ConsultationBooking $booking,
    ): ?int {
        $eventKeyPattern = '/^consultation-booking-'.preg_quote((string) $booking->id, '/').'-event-(\d+)-reschedule-proposed$/';
        if (preg_match($eventKeyPattern, $notification->deduplication_key, $matches) === 1) {
            return (int) $matches[1];
        }

        if ($notification->deduplication_key !== 'consultation-booking-'.$booking->id.'-reschedule-proposed') {
            return null;
        }

        $events = $booking->events()
            ->where('event', 'reschedule_proposed')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'created_at'])
            ->values();

        if ($events->count() === 1) {
            return (int) $events->first()->id;
        }

        if (! $notification->created_at || $events->isEmpty()) {
            return null;
        }

        $precedingEvents = $events->filter(function ($event) use ($notification): bool {
            return $event->created_at && $event->created_at->lte($notification->created_at);
        });

        if ($precedingEvents->isEmpty()) {
            return null;
        }

        $latestPrecedingEvent = $precedingEvents->last();
        $candidates = $precedingEvents->filter(function ($event) use ($latestPrecedingEvent): bool {
            return $event->created_at->equalTo($latestPrecedingEvent->created_at);
        });

        return $candidates->count() === 1
            ? (int) $candidates->first()->id
            : null;
    }

    protected function mailable(
        ConsultationNotification $notification,
        ?ConsultationBooking $booking = null,
    ): object {
        $payload = $notification->payload ?? [];
        $booking ??= $notification->consultation_booking_id
            ? ConsultationBooking::query()->with('tier')->findOrFail($notification->consultation_booking_id)
            : null;

        return match ($notification->mail_type) {
            self::TYPE_PENDING_ADMIN => new BookingPendingAdminMail($booking),
            self::TYPE_PENDING_CLIENT => new BookingPendingClientMail($booking, $payload['plain_token'] ?? null),
            self::TYPE_AWAITING_PAYMENT => new BookingAwaitingPaymentMail(
                $booking,
                $payload['plain_token'] ?? null,
                $payload['checkout_url'] ?? null,
            ),
            self::TYPE_DECLINED => new BookingDeclinedMail($booking),
            self::TYPE_RESCHEDULE_DENIED => new BookingRescheduleDeniedMail($booking),
            self::TYPE_RESCHEDULE_PROPOSED => new BookingRescheduleProposedMail($booking, $payload['plain_token'] ?? null),
            self::TYPE_CONFIRMED => new BookingConfirmedMail($booking),
            self::TYPE_CANCELLED => new BookingCancelledMail($booking),
            self::TYPE_CANCELLATION_DENIED => new BookingCancellationDeniedMail($booking),
            self::TYPE_EXPIRED => new BookingExpiredMail($booking),
            self::TYPE_STRIPE_WEBHOOK_UNMATCHED => new StripeWebhookUnmatchedMail(
                (string) ($payload['event_id'] ?? ''),
                (string) ($payload['event_type'] ?? ''),
                (string) ($payload['reason'] ?? ''),
                isset($payload['session_id']) ? (string) $payload['session_id'] : null,
                isset($payload['booking_public_id']) ? (string) $payload['booking_public_id'] : null,
            ),
            default => throw new \UnexpectedValueException('Unknown consultation notification type.'),
        };
    }
}
