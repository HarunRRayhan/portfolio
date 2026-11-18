<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_is_public_by_default_and_never_shows_email(): void
    {
        $user = User::factory()->create(['name' => 'Ada Lovelace', 'email' => 'ada@example.com', 'avatar_url' => 'https://example.com/ada.png', 'bio' => 'Learning AWS']);
        $this->assertMatchesRegularExpression('/^[a-z0-9]{10}$/', $user->profile_slug);

        $this->get("/u/{$user->profile_slug}")->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
            ->assertDontSee('ada@example.com')
            ->assertInertia(fn (Assert $p) => $p->component('Profile/Show')
                ->where('profile.name', 'Ada Lovelace')
                ->where('profile.avatarUrl', 'https://example.com/ada.png')
                ->where('profile.bio', 'Learning AWS')
                ->where('profile.xp', 50)
                ->where('profile.rank', 1)
                ->where('isOwner', false)
                ->where('admin', null));

        $this->get('/u/nosuchuser')->assertNotFound();
    }

    public function test_anonymous_hides_name_and_picture_and_changes_the_link(): void
    {
        $user = User::factory()->create(['name' => 'Ada Lovelace', 'avatar_url' => 'https://example.com/ada.png', 'terms_accepted_at' => now()]);
        $oldSlug = $user->profile_slug;

        $this->actingAs($user)->patch('/profile/public', ['bio' => '  Hi  ', 'anonymous' => true])->assertRedirect();
        $user->refresh();
        $this->assertTrue($user->anonymous);
        $this->assertMatchesRegularExpression('/^[A-Z][a-z]+ [A-Z][a-z]+$/', $user->anon_name);
        $this->assertNotSame($oldSlug, $user->profile_slug);
        $this->assertSame('Hi', $user->bio);

        auth()->logout();
        $this->get("/u/{$oldSlug}")->assertNotFound();
        $this->get("/u/{$user->profile_slug}")->assertDontSee('Ada Lovelace')->assertInertia(fn (Assert $p) => $p
            ->where('profile.name', $user->anon_name)->where('profile.avatarUrl', null)->where('profile.anonymous', true));
        $this->get('/leaderboard')->assertInertia(fn (Assert $p) => $p
            ->where('rows.0.name', $user->anon_name)->where('rows.0.avatar_url', null)->where('rows.0.profile', $user->profile_slug));

        // Keeping the same anonymous name when switching back and forth.
        $name = $user->anon_name;
        $user->setAnonymous(false);
        $user->setAnonymous(true);
        $this->assertSame($name, $user->fresh()->anon_name);
    }

    public function test_admin_sees_email_and_account_details(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'terms_accepted_at' => now()]);
        $user = User::factory()->create(['name' => 'Ada', 'email' => 'ada@example.com']);
        $user->setAnonymous(true);

        $this->actingAs($admin)->get('/u/'.$user->fresh()->profile_slug)->assertInertia(fn (Assert $p) => $p
            ->where('admin.email', 'ada@example.com')
            ->where('admin.name', 'Ada'));
    }

    public function test_owner_sees_edit_link_and_deleted_accounts_are_gone(): void
    {
        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $this->actingAs($user)->get("/u/{$user->profile_slug}")->assertInertia(fn (Assert $p) => $p->where('isOwner', true));

        $user->forceFill(['deletion_scheduled_at' => now()])->save();
        auth()->logout();
        $this->get("/u/{$user->profile_slug}")->assertNotFound();
    }

    public function test_bio_is_validated_and_needs_an_account(): void
    {
        $this->patch('/profile/public', ['bio' => 'x', 'anonymous' => false])->assertRedirect('/login');
        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $this->actingAs($user)->patch('/profile/public', ['bio' => str_repeat('x', 281), 'anonymous' => false])->assertSessionHasErrors('bio');
    }

    public function test_username_becomes_the_profile_link_but_not_while_anonymous(): void
    {
        $user = User::factory()->create(['name' => 'Ada', 'terms_accepted_at' => now()]);
        $other = User::factory()->create(['username' => 'taken']);

        $this->actingAs($user)->patch('/profile/public', ['username' => 'Ada_L', 'bio' => null, 'anonymous' => false])->assertSessionHasNoErrors();
        $this->assertSame('ada_l', $user->fresh()->username);
        foreach (['taken', '1abc', 'ab', 'has-dash', $other->profile_slug] as $bad) {
            $this->actingAs($user)->patch('/profile/public', ['username' => $bad, 'anonymous' => false])->assertSessionHasErrors('username');
        }

        $this->get('/u/ada_l')->assertOk()->assertInertia(fn (Assert $p) => $p->where('profile.name', 'Ada'));
        $this->get("/u/{$user->fresh()->profile_slug}")->assertOk();
        $this->get('/leaderboard')->assertInertia(fn (Assert $p) => $p->where('rows.0.profile', fn ($v) => in_array($v, ['ada_l', 'taken', $other->profile_slug], true)));

        $this->actingAs($user)->patch('/profile/public', ['username' => 'ada_l', 'anonymous' => true]);
        auth()->logout();
        $this->get('/u/ada_l')->assertNotFound();
        $this->assertSame($user->fresh()->profile_slug, $user->fresh()->profileHandle());
    }
}
