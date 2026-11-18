<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

/** A sponsor who can't use GitHub Sponsors asks to pay another way; the admin approves it into a roadmap access grant. */
class PaymentRequest extends Model
{
    use HasUlids;

    /** Same prices and lengths as GitHub Sponsors access ($5 a month, $10 a year, $100 for life). */
    public const PLANS = [
        'monthly' => ['label' => 'Monthly', 'price' => '$5'],
        'yearly' => ['label' => 'Yearly', 'price' => '$10'],
        'lifetime' => ['label' => 'Lifetime', 'price' => '$100'],
    ];

    /** bKash only for Bangladesh; "other" works anywhere and is arranged by email. */
    public const METHODS = ['bkash' => 'bKash', 'other' => 'Another method'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['paid_at' => 'datetime', 'decided_at' => 'datetime'];
    }

    public function uniqueIds(): array
    {
        return ['public_id'];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function grant()
    {
        return $this->belongsTo(RoadmapAccessGrant::class, 'grant_id');
    }

    /** The private link the person uses to come back and add their payment details. */
    public function url(): string
    {
        return URL::signedRoute('sponsor.pay.show', ['paymentRequest' => $this->public_id]);
    }

    public static function expiresFor(string $plan, ?Carbon $from = null): Carbon
    {
        $from ??= now();

        return match ($plan) {
            'monthly' => $from->copy()->addMonthNoOverflow()->endOfDay(),
            'yearly' => $from->copy()->addYear()->endOfDay(),
            default => Carbon::parse('2099-12-31')->endOfDay(),
        };
    }
}
