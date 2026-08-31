<?php

namespace App\Http\Controllers\Admin\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationCoupon;
use App\Models\ConsultationTier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Consultations/Coupons/Index', [
            'coupons' => ConsultationCoupon::query()->latest()->get()->map(fn ($c) => $this->payload($c)),
            'tiers' => ConsultationTier::query()->active()->get(['slug', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        ConsultationCoupon::create($data);

        return redirect()->route('admin.consultations.coupons.index')->with('flash', [
            'type' => 'success',
            'message' => 'Coupon created.',
        ]);
    }

    public function update(Request $request, ConsultationCoupon $coupon): RedirectResponse
    {
        $coupon->update($this->validated($request, $coupon));

        return back()->with('flash', ['type' => 'success', 'message' => 'Coupon updated.']);
    }

    public function destroy(ConsultationCoupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return back()->with('flash', ['type' => 'success', 'message' => 'Coupon deleted.']);
    }

    protected function validated(Request $request, ?ConsultationCoupon $coupon = null): array
    {
        $tierSlugs = ConsultationTier::query()->pluck('slug')->all();

        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('consultation_coupons', 'code')->ignore($coupon?->id),
            ],
            'percent_off' => ['required', 'integer', 'between:1,100'],
            'tier_slugs' => ['required', 'array', 'min:1'],
            'tier_slugs.*' => ['required', 'string', Rule::in($tierSlugs)],
            'max_redemptions' => ['nullable', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['code'] = strtoupper(trim($data['code']));
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }

    protected function payload(ConsultationCoupon $c): array
    {
        return [
            'id' => $c->id,
            'code' => $c->code,
            'percent_off' => $c->percent_off,
            'tier_slugs' => $c->tier_slugs,
            'max_redemptions' => $c->max_redemptions,
            'redeemed_count' => $c->redeemed_count,
            'expires_at' => $c->expires_at?->utc()->toIso8601String(),
            'is_active' => $c->is_active,
        ];
    }
}
