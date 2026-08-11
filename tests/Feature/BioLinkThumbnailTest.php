<?php

namespace Tests\Feature;

use App\Models\BioLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BioLinkThumbnailTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'admin',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'label' => 'Portfolio',
            'url' => 'https://example.com',
            'icon' => 'link',
            'tab' => 'default',
            'is_active' => true,
        ], $overrides);
    }

    public function test_store_rejects_a_non_image_thumbnail(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/bio', $this->payload([
            'thumbnail' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
        ]));

        $response->assertSessionHasErrors('thumbnail');
        $this->assertDatabaseCount('bio_links', 0);
    }

    public function test_store_rejects_a_thumbnail_over_two_megabytes(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/bio', $this->payload([
            'thumbnail' => UploadedFile::fake()->image('cover.jpg')->size(2049),
        ]));

        $response->assertSessionHasErrors('thumbnail');
        $this->assertDatabaseCount('bio_links', 0);
    }

    public function test_store_saves_the_thumbnail_and_featured_flag(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/bio', $this->payload([
            'thumbnail' => UploadedFile::fake()->image('cover.jpg')->size(500),
            'featured' => true,
        ]));

        $response->assertRedirect(route('admin.bio.index'));

        $link = BioLink::sole();
        $this->assertTrue($link->featured);
        $this->assertNotNull($link->thumbnail_path);
        Storage::disk('public')->assertExists($link->thumbnail_path);
    }

    public function test_update_replacing_the_thumbnail_deletes_the_old_file(): void
    {
        Storage::fake('public');

        $link = BioLink::create($this->payload([
            'thumbnail_path' => 'bio-thumbnails/old.jpg',
        ]));
        Storage::disk('public')->put('bio-thumbnails/old.jpg', 'stub');

        $response = $this->actingAs($this->admin())->post("/admin/bio/{$link->id}", $this->payload([
            '_method' => 'put',
            'thumbnail' => UploadedFile::fake()->image('new.jpg')->size(500),
        ]));

        $response->assertRedirect(route('admin.bio.index'));

        $link->refresh();
        Storage::disk('public')->assertMissing('bio-thumbnails/old.jpg');
        Storage::disk('public')->assertExists($link->thumbnail_path);
        $this->assertNotSame('bio-thumbnails/old.jpg', $link->thumbnail_path);
    }

    public function test_update_with_remove_thumbnail_deletes_the_file_and_clears_the_column(): void
    {
        Storage::fake('public');

        $link = BioLink::create($this->payload([
            'thumbnail_path' => 'bio-thumbnails/old.jpg',
            'featured' => true,
        ]));
        Storage::disk('public')->put('bio-thumbnails/old.jpg', 'stub');

        $response = $this->actingAs($this->admin())->post("/admin/bio/{$link->id}", $this->payload([
            '_method' => 'put',
            'remove_thumbnail' => true,
        ]));

        $response->assertRedirect(route('admin.bio.index'));

        $link->refresh();
        Storage::disk('public')->assertMissing('bio-thumbnails/old.jpg');
        $this->assertNull($link->thumbnail_path);
        $this->assertNull($link->thumbnail_url);
    }

    public function test_destroy_deletes_the_thumbnail_file(): void
    {
        Storage::fake('public');

        $link = BioLink::create($this->payload([
            'thumbnail_path' => 'bio-thumbnails/old.jpg',
        ]));
        Storage::disk('public')->put('bio-thumbnails/old.jpg', 'stub');

        $response = $this->actingAs($this->admin())->delete("/admin/bio/{$link->id}");

        $response->assertRedirect(route('admin.bio.index'));
        Storage::disk('public')->assertMissing('bio-thumbnails/old.jpg');
        $this->assertDatabaseCount('bio_links', 0);
    }

    public function test_bio_page_exposes_thumbnail_url_and_featured_for_a_featured_link(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('bio-thumbnails/hero.jpg', 'stub');

        BioLink::create($this->payload([
            'label' => 'Featured link',
            'thumbnail_path' => 'bio-thumbnails/hero.jpg',
            'featured' => true,
        ]));

        $response = $this->get('/bio');

        $response->assertOk();
        $link = collect($response->viewData('page')['props']['links'])
            ->firstWhere('label', 'Featured link');

        $this->assertNotNull($link);
        $this->assertTrue($link['featured']);
        $this->assertStringContainsString('bio-thumbnails/hero.jpg', $link['thumbnail_url']);
    }

    public function test_a_new_bio_link_defaults_to_english_locale(): void
    {
        $this->actingAs($this->admin())->post('/admin/bio', $this->payload());

        $this->assertDatabaseHas('bio_links', ['label' => 'Portfolio', 'locale' => 'en']);
    }

    public function test_locale_can_be_set_to_bangla_on_update(): void
    {
        $this->actingAs($this->admin())->post('/admin/bio', $this->payload());
        $link = \App\Models\BioLink::first();

        $this->actingAs($this->admin())
            ->post("/admin/bio/{$link->id}", array_merge($this->payload(), [
                '_method' => 'put',
                'locale' => 'bn',
            ]));

        $this->assertSame('bn', $link->fresh()->locale);
    }

    public function test_an_empty_string_locale_still_creates_with_the_english_default(): void
    {
        $response = $this->actingAs($this->admin())->post('/admin/bio', $this->payload(['locale' => '']));

        $response->assertRedirect(route('admin.bio.index'));
        $this->assertDatabaseHas('bio_links', ['label' => 'Portfolio', 'locale' => 'en']);
    }

    public function test_an_invalid_locale_is_rejected(): void
    {
        $response = $this->actingAs($this->admin())->post('/admin/bio', $this->payload(['locale' => 'fr']));

        $response->assertSessionHasErrors('locale');
        $this->assertDatabaseCount('bio_links', 0);
    }
}
