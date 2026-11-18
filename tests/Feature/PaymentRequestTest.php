<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\PaymentRequestMail;
use App\Models\PaymentRequest;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use App\Support\RoadmapAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['mail.owner.address' => 'owner@example.test', 'sponsors.bank_details' => "Bank X\nAcct 123"]);
        Mail::fake();
    }

    private function payload(array $over = []): array
    {
        return array_merge(['name' => 'Rahim', 'email' => 'Rahim@Example.com', 'country' => 'BD', 'plan' => 'yearly', 'method' => 'bank', 'note' => ''], $over);
    }

    public function test_form_prefills_signed_in_user_and_country(): void
    {
        $user = User::factory()->create(['name' => 'Ada', 'email' => 'ada@example.com', 'terms_accepted_at' => now()]);
        $this->actingAs($user)->withHeader('Cf-Ipcountry', 'BD')->get('/sponsor-me/pay')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Sponsor/Pay')->where('prefill', ['name' => 'Ada', 'email' => 'ada@example.com', 'country' => 'BD']));
        $this->get('/sponsor-me/pay')->assertOk();
    }

    public function test_bank_flow_from_request_to_approval_unlocks_access(): void
    {
        $this->post('/sponsor-me/pay', $this->payload())->assertRedirect();
        $r = PaymentRequest::sole();
        $this->assertSame('rahim@example.com', $r->email);
        Mail::assertSent(PaymentRequestMail::class, fn ($m) => $m->kind === 'received' && $m->hasTo('rahim@example.com'));
        Mail::assertSent(PaymentRequestMail::class, fn ($m) => $m->kind === 'owner' && $m->hasTo('owner@example.test'));

        // The private link works; a bare URL does not.
        $this->get("/sponsor-me/pay/{$r->public_id}")->assertForbidden();
        $this->get($r->url())->assertOk()->assertInertia(fn (Assert $p) => $p->component('Sponsor/PayRequest')->where('request.status', 'new')->where('bankDetails', "Bank X\nAcct 123"));
        $this->get('/sponsor-me/pay')->assertDontSee('Acct 123');

        $paidUrl = \URL::signedRoute('sponsor.pay.paid', ['paymentRequest' => $r->public_id]);
        $this->post($paidUrl, ['transaction_id' => '<bad>', 'payer_account' => ''])->assertSessionHasErrors(['transaction_id', 'payer_account']);
        $this->post($paidUrl, ['transaction_id' => 'FT2611 8842/BD', 'payer_account' => 'Rahim Uddin, DBBL'])->assertRedirect();
        $this->assertSame('paid', $r->fresh()->status);

        // Admin approves; the account with that email gets paid access.
        $user = User::factory()->create(['email' => 'rahim@example.com', 'email_verified_at' => now()]);
        $this->assertFalse(RoadmapAccess::canAccessPaid($user));
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now(), 'terms_accepted_at' => now()]);
        $this->actingAs($admin)->get('/admin/roadmap-access')->assertInertia(fn (Assert $p) => $p->where('requests.0.transaction_id', 'FT2611 8842/BD'));
        $this->actingAs($admin)->post("/admin/roadmap-access/requests/{$r->public_id}/approve", ['plan' => 'lifetime'])->assertRedirect();

        $r->refresh();
        $this->assertSame('approved', $r->status);
        $this->assertSame(2099, $r->grant->expires_at->year);
        $this->assertTrue(RoadmapAccess::canAccessPaid($user));
        Mail::assertSent(PaymentRequestMail::class, fn ($m) => $m->kind === 'approved' && $m->hasTo('rahim@example.com'));

        foreach (['received' => 'Acct 123', 'owner' => 'FT2611 8842/BD', 'approved' => 'Lifetime'] as $kind => $text) {
            $this->assertStringContainsString($text, (new PaymentRequestMail($r, $kind))->render());
        }

        // Closed requests take no more payment details.
        $this->post($paidUrl, ['transaction_id' => 'X1', 'payer_account' => 'x'])->assertStatus(409);
    }

    public function test_bank_is_only_for_bangladesh_and_other_needs_a_note(): void
    {
        $this->post('/sponsor-me/pay', $this->payload(['country' => 'IN']))->assertSessionHasErrors('method');
        $this->post('/sponsor-me/pay', $this->payload(['country' => 'IN', 'method' => 'other', 'note' => 'UPI']))->assertRedirect();
        $this->assertSame('other', PaymentRequest::sole()->method);
    }

    public function test_signed_in_requester_can_open_own_request_without_the_link(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $this->actingAs($user)->post('/sponsor-me/pay', $this->payload())->assertRedirect();
        $r = PaymentRequest::sole();
        $this->actingAs($user)->get("/sponsor-me/pay/{$r->public_id}")->assertOk();
        $this->actingAs(User::factory()->create(['terms_accepted_at' => now()]))->get("/sponsor-me/pay/{$r->public_id}")->assertForbidden();
    }

    public function test_admin_can_grant_by_plan_directly_and_only_admins_approve(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now(), 'terms_accepted_at' => now()]);
        $this->actingAs($admin)->post('/admin/roadmap-access', ['email' => 'Someone@Example.com', 'plan' => 'monthly'])->assertRedirect();
        $grant = RoadmapAccessGrant::sole();
        $this->assertSame('someone@example.com', $grant->email);
        $this->assertTrue($grant->expires_at->between(now()->addMonth()->subDay(), now()->addMonth()->addDay()));

        $this->post('/sponsor-me/pay', $this->payload());
        $r = PaymentRequest::sole();
        $user = User::factory()->create(['email_verified_at' => now(), 'terms_accepted_at' => now()]);
        $this->actingAs($user)->post("/admin/roadmap-access/requests/{$r->public_id}/approve", ['plan' => 'yearly'])->assertForbidden();
        $this->actingAs($admin)->post("/admin/roadmap-access/requests/{$r->public_id}/decline")->assertRedirect();
        $this->assertSame('declined', $r->fresh()->status);
    }
}
