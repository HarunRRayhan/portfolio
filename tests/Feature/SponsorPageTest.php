<?php

namespace Tests\Feature;

use App\Services\Sponsorship\SponsorCheckoutService;
use Mockery\MockInterface;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SponsorPageTest extends TestCase
{
    public function test_sponsor_page_exposes_dynamic_checkout_configuration(): void
    {
        config()->set('stripe.secret', 'configured-secret-placeholder');

        $response = $this->get('/sponsor-me');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Sponsor')
            ->where('canonicalUrl', rtrim((string) config('app.url'), '/').'/sponsor-me')
            ->where('stripeConfigured', true)
            ->where('minAmountCents', 100)
            ->where('maxAmountCents', 1_000_000)
            ->where('suggestedAmountCents', [500, 1_000, 2_500, 5_000]));
    }

    public function test_checkout_requires_a_valid_amount_and_cadence(): void
    {
        $this->post('/sponsor-me/checkout', [
            'amount' => '0.999',
            'cadence' => 'weekly',
        ])->assertSessionHasErrors(['amount', 'cadence']);
    }

    #[DataProvider('cadenceProvider')]
    public function test_checkout_creates_a_session_for_each_cadence(string $amount, string $cadence): void
    {
        $checkoutUrl = 'https://checkout.stripe.com/c/pay/test_'.$cadence;

        $this->mock(SponsorCheckoutService::class, function (MockInterface $mock) use ($amount, $cadence, $checkoutUrl): void {
            $mock->shouldReceive('configured')->once()->andReturnTrue();
            $mock->shouldReceive('createCheckoutUrl')
                ->once()
                ->with($amount, $cadence)
                ->andReturn($checkoutUrl);
        });

        $this->withHeaders($this->inertiaHeaders())
            ->post('/sponsor-me/checkout', [
                'amount' => $amount,
                'cadence' => $cadence,
            ])
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location', $checkoutUrl);
    }

    public static function cadenceProvider(): array
    {
        return [
            'one time' => ['5.00', SponsorCheckoutService::CADENCE_ONCE],
            'monthly' => ['12.50', SponsorCheckoutService::CADENCE_MONTHLY],
        ];
    }

    public function test_checkout_shows_an_error_when_stripe_is_not_configured(): void
    {
        $this->mock(SponsorCheckoutService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('configured')->once()->andReturnFalse();
        });

        $this->post('/sponsor-me/checkout', [
            'amount' => '10.00',
            'cadence' => 'once',
        ])->assertSessionHasErrors('checkout');
    }

    public function test_old_sponsor_path_redirects_to_the_new_canonical_path(): void
    {
        $this->get('/sponsor')->assertRedirect('/sponsor-me');
    }
}
