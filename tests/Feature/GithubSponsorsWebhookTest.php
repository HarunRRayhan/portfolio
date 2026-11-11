<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\GithubWebhookFailedMail;
use App\Mail\Sponsorship\SponsorCreditsReadyMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
use App\Models\User;
use App\Services\Consultation\BookingWorkflowService;
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
            'sponsors.tiers.max.node_id' => 'T_max',
            'sponsors.tiers.pro.node_id' => 'T_pro',
            'sponsors.tiers.monthly.node_id' => 'T_monthly',
            'mail.owner.address' => 'owner@example.test',
        ]);
        ConsultationTier::query()->firstOrCreate(['slug' => 'max'], ['name' => 'Max', 'duration_minutes' => 60, 'price_cents' => 0, 'is_active' => true]);
        Mail::fake();
    }

    private function payload(string $action = 'created', string $tierNode = 'T_max', array $over = []): array
    {
        return array_replace_recursive([
            'action' => $action,
            'sponsorship' => [
                'node_id' => 'S_1',
                'created_at' => now()->toIso8601String(),
                'tier' => ['node_id' => $tierNode, 'is_one_time' => $tierNode !== 'T_monthly'],
                'sponsor' => ['id' => 1001, 'login' => 'alice', 'type' => 'User'],
            ],
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
        $this->assertSame('max', $s->tier_slug);
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

        $this->send($this->payload('created', 'T_max', [
            'sponsorship' => ['sponsor' => ['id' => 5, 'login' => 'acme', 'type' => 'Organization']],
            'sender' => ['id' => 1002, 'login' => 'bob', 'type' => 'User'],
        ]))->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('1002', $s->github_sponsor_id);
        $this->assertSame('bob', $s->github_login);
    }

    public function test_user_sponsor_is_read_from_the_sponsorship_object(): void
    {
        Http::fake(['api.github.com/*' => Http::response([])]);

        $this->send($this->payload('created', 'T_max', ['sender' => ['id' => 7, 'login' => 'someone-else', 'type' => 'User']]))->assertOk();

        $this->assertSame('alice', GithubSponsorship::firstOrFail()->github_login);
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
        $this->send($this->payload('created', 'T_pro'), 'd-1')->assertOk();

        $this->send($this->payload('tier_changed', 'T_monthly', ['sponsorship' => ['tier' => ['is_one_time' => false]]]), 'd-2')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('monthly', $s->tier_slug);
        $this->assertSame('monthly', $s->kind);
    }

    public function test_cancelled_ends_monthly_sponsorship(): void
    {
        $this->send($this->payload('created', 'T_monthly'))->assertOk();
        $this->send($this->payload('cancelled', 'T_monthly'), 'd-2')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('cancelled', $s->status);
        $this->assertSame(0, $s->credits()->whereNull('revoked_at')->count());
    }

    public function test_cancelled_one_time_is_ignored(): void
    {
        $this->send($this->payload())->assertOk();
        $this->send($this->payload('cancelled'), 'd-2')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('active', $s->status);
        $this->assertNull($s->ended_at);
        $this->assertSame(1, $s->credits()->whereNull('revoked_at')->count());
        $this->assertNotNull(GithubWebhookEvent::where('delivery_id', 'd-2')->value('processed_at'));
    }

    public function test_repeat_one_time_purchase_grants_again(): void
    {
        $this->send($this->payload('created', 'T_max', ['sponsorship' => ['created_at' => now()->subDays(40)->toIso8601String()]]))->assertOk();
        $this->send($this->payload('created', 'T_pro'), 'd-2')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('pro', $s->tier_slug);
        $this->assertSame(2, $s->credits()->whereNull('revoked_at')->count());
    }

    public function test_two_one_time_purchases_same_day_grant_two_credits_and_two_mails(): void
    {
        User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);
        $this->travelTo(now()->startOfDay()->addHours(9));
        $this->send($this->payload())->assertOk();
        $this->travel(2)->hours();
        $second = $this->payload();
        $this->send($second, 'd-2')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame(2, $s->credits()->usable()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 2);

        $this->send($second, 'd-2')->assertOk();
        $this->send($second, 'd-3')->assertOk();
        $this->assertSame(2, $s->credits()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 2);
    }

    public function test_failing_cancel_cascade_keeps_cancel_and_marks_processed(): void
    {
        $this->send($this->payload('created', 'T_monthly'))->assertOk();
        $s = GithubSponsorship::firstOrFail();
        $b = ConsultationBooking::create([
            'consultation_tier_id' => ConsultationTier::query()->where('slug', 'max')->value('id'),
            'client_name' => 'C', 'client_email' => 'c@example.test',
            'starts_at' => now()->addDays(5), 'ends_at' => now()->addDays(5)->addHour(),
            'status' => 'confirmed', 'list_price_cents' => 0, 'amount_due_cents' => 0,
            'access_token_hash' => hash('sha256', 'x'),
        ]);
        $s->credits()->first()->update(['used_by_booking_id' => $b->id, 'used_at' => now()]);
        $this->mock(BookingWorkflowService::class, fn ($m) => $m->shouldReceive('cancelForSponsorEnd')->once()->andThrow(new \RuntimeException('google down')));
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('smtp down'));

        $this->send($this->payload('cancelled', 'T_monthly'), 'd-2')->assertOk();

        $this->assertSame('cancelled', $s->fresh()->status);
        $this->assertSame(0, $s->credits()->whereNull('revoked_at')->count());
        $e = GithubWebhookEvent::where('delivery_id', 'd-2')->firstOrFail();
        $this->assertNotNull($e->processed_at);
        $this->assertNull($e->failed_at);
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
        $created = $this->payload('created', 'T_monthly');
        $this->send($created)->assertOk();
        $this->send($this->payload('cancelled', 'T_monthly'), 'd-2')->assertOk();
        $this->send($created, 'd-3')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('cancelled', $s->status);
        $this->assertSame(1, GithubSponsorship::count());
        $this->assertSame(3, $s->credits()->count());
        $this->assertSame(0, $s->credits()->whereNull('revoked_at')->count());
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
        $this->send($this->payload('created', 'T_monthly'))->assertOk();
        $this->send($this->payload('cancelled', 'T_monthly'), 'd-2')->assertOk();
        $this->send($this->payload('tier_changed', 'T_pro'), 'd-3')->assertOk();

        $this->assertSame('cancelled', GithubSponsorship::firstOrFail()->status);
    }

    public function test_responsor_after_cancel_with_newer_created_at_reactivates_and_grants(): void
    {
        User::factory()->create(['provider_name' => 'github', 'provider_id' => '1001']);
        $old = ['sponsorship' => ['created_at' => now()->subDays(10)->toIso8601String()]];
        $this->send($this->payload('created', 'T_monthly', $old))->assertOk();
        $this->send($this->payload('cancelled', 'T_monthly'), 'd-2')->assertOk();
        $this->travel(1)->minutes();
        $new = ['sponsorship' => ['created_at' => now()->toIso8601String()]];
        $this->send($this->payload('created', 'T_pro', $new), 'd-3')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('active', $s->status);
        $this->assertNull($s->ended_at);
        $this->assertSame('pro', $s->tier_slug);
        $this->assertSame(1, $s->credits()->whereNull('revoked_at')->count());
        $this->assertSame(4, $s->credits()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 2);

        $this->send($this->payload('created', 'T_pro', $new), 'd-4')->assertOk();
        $this->assertSame(4, $s->credits()->count());
        Mail::assertSent(SponsorCreditsReadyMail::class, 2);
    }

    public function test_replayed_tier_changed_cannot_lower_start_and_enable_reactivation(): void
    {
        $t1 = ['sponsorship' => ['created_at' => now()->subDays(10)->toIso8601String()]];
        $this->send($this->payload('created', 'T_monthly', $t1))->assertOk();
        $this->send($this->payload('cancelled', 'T_monthly'), 'd-2')->assertOk();
        $this->travel(1)->minutes();
        $t3 = ['sponsorship' => ['created_at' => now()->toIso8601String()]];
        $this->send($this->payload('created', 'T_monthly', $t3), 'd-3')->assertOk();
        $startedAt = GithubSponsorship::firstOrFail()->started_at;

        $this->send($this->payload('tier_changed', 'T_monthly', $t1), 'd-4')->assertOk();
        $this->assertEquals($startedAt, GithubSponsorship::firstOrFail()->started_at);

        $this->travel(1)->minutes();
        $this->send($this->payload('cancelled', 'T_monthly'), 'd-5')->assertOk();
        $this->send($this->payload('created', 'T_monthly', $t3), 'd-6')->assertOk();

        $this->assertSame('cancelled', GithubSponsorship::firstOrFail()->status);
    }

    public function test_replayed_old_cancelled_does_not_cancel_responsored_sponsorship(): void
    {
        $t1 = ['sponsorship' => ['created_at' => now()->subDays(10)->toIso8601String()]];
        $this->send($this->payload('created', 'T_monthly', $t1))->assertOk();
        $oldCancel = $this->payload('cancelled', 'T_monthly', $t1);
        $this->send($oldCancel, 'd-2')->assertOk();
        $this->travel(1)->minutes();
        $t3 = ['sponsorship' => ['created_at' => now()->toIso8601String()]];
        $this->send($this->payload('created', 'T_monthly', $t3), 'd-3')->assertOk();

        $this->send($oldCancel, 'd-4')->assertOk();

        $s = GithubSponsorship::firstOrFail();
        $this->assertSame('active', $s->status);
        $this->assertSame(3, $s->credits()->whereNull('revoked_at')->count());
    }
}
