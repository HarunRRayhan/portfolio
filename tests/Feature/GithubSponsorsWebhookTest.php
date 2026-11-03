<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\GithubWebhookFailedMail;
use App\Mail\Sponsorship\SponsorCreditsReadyMail;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
use App\Models\User;
use App\Services\Sponsorship\SponsorCreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class GithubSponsorsWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'whsec';

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'sponsors.webhook_secret' => self::SECRET,
            'sponsors.tiers.pro.node_id' => 'T_pro',
            'sponsors.tiers.light.node_id' => 'T_light',
            'sponsors.tiers.monthly.node_id' => 'T_monthly',
            'mail.owner.address' => 'owner@example.test',
        ]);
        ConsultationTier::query()->firstOrCreate(['slug' => 'pro'], ['name' => 'Pro', 'duration_minutes' => 60, 'price_cents' => 0, 'is_active' => true]);
        Mail::fake();
    }

    private function payload(string $action = 'created', string $tierNode = 'T_pro', array $over = []): array
    {
        return array_replace_recursive([
            'action' => $action,
            'sponsorship' => [
                'node_id' => 'S_1',
                'created_at' => now()->toIso8601String(),
                'tier' => ['node_id' => $tierNode, 'is_one_time' => true],
            ],
            'sponsor' => ['id' => 1001, 'login' => 'alice', 'type' => 'User'],
            'sender' => ['id' => 1001, 'login' => 'alice', 'type' => 'User'],
        ], $over);
    }

    private function send(array $payload, string $delivery = 'd-1', ?string $secret = self::SECRET, string $event = 'sponsorship')
    {
        $body = json_encode($payload);
        $headers = ['X-GitHub-Event' => $event, 'X-GitHub-Delivery' => $delivery, 'Content-Type' => 'application/json'];
        if ($secret !== null) {
            $headers['X-Hub-Signature-256'] = 'sha256='.hash_hmac('sha256', $body, $secret);
        }

        return $this->call('POST', '/github/sponsors/webhook', [], [], [], $this->transformHeadersToServerVars($headers), $body);
    }

    public function test_rejects_bad_signature_401(): void
    {
        $this->send($this->payload(), secret: 'wrong')->assertStatus(401);
        $this->send($this->payload(), 'd-2', null)->assertStatus(401);
        $this->assertSame(0, GithubWebhookEvent::count());
    }

    public function test_rejects_when_secret_unset(): void
    {
        config(['sponsors.webhook_secret' => null]);
        $this->send($this->payload(), secret: '')->assertStatus(401);
    }

    public function test_created_one_time_grants_credit_and_mails_user(): void
    {
        $user = User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);

        $this->send($this->payload())->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('pro', $s->tier_slug);
        $this->assertSame($user->id, $s->user_id);
        $this->assertSame(1, $s->credits()->count());
        $this->assertNotNull(GithubWebhookEvent::first()->processed_at);
        Mail::assertSent(SponsorCreditsReadyMail::class, fn ($m) => $m->hasTo($user->email) && $m->expiresAt !== null);
    }

    public function test_created_unknown_user_fetches_public_email(): void
    {
        Http::fake(['api.github.com/user/1001' => Http::response(['email' => 'alice@example.test'])]);

        $this->send($this->payload())->assertOk();

        Mail::assertSent(SponsorCreditsReadyMail::class, fn ($m) => $m->hasTo('alice@example.test'));
        Http::assertSent(fn ($r) => $r->hasHeader('Accept', 'application/vnd.github+json'));
    }

    public function test_public_email_failure_sends_no_mail(): void
    {
        Http::fake(['api.github.com/*' => Http::response([], 500)]);

        $this->send($this->payload())->assertOk();

        Mail::assertNothingSent();
        $this->assertSame(1, GithubSponsorship::firstOrFail()->credits()->count());
    }

    public function test_duplicate_delivery_is_noop(): void
    {
        Http::fake(['api.github.com/*' => Http::response(['email' => 'a@example.test'])]);

        $this->send($this->payload())->assertOk();
        $this->send($this->payload())->assertOk();

        $this->assertSame(1, GithubSponsorship::count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 1);
    }

    public function test_org_sponsorship_credits_sender(): void
    {
        Http::fake(['api.github.com/*' => Http::response([])]);

        $this->send($this->payload('created', 'T_pro', [
            'sponsor' => ['id' => 5, 'login' => 'acme', 'type' => 'Organization'],
            'sender' => ['id' => 1002, 'login' => 'bob', 'type' => 'User'],
        ]))->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('1002', $s->github_sponsor_id);
        $this->assertSame('bob', $s->github_login);
    }

    public function test_donation_tier_sends_no_mail(): void
    {
        $this->send($this->payload('created', 'T_unknown'))->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertNull($s->tier_slug);
        $this->assertSame(0, $s->credits()->count());
        Mail::assertNothingSent();
    }

    public function test_tier_changed_updates_tier(): void
    {
        Http::fake(['api.github.com/*' => Http::response([])]);
        $this->send($this->payload('created', 'T_light'), 'd-1')->assertOk();

        $this->send($this->payload('tier_changed', 'T_monthly', ['sponsorship' => ['tier' => ['is_one_time' => false]]]), 'd-2')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('monthly', $s->tier_slug);
        $this->assertSame('monthly', $s->kind);
    }

    public function test_cancelled_ends_sponsorship(): void
    {
        $this->send($this->payload())->assertOk();
        $this->send($this->payload('cancelled'), 'd-2')->assertOk();

        $this->assertSame('cancelled', GithubSponsorship::firstOrFail()->status);
    }

    public function test_ping_and_other_events_are_stored(): void
    {
        $this->send(['zen' => 'x'], 'd-p', event: 'ping')->assertOk();
        $this->send($this->payload('edited'), 'd-e')->assertOk();

        $this->assertSame(2, GithubWebhookEvent::whereNotNull('processed_at')->count());
        $this->assertSame(0, GithubSponsorship::count());
    }

    public function test_failure_mails_owner_and_returns_500_then_redelivery_succeeds(): void
    {
        $this->mock(SponsorCreditService::class, fn ($m) => $m->shouldReceive('recordSponsorship')->once()->andThrow(new \RuntimeException('boom')));

        $this->send($this->payload())->assertStatus(500);

        $e = GithubWebhookEvent::firstOrFail();
        $this->assertNotNull($e->failed_at);
        $this->assertStringContainsString('boom', $e->error);
        $this->assertNull($e->processed_at);
        Mail::assertSent(GithubWebhookFailedMail::class, fn ($m) => $m->hasTo('owner@example.test'));

        $this->app->forgetInstance(SponsorCreditService::class);
        $this->app->bind(SponsorCreditService::class);
        Http::fake(['api.github.com/*' => Http::response([])]);
        $this->send($this->payload())->assertOk();
        $this->assertNotNull($e->fresh()->processed_at);
        $this->assertSame(1, GithubSponsorship::count());
    }

    public function test_mail_failure_keeps_credits_and_returns_200(): void
    {
        $user = User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));

        $this->send($this->payload())->assertOk();

        $this->assertSame(1, GithubSponsorship::firstOrFail()->credits()->count());
        $this->assertNotNull(GithubWebhookEvent::first()->processed_at);
        $this->assertNull(GithubWebhookEvent::first()->failed_at);
    }

    public function test_replayed_created_after_cancel_does_not_reactivate(): void
    {
        $created = $this->payload();
        $this->send($created)->assertOk();
        $this->send($this->payload('cancelled'), 'd-2')->assertOk();
        $this->send($created, 'd-3')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('cancelled', $s->status);
        $this->assertSame(1, GithubSponsorship::count());
        $this->assertSame(1, $s->credits()->count());
        $this->assertNotNull($s->credits()->first()->revoked_at);
    }

    public function test_replayed_created_for_active_sponsorship_grants_nothing_and_sends_no_mail(): void
    {
        User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);
        $created = $this->payload();
        $this->send($created)->assertOk();
        $this->send($created, 'd-2')->assertOk();

        $this->assertSame(1, GithubSponsorship::firstOrFail()->credits()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 1);
        $this->assertSame(2, GithubWebhookEvent::whereNotNull('processed_at')->count());
    }

    public function test_tier_changed_cannot_reactivate_cancelled(): void
    {
        $this->send($this->payload())->assertOk();
        $this->send($this->payload('cancelled'), 'd-2')->assertOk();
        $this->send($this->payload('tier_changed', 'T_light'), 'd-3')->assertOk();

        $this->assertSame('cancelled', GithubSponsorship::firstOrFail()->status);
    }

    public function test_responsor_after_cancel_with_newer_created_at_reactivates_and_grants(): void
    {
        User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);
        $old = ['sponsorship' => ['created_at' => now()->subDays(10)->toIso8601String()]];
        $new = ['sponsorship' => ['created_at' => now()->toIso8601String()]];
        $this->send($this->payload('created', 'T_pro', $old))->assertOk();
        $this->send($this->payload('cancelled'), 'd-2')->assertOk();
        $this->send($this->payload('created', 'T_light', $new), 'd-3')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('active', $s->status);
        $this->assertNull($s->ended_at);
        $this->assertSame('light', $s->tier_slug);
        $this->assertSame(1, $s->credits()->whereNull('revoked_at')->count());
        $this->assertSame(2, $s->credits()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 2);

        $this->send($this->payload('created', 'T_light', $new), 'd-4')->assertOk();
        $this->assertSame(2, $s->credits()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 2);
    }
}
