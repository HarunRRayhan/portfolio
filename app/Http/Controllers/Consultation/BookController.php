<?php

namespace App\Http\Controllers\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationTier;
use App\Services\Consultation\AvailabilityService;
use App\Services\Consultation\BookingWorkflowService;
use App\Services\Consultation\ConsultationLaunchPromotionService;
use App\Services\Consultation\StripeCheckoutService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function show(StripeCheckoutService $stripe, ConsultationLaunchPromotionService $promotion): Response
    {
        $tiers = ConsultationTier::query()->active()->get()->map->toPublicArray()->values();

        return Inertia::render('Book', [
            'tiers' => $tiers,
            'stripeConfigured' => $stripe->configured(),
            'minLeadHours' => (int) config('consultation.min_lead_hours', 48),
            'bufferMinutes' => (int) config('consultation.buffer_minutes', 15),
            'timezones' => \DateTimeZone::listIdentifiers(),
            'launchPromotion' => [
                'discount_cents' => $promotion->discountCents(),
                'limit' => $promotion->limit(),
                'remaining_bookings' => $promotion->remaining(),
            ],
        ]);
    }

    public function availability(Request $request, AvailabilityService $availability): JsonResponse
    {
        $data = $request->validate([
            'tier' => ['required', 'string'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $tier = ConsultationTier::query()->active()->where('slug', $data['tier'])->firstOrFail();
        $from = isset($data['from']) ? Carbon::parse($data['from'])->utc() : null;
        $to = isset($data['to']) ? Carbon::parse($data['to'])->utc() : null;

        return response()->json([
            'slots' => $availability->availableSlots($tier, $from, $to),
        ]);
    }

    public function validateCoupon(Request $request, ConsultationLaunchPromotionService $promotion): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
            'tier' => ['required', 'string'],
        ]);

        $tier = ConsultationTier::query()->active()->where('slug', $data['tier'])->firstOrFail();
        $coupon = ConsultationCoupon::query()
            ->whereRaw('lower(code) = ?', [strtolower(trim($data['code']))])
            ->first();

        if (! $coupon || ! $coupon->isValidForTier($tier->slug)) {
            return response()->json(['valid' => false, 'message' => 'Invalid coupon for this plan.'], 422);
        }

        $pricing = $promotion->preview((int) $tier->price_cents, $coupon);

        return response()->json([
            'valid' => true,
            'percent_off' => $coupon->percent_off,
            'campaign_discount_cents' => $pricing['campaign_discount_cents'],
            'amount_due_cents' => $pricing['amount_due_cents'],
        ]);
    }

    public function store(Request $request, BookingWorkflowService $workflow): RedirectResponse
    {
        $data = $request->validate([
            'tier' => ['required', 'string'],
            'client_name' => ['required', 'string', 'max:120'],
            'client_email' => ['required', 'email', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'starts_at' => ['required', 'date'],
            'coupon_code' => ['nullable', 'string', 'max:64'],
        ]);

        $tier = ConsultationTier::query()->active()->where('slug', $data['tier'])->firstOrFail();
        $coupon = null;

        if (! empty($data['coupon_code'])) {
            $coupon = ConsultationCoupon::query()
                ->whereRaw('lower(code) = ?', [strtolower(trim($data['coupon_code']))])
                ->first();

            if (! $coupon || ! $coupon->isValidForTier($tier->slug)) {
                return back()->withErrors(['coupon_code' => 'Invalid coupon for this plan.'])->withInput();
            }
        }

        try {
            $result = $workflow->requestBooking(
                $tier,
                $data['client_name'],
                $data['client_email'],
                $data['notes'] ?? null,
                Carbon::parse($data['starts_at'])->utc(),
                $coupon,
                $data['company_name'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['starts_at' => $e->getMessage()])->withInput();
        } catch (\RuntimeException) {
            return back()->withErrors(['starts_at' => 'That slot is temporarily unavailable. Please try again.'])->withInput();
        }

        return redirect()
            ->to($result['booking']->accessUrl($result['plain_token']))
            ->with('flash', [
                'type' => 'success',
                'message' => 'Request submitted. We’ll email you when it’s reviewed.',
            ]);
    }
}
