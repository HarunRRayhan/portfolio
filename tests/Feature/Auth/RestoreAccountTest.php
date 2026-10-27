<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Support\CompleteLogin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class RestoreAccountTest extends TestCase
{
    use RefreshDatabase;

    private function scheduled(): User
    {
        return User::factory()->create(['deletion_scheduled_at' => now()]);
    }

    public function test_signing_in_to_a_deleted_account_offers_restore_then_continues(): void
    {
        $user = $this->scheduled();
        $request = Request::create('/');
        $request->setLaravelSession($this->app['session.store']);

        $response = CompleteLogin::redirect($request, $user, '/profile');
        $this->assertSame(route('account.restore'), $response->getTargetUrl());

        $this->get(route('account.restore'))
            ->assertInertia(fn ($page) => $page->component('Auth/RestoreAccount')
                ->where('purgesOn', now()->addDays(User::RESTORE_DAYS)->toDateString()));

        $this->post(route('account.restore.store'))->assertRedirect(route('agreement.show'));
        $this->assertNull($user->fresh()->deletion_scheduled_at);
        $this->get(route('agreement.show'))->assertRedirect('/profile');
    }

    public function test_deleted_account_cannot_use_account_pages(): void
    {
        $this->actingAs($this->scheduled());

        $this->get(route('profile.edit'))->assertRedirect(route('account.restore'));
        $this->get(route('agreement.show'))->assertRedirect(route('account.restore'));
        $this->getJson(route('passkeys.register-options'))->assertForbidden();
        $this->get(route('blog.index'))->assertOk();
    }

    public function test_a_session_from_before_the_deletion_must_sign_in_again(): void
    {
        $user = $this->scheduled();

        $this->actingAs($user)->get(route('profile.edit'))->assertRedirect(route('account.restore'));
        $this->get(route('account.restore'))->assertRedirect(route('login'));
        $this->assertGuest();

        $this->actingAs($user)->post(route('account.restore.store'))->assertRedirect(route('login'));
        $this->assertNotNull($user->fresh()->deletion_scheduled_at);
    }

    public function test_restore_page_skips_accounts_that_are_not_deleted(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('account.restore'))
            ->assertRedirect(route('agreement.show'));
    }

    public function test_accounts_are_pruned_only_after_the_restore_window(): void
    {
        $user = $this->scheduled();
        $kept = User::factory()->create();

        $this->travel(User::RESTORE_DAYS - 1)->days();
        $this->artisan('model:prune', ['--model' => [User::class]]);
        $this->assertNotNull($user->fresh());

        $this->travel(2)->days();
        $this->artisan('model:prune', ['--model' => [User::class]]);
        $this->assertNull($user->fresh());
        $this->assertNotNull($kept->fresh());
    }
}
