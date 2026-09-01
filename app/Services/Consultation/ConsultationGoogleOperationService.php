<?php

namespace App\Services\Consultation;

use App\Models\ConsultationBooking;
use App\Models\ConsultationGoogleOperation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConsultationGoogleOperationService
{
    public function queue(
        ConsultationBooking $booking,
        string $operation,
        array $payload,
        ?string $lastError = null,
    ): ConsultationGoogleOperation {
        $operationKey = $this->operationKey($booking, $operation, $payload);

        return ConsultationGoogleOperation::query()->updateOrCreate(
            ['operation_key' => $operationKey],
            [
                'consultation_booking_id' => $booking->id,
                'operation' => $operation,
                'payload' => $payload,
                'status' => ConsultationGoogleOperation::STATUS_PENDING,
                'last_error' => $lastError ? mb_substr($lastError, 0, 2000) : null,
                'available_at' => now('UTC'),
                'completed_at' => null,
            ],
        );
    }

    public function recordFailure(
        ConsultationBooking $booking,
        string $operation,
        array $payload,
        \Throwable $exception,
    ): ConsultationGoogleOperation {
        $operationKey = $this->operationKey($booking, $operation, $payload);
        $existing = ConsultationGoogleOperation::query()
            ->where('operation_key', $operationKey)
            ->first();

        $attempts = $existing?->attempts ?? 0;
        if ($existing?->status === ConsultationGoogleOperation::STATUS_SUCCEEDED) {
            return $existing;
        }

        $delay = min(60 * 24, max(5, 2 ** min($attempts + 1, 8)));

        return ConsultationGoogleOperation::query()->updateOrCreate(
            ['operation_key' => $operationKey],
            [
                'consultation_booking_id' => $booking->id,
                'operation' => $operation,
                'payload' => $payload,
                'status' => ConsultationGoogleOperation::STATUS_FAILED,
                'last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'available_at' => now('UTC')->addMinutes($delay),
                'completed_at' => null,
            ],
        );
    }

    public function retryDue(BookingWorkflowService $workflow, int $limit = 25): int
    {
        $operations = ConsultationGoogleOperation::query()
            ->where(function ($query) {
                $query->where(function ($query) {
                    $query->whereIn('status', [
                        ConsultationGoogleOperation::STATUS_PENDING,
                        ConsultationGoogleOperation::STATUS_FAILED,
                    ])->where(function ($query) {
                        $query->whereNull('available_at')->orWhere('available_at', '<=', now('UTC'));
                    });
                })->orWhere(function ($query) {
                    $query->where('status', ConsultationGoogleOperation::STATUS_PROCESSING)
                        ->where('updated_at', '<=', now('UTC')->subMinutes((int) config('consultation.google_operation_processing_timeout_minutes', 10)));
                });
            })
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $completed = 0;
        foreach ($operations as $operation) {
            if ($this->run($operation, $workflow)) {
                $completed++;
            }
        }

        return $completed;
    }

    public function run(ConsultationGoogleOperation $operation, BookingWorkflowService $workflow): bool
    {
        $claimed = $this->claim($operation->id);
        if (! $claimed) {
            return false;
        }

        $booking = $claimed->booking()->first();
        if (! $booking) {
            $this->markSucceeded($claimed, $claimed->attempts);

            return true;
        }

        try {
            $payload = $claimed->payload ?? [];

            match ($claimed->operation) {
                'hold' => $workflow->retryCreateHold($booking, $payload),
                'approve' => $workflow->approve($booking, $payload['admin_note'] ?? null),
                'decline' => $workflow->decline(
                    $booking,
                    (bool) ($payload['block_slot'] ?? false),
                    $payload['task_title'] ?? null,
                    $payload['admin_note'] ?? null,
                ),
                'client_pick' => $workflow->clientPickProposedSlot(
                    $booking,
                    Carbon::parse((string) $payload['starts_at'])->utc(),
                ),
                'mark_paid' => $workflow->markPaidFromStripe(
                    $booking,
                    (string) $payload['session_id'],
                    isset($payload['payment_intent_id']) ? (string) $payload['payment_intent_id'] : null,
                ),
                'confirm' => $workflow->confirmBooking($booking, (string) ($payload['actor'] ?? 'system')),
                'approve_cancel' => $workflow->approveCancel($booking),
                'expire' => $workflow->retryExpiredBooking($booking),
                'meet_recording' => $workflow->retryMeetRecording($booking, $payload),
                default => throw new \UnexpectedValueException('Unknown Google operation.'),
            };

            $this->markSucceeded($claimed, $claimed->attempts);

            return true;
        } catch (\InvalidArgumentException $e) {
            // The admin or webhook may have completed the action while it
            // was waiting in the retry queue. Do not retry an inapplicable
            // operation forever.
            $this->markTerminalFailure($claimed, $e);
            Log::warning('Google consultation operation is no longer applicable', [
                'operation' => $claimed->operation_key,
                'error' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            $this->markFailed($claimed, $e);
            Log::error('Google consultation operation retry failed', [
                'operation' => $claimed->operation_key,
                'error' => $e->getMessage(),
            ]);
        }

        return false;
    }

    protected function claim(int $operationId): ?ConsultationGoogleOperation
    {
        return DB::transaction(function () use ($operationId): ?ConsultationGoogleOperation {
            $operation = ConsultationGoogleOperation::query()->lockForUpdate()->find($operationId);
            if (! $operation) {
                return null;
            }

            $now = now('UTC');
            if (
                $operation->status === ConsultationGoogleOperation::STATUS_PROCESSING
                && $operation->updated_at?->gt($now->copy()->subMinutes((int) config('consultation.google_operation_processing_timeout_minutes', 10)))
            ) {
                return null;
            }

            if (
                ! in_array($operation->status, [
                    ConsultationGoogleOperation::STATUS_PENDING,
                    ConsultationGoogleOperation::STATUS_FAILED,
                    ConsultationGoogleOperation::STATUS_PROCESSING,
                ], true)
                || ($operation->available_at && $operation->available_at->isFuture())
            ) {
                return null;
            }

            $operation->forceFill([
                'status' => ConsultationGoogleOperation::STATUS_PROCESSING,
                'attempts' => $operation->attempts + 1,
                'last_error' => null,
            ])->save();

            return $operation->fresh();
        });
    }

    public function markSucceeded(ConsultationGoogleOperation $operation, ?int $attempts = null): void
    {
        $query = ConsultationGoogleOperation::query()
            ->whereKey($operation->id)
            ->whereIn('status', [
                ConsultationGoogleOperation::STATUS_PENDING,
                ConsultationGoogleOperation::STATUS_PROCESSING,
            ]);

        if ($attempts !== null) {
            $query->where('attempts', $attempts);
        }

        $query->update([
            'status' => ConsultationGoogleOperation::STATUS_SUCCEEDED,
            'last_error' => null,
            'available_at' => null,
            'completed_at' => now('UTC'),
            'updated_at' => now('UTC'),
        ]);
    }

    protected function markFailed(ConsultationGoogleOperation $operation, \Throwable $exception): void
    {
        $delay = min(60 * 24, max(5, 2 ** min($operation->attempts, 8)));

        ConsultationGoogleOperation::query()
            ->whereKey($operation->id)
            ->where('status', ConsultationGoogleOperation::STATUS_PROCESSING)
            ->where('attempts', $operation->attempts)
            ->update([
                'status' => ConsultationGoogleOperation::STATUS_FAILED,
                'last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'available_at' => now('UTC')->addMinutes($delay),
                'updated_at' => now('UTC'),
            ]);
    }

    protected function markTerminalFailure(ConsultationGoogleOperation $operation, \Throwable $exception): void
    {
        ConsultationGoogleOperation::query()
            ->whereKey($operation->id)
            ->where('status', ConsultationGoogleOperation::STATUS_PROCESSING)
            ->where('attempts', $operation->attempts)
            ->update([
                'status' => ConsultationGoogleOperation::STATUS_NEEDS_ATTENTION,
                'last_error' => mb_substr($exception->getMessage(), 0, 2000),
                'available_at' => null,
                'updated_at' => now('UTC'),
            ]);
    }

    protected function operationKey(ConsultationBooking $booking, string $operation, array $payload): string
    {
        $suffix = $operation === 'client_pick'
            ? '-'.substr(hash('sha256', (string) ($payload['starts_at'] ?? '')), 0, 16)
            : '';

        return 'consultation-booking-'.$booking->id.'-google-'.$operation.$suffix;
    }
}
