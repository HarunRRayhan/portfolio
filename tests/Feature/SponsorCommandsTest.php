<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\CreditExpiringMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Support\CreatesSponsorCredits;
use Tests\TestCase;

class SponsorCommandsTest extends TestCase
{
    use CreatesSponsorCredits;
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['terms_accepted_at' => now()]);
    }

    public function test_reminder_sent_once(): void
    {
        Mail::fake();
        $user = $this->user();
        $credit = $this->sponsorCredit($user, 'pro', ['expires_at' => now()->addDays(3)]);

        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);
        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);

        Mail::assertSent(CreditExpiringMail::class, 1);
        $this->assertNotNull($credit->fresh()->reminded_at);
    }

    public function test_reminder_skips_far_expiry_and_monthly(): void
    {
        Mail::fake();
        $user = $this->user();
        $this->sponsorCredit($user, 'pro', ['expires_at' => now()->addDays(30)]);
        $monthly = $this->sponsorCredit($user, 'pro', ['expires_at' => now()->addDays(2)]);
        $monthly->sponsorship->update(['kind' => 'monthly']);

        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);

        Mail::assertNothingSent();
    }

    public function test_failed_reminder_stays_unreminded(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));
        $credit = $this->sponsorCredit($this->user(), 'pro', ['expires_at' => now()->addDays(3)]);

        $this->artisan('sponsors:remind-expiring')->assertExitCode(0);

        $this->assertNull($credit->fresh()->reminded_at);
    }
}
