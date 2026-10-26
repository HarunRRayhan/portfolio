<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_password_login_route_is_gone(): void
    {
        $this->post('/login', ['email' => 'a@example.com', 'password' => 'password'])->assertStatus(405);
    }

    public function test_register_redirects_to_login(): void
    {
        $this->get('/register?redirect=%2Fconsultation')->assertStatus(301)->assertRedirect('/login?redirect=%2Fconsultation');
    }

    public function test_password_reset_routes_are_gone(): void
    {
        $this->get('/forgot-password')->assertNotFound();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
