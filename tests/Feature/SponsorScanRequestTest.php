<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\ScanRequestedMail;
use App\Models\ConsultationCredit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Support\CreatesSponsorCredits;
use Tests\TestCase;

class SponsorScanRequestTest extends TestCase
{
    use CreatesSponsorCredits;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['mail.owner.address' => 'owner@example.com']);
    }

    private function user(): User
    {
        return User::factory()->create(['terms_accepted_at' => now()]);
    }

    private function scanCredit(User $user): ConsultationCredit
    {
        $credit = $this->sponsorCredit($user);
        $credit->update(['kind' => ConsultationCredit::KIND_SCAN, 'consultation_tier_id' => null]);

        return $credit->fresh();
    }

    public function test_scan_request_uses_credit_and_mails_owner(): void
    {
        Mail::fake();
        $user = $this->user();
        $credit = $this->scanCredit($user);

        $this->actingAs($user)->post('/consultation/scan', [
            'repo_url' => 'https://github.com/acme/app',
            'notes' => 'Focus on auth',
        ])->assertRedirect('/consultation')->assertSessionHas('flash');

        $credit->refresh();
        $this->assertNotNull($credit->used_at);
        $this->assertSame('https://github.com/acme/app', $credit->scan_repo_url);
        Mail::assertSent(ScanRequestedMail::class, fn ($m) => $m->hasTo('owner@example.com')
            && $m->repoUrl === 'https://github.com/acme/app' && $m->notes === 'Focus on auth');
    }

    public function test_no_scan_credit_forbidden(): void
    {
        Mail::fake();
        $user = $this->user();

        $this->actingAs($user)->get('/consultation/scan')->assertOk();
        $this->actingAs($user)->post('/consultation/scan', ['repo_url' => 'https://github.com/acme/app'])->assertForbidden();
        Mail::assertNothingSent();
    }

    public function test_non_github_repo_rejected(): void
    {
        Mail::fake();
        $user = $this->user();
        $credit = $this->scanCredit($user);

        foreach (['https://gitlab.com/acme/app', 'http://github.com/acme/app', 'https://github.com.evil.test/a/b'] as $url) {
            $this->actingAs($user)->post('/consultation/scan', ['repo_url' => $url])->assertSessionHasErrors('repo_url');
        }
        $this->assertNull($credit->fresh()->used_at);
        Mail::assertNothingSent();
    }
}
