<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ClientIpTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Route::middleware('web')->get('/_ip', fn (Request $r) => $r->ip());
    }

    public function test_cf_connecting_ip_is_the_client_ip(): void
    {
        $this->get('/_ip', ['CF-Connecting-IP' => '203.0.113.9'])->assertSee('203.0.113.9');
    }

    public function test_forged_x_forwarded_for_is_ignored(): void
    {
        $this->get('/_ip', ['X-Forwarded-For' => '198.51.100.7'])->assertDontSee('198.51.100.7');
    }

    public function test_invalid_cf_header_is_ignored(): void
    {
        $this->get('/_ip', ['CF-Connecting-IP' => 'not-an-ip'])->assertDontSee('not-an-ip');
    }

    public function test_throttle_cannot_be_evaded_with_forged_x_forwarded_for(): void
    {
        $last = null;
        for ($i = 0; $i < 31; $i++) {
            $last = $this->postJson('/bio/click', [], ['X-Forwarded-For' => "198.51.100.$i"]);
        }
        $last->assertStatus(429);
    }

    public function test_throttle_is_keyed_on_cf_connecting_ip(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/bio/click', [], ['CF-Connecting-IP' => '203.0.113.1']);
        }
        $this->postJson('/bio/click', [], ['CF-Connecting-IP' => '203.0.113.1'])->assertStatus(429);
        $this->postJson('/bio/click', [], ['CF-Connecting-IP' => '203.0.113.2'])->assertStatus(422);
    }
}
