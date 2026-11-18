<?php

namespace App\Mail\Sponsorship;

use App\Models\PaymentRequest;
use Illuminate\Mail\Mailable;

/** Mail about a pay-another-way request. $kind: received (to the person), approved (to the person), owner (to Harun). */
class PaymentRequestMail extends Mailable
{
    public function __construct(public PaymentRequest $paymentRequest, public string $kind) {}

    public function build()
    {
        $r = $this->paymentRequest;
        $plan = PaymentRequest::PLANS[$r->plan]['label'] ?? $r->plan;
        $subject = match ($this->kind) {
            'received' => 'Your sponsorship request',
            'approved' => 'Your roadmap access is unlocked',
            default => ($r->status === 'paid' ? 'Payment details sent: ' : 'New payment request: ').$r->name.' ('.$plan.', '.(PaymentRequest::METHODS[$r->method] ?? $r->method).')',
        };
        if ($this->kind === 'owner') {
            $this->replyTo($r->email, $r->name);
        }

        return $this->subject($subject)->markdown('emails.sponsorship.payment-request', [
            'r' => $r,
            'kind' => $this->kind,
            'plan' => $plan,
            'price' => PaymentRequest::PLANS[$r->plan]['price'] ?? '',
            'method' => PaymentRequest::METHODS[$r->method] ?? $r->method,
            'requestUrl' => $r->url(),
            'adminUrl' => route('admin.roadmap-access.index'),
            'roadmapsUrl' => url('/roadmaps'),
        ]);
    }
}
