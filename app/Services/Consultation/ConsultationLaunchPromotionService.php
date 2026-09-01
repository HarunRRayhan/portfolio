<?php

namespace App\Services\Consultation;

use App\Models\ConsultationCoupon;
use App\Models\ConsultationSetting;

class ConsultationLaunchPromotionService
{
    /**
     * @return array{campaign_discount_cents: int, amount_due_cents: int}
     */
    public function preview(int $listPriceCents, ?ConsultationCoupon $coupon = null): array
    {
        $campaignDiscount = $this->availableDiscount($listPriceCents);
        $discountedPrice = max(0, $listPriceCents - $campaignDiscount);

        return [
            'campaign_discount_cents' => $campaignDiscount,
            'amount_due_cents' => $coupon
                ? $coupon->discountedAmountCents($discountedPrice)
                : $discountedPrice,
        ];
    }

    public function claim(int $listPriceCents): int
    {
        $setting = ConsultationSetting::query()
            ->where('key', $this->counterKey())
            ->lockForUpdate()
            ->first();

        // Fail closed if the promotion counter was not migrated correctly.
        if (! $setting || $setting->value === null || trim((string) $setting->value) === '') {
            return 0;
        }

        $claimed = max(0, (int) $setting->value);
        $discount = min($this->discountCents(), max(0, $listPriceCents));

        if ($discount === 0 || $claimed >= $this->limit()) {
            return 0;
        }

        $setting->value = (string) ($claimed + 1);
        $setting->save();

        return $discount;
    }

    public function discountCents(): int
    {
        return max(0, (int) config('consultation.launch_promotion.discount_cents', 10000));
    }

    public function limit(): int
    {
        return max(0, (int) config('consultation.launch_promotion.limit', 1000));
    }

    public function remaining(): int
    {
        $claimed = ConsultationSetting::query()
            ->where('key', $this->counterKey())
            ->value('value');

        if ($claimed === null || trim((string) $claimed) === '') {
            return 0;
        }

        return max(0, $this->limit() - (int) $claimed);
    }

    protected function availableDiscount(int $listPriceCents): int
    {
        return $this->remaining() > 0
            ? min($this->discountCents(), max(0, $listPriceCents))
            : 0;
    }

    protected function counterKey(): string
    {
        return (string) config(
            'consultation.launch_promotion.counter_key',
            'consultation_booking_promotion_claimed_count',
        );
    }
}
