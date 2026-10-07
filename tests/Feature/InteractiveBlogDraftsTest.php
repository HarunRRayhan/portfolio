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
            'eight-load-balancer-algorithms' => 'load-balancer',
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

            if ($slug === 'why-s3-presigned-urls') {
                $this->assertStringContainsString('The Browser button sends the request from the browser', $hydrated['content']['html']);
                $this->assertStringContainsString('The API button signs one URL', $hydrated['content']['html']);
                $this->assertStringNotContainsString('Make the object public', $hydrated['content']['html']);
            }

            if ($slug === 'eight-load-balancer-algorithms') {
                $this->assertSame('Top 8 Load Balancer Algorithms You Should Know About', $post['title']);
                $this->assertStringContainsString('It starts sending when the figure is on screen', $hydrated['content']['html']);
                $this->assertStringContainsString('How one lap lands', $hydrated['content']['html']);
                $this->assertStringContainsString('What round robin decides', $hydrated['content']['html']);
                $this->assertStringNotContainsString('Send one more', $hydrated['content']['html']);
                foreach ([
                    'round-robin',
                    'weighted-round-robin',
                    'least-connections',
                    'weighted-least-connections',
                    'least-response-time',
                    'ip-hash',
                    'consistent-hash',
                    'power-of-two',
                ] as $algorithm) {
                    $this->assertStringContainsString('data-algorithm="'.$algorithm.'"', $hydrated['content']['html']);
                }
            }
        }
    }
}
