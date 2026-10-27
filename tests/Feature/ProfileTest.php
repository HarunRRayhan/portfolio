<?php

namespace Tests\Feature;

use App\Mail\AccountDeletionScheduledMail;
use App\Models\ConsultationBooking;
use App\Models\ConsultationTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $user->createToken('integration');

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'confirm_email' => strtoupper($user->email),
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNotNull($user->fresh()->deletion_scheduled_at);
        $this->assertSame(0, $user->tokens()->count());
        Mail::assertSent(AccountDeletionScheduledMail::class, fn ($mail) => $mail->hasTo($user->email)
            && $mail->purgesOn === now()->addDays(User::RESTORE_DAYS)->toDateString()
            && str_contains($mail->render(), 'Restore my account'));
    }

    public function test_account_is_still_deleted_when_the_notice_cannot_be_sent(): void
    {
        Mail::shouldReceive('to->send')->andThrow(new \RuntimeException('SMTP down'));
        $user = User::factory()->create();

        $this->actingAs($user)
            ->delete('/profile', ['confirm_email' => $user->email])
            ->assertRedirect('/');

        $this->assertNotNull($user->fresh()->deletion_scheduled_at);
    }

    public function test_only_admins_are_flagged_as_admin_to_the_frontend(): void
    {
        $this->actingAs(User::factory()->create())->get('/profile')
            ->assertInertia(fn ($page) => $page->where('auth.isAdmin', false));
        $this->actingAs(User::factory()->create(['role' => 'admin']))->get('/profile')
            ->assertInertia(fn ($page) => $page->where('auth.isAdmin', true));
    }

    public function test_deleting_account_keeps_bookings(): void
    {
        $user = User::factory()->create();
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        $booking = ConsultationBooking::create([
            'user_id' => $user->id,
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Client',
            'client_email' => $user->email,
            'starts_at' => now()->addWeek(),
            'ends_at' => now()->addWeek()->addHour(),
            'status' => ConsultationBooking::STATUS_PENDING_APPROVAL,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'access_token_hash' => hash('sha256', 'keep-me'),
        ]);

        $this->actingAs($user)
            ->delete('/profile', ['confirm_email' => $user->email])
            ->assertSessionHasNoErrors();
        $this->travel(User::RESTORE_DAYS + 1)->days();
        $this->artisan('model:prune', ['--model' => [User::class]])->assertSuccessful();

        $this->assertNull($user->fresh());
        $this->assertNotNull($booking->fresh());
        $this->assertNull($booking->fresh()->user_id);
    }

    public function test_matching_email_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'confirm_email' => 'someone-else@example.com',
            ]);

        $response
            ->assertSessionHasErrors('confirm_email')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }

    public function test_array_confirm_email_is_a_validation_error(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->deleteJson('/profile', ['confirm_email' => ['x']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('confirm_email');

        $this->assertNotNull($user->fresh());
    }
}
