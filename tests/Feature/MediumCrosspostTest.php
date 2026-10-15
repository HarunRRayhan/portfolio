<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediumCrosspostTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'production-ai-code-review-for-terraform-and-lambda-prs';

    private function admin(): User
    {
        return User::factory()->create(['email_verified_at' => now(), 'role' => 'admin']);
    }

    public function test_only_admin_gets_the_medium_panel_props(): void
    {
        $this->assertNull($this->get('/blog/'.self::SLUG)->assertOk()->viewData('page')['props']['mediumAdmin']);

        $props = $this->actingAs($this->admin())->get('/blog/'.self::SLUG)->assertOk()->viewData('page')['props'];

        $this->assertStringEndsWith('/blog/'.self::SLUG, $props['mediumAdmin']['postUrl']);
        $this->assertNull($props['mediumAdmin']['publishedUrl']);
    }

    public function test_admin_records_the_medium_link_and_it_comes_back(): void
    {
        $admin = $this->admin();
        $url = 'https://medium.com/@harun/how-i-review-terraform-prs-abc123';

        $this->actingAs($admin)->post('/admin/posts/'.self::SLUG.'/medium', ['url' => $url])->assertRedirect();

        $this->assertDatabaseHas('blog_crossposts', ['slug' => self::SLUG, 'platform' => 'medium', 'remote_url' => $url]);
        $props = $this->actingAs($admin)->get('/blog/'.self::SLUG)->viewData('page')['props'];
        $this->assertSame($url, $props['mediumAdmin']['publishedUrl']);
    }

    public function test_rejects_non_medium_urls_and_non_admins(): void
    {
        $this->actingAs($this->admin())->post('/admin/posts/'.self::SLUG.'/medium', ['url' => 'https://evil.example/medium.com/'])->assertSessionHasErrors('url');

        $user = User::factory()->create(['email_verified_at' => now()]);
        $this->actingAs($user)->post('/admin/posts/'.self::SLUG.'/medium', ['url' => 'https://medium.com/@a/b'])->assertForbidden();
        $this->assertDatabaseCount('blog_crossposts', 0);
    }
}
