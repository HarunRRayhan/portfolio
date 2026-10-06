<?php

namespace Tests\Feature;

use App\Support\BlogRepository;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class InteractiveBlogDraftsTest extends TestCase
{
    public function test_interactive_drafts_stay_unpublished_and_mount_their_figures(): void
    {
        $repository = app(BlogRepository::class);
        $expected = [
            'five-load-balancer-algorithms' => 'load-balancer',
            'why-s3-presigned-urls' => 's3-presigned-url',
            'terraform-or-pulumi' => 'terraform-vs-pulumi',
            'why-rust-is-faster-than-python-javascript-php-and-go' => 'language-race',
        ];

        foreach ($expected as $slug => $activity) {
            $post = $repository->find($slug);
            $this->assertIsArray($post, $slug);
            $this->assertTrue($post['draft'], $slug);
            $this->assertTrue(Carbon::parse($post['publishedAt'])->greaterThan(now()), $slug);
            $hydrated = $repository->withContent($post);
            $this->assertStringContainsString(
                'data-blog-activity="'.$activity.'"',
                $hydrated['content']['html'],
                $slug,
            );
        }
    }
}
