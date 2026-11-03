<?php

namespace Tests\Feature\Admin;

use App\Models\BioLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BioLinkTest extends TestCase
{
    use RefreshDatabase;

    private function payload(string $url): array
    {
        return ['label' => 'L', 'url' => $url, 'icon' => 'link'];
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'terms_accepted_at' => now()]);
    }

    public static function okUrls(): array
    {
        return [['https://x.example'], ['/bio'], ['mailto:a@b.c']];
    }

    public static function badUrls(): array
    {
        return [['javascript:alert(1)'], ['data:text/html,x']];
    }

    #[DataProvider('okUrls')]
    public function test_safe_urls_accepted_on_store_and_update(string $url): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/admin/bio', $this->payload($url))->assertSessionHasNoErrors();
        $link = BioLink::where('url', $url)->firstOrFail();
        $this->actingAs($admin)->put("/admin/bio/{$link->id}", $this->payload($url))->assertSessionHasNoErrors();
    }

    #[DataProvider('badUrls')]
    public function test_unsafe_urls_rejected_on_store_and_update(string $url): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/admin/bio', $this->payload($url))->assertSessionHasErrors('url');
        $this->assertDatabaseMissing('bio_links', ['url' => $url]);

        $link = BioLink::create(['label' => 'L', 'url' => 'https://ok.example', 'icon' => 'link']);
        $this->actingAs($admin)->put("/admin/bio/{$link->id}", $this->payload($url))->assertSessionHasErrors('url');
        $this->assertSame('https://ok.example', $link->fresh()->url);
    }
}
