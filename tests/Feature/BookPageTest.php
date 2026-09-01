<?php

namespace Tests\Feature;

use App\Models\ConsultationTier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_book_page_renders_tiers(): void
    {
        $this->assertGreaterThanOrEqual(3, ConsultationTier::query()->count());

        $response = $this->get('/book');

        $response->assertOk();
        $response->assertSee('<meta name="csrf-token"', false);
        $response->assertInertia(fn ($page) => $page
            ->component('Book')
            ->has('tiers', 3));
    }
}
