<?php

namespace Tests\Feature;

use App\Models\ConsultationCredit;
use App\Models\ConsultationTier;
use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SponsorSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_relations_and_usable_scope(): void
    {
        $user = User::factory()->create();
        $tier = ConsultationTier::where('slug', 'max')->firstOrFail();
        $sponsorship = GithubSponsorship::create([
            'github_sponsor_id' => '123',
            'github_login' => 'octocat',
            'user_id' => $user->id,
            'tier_slug' => 'max',
            'kind' => GithubSponsorship::KIND_ONE_TIME,
            'status' => GithubSponsorship::STATUS_ACTIVE,
            'source' => GithubSponsorship::SOURCE_WEBHOOK,
            'started_at' => now(),
        ]);

        $make = fn (int $slot, array $over = []) => $sponsorship->credits()->create([
            'user_id' => $user->id,
            'kind' => ConsultationCredit::KIND_CALL,
            'consultation_tier_id' => $tier->id,
            'period_start' => today(),
            'slot' => $slot,
            'expires_at' => now()->addDays(10),
            ...$over,
        ]);

        $ok = $make(1);
        $make(2, ['used_at' => now()]);
        $make(3, ['revoked_at' => now()]);
        $make(4, ['expires_at' => now()->subMinute()]);

        $this->assertSame([$ok->id], ConsultationCredit::usable()->pluck('id')->all());
        $this->assertTrue($ok->sponsorship->is($sponsorship));
        $this->assertTrue($ok->tier->is($tier));
        $this->assertTrue($sponsorship->user->is($user));
        $this->assertCount(4, $sponsorship->credits);

        $event = GithubWebhookEvent::create(['delivery_id' => 'abc', 'event' => 'sponsorship', 'action' => 'created', 'payload' => ['a' => 1]]);
        $this->assertSame(['a' => 1], $event->fresh()->payload);
    }
}
