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

            if ($slug === 'eight-load-balancer-algorithms') {
                $this->assertSame('18 Load Balancer Algorithms You Should Know Cold', $post['title']);
                foreach ([
                    'round-robin',
                    'weighted-round-robin',
                    'least-connections',
                    'weighted-least-connections',
                    'least-response-time',
                    'ip-hash',
                    'consistent-hash',
                    'power-of-two',
                    'random',
                    'weighted-random',
                    'least-bandwidth',
                    'cookie-affinity',
                    'maglev',
                    'rendezvous',
                    'ip-port-hash',
                    'priority-failover',
                    'header-hash',
                    'peak-ewma',
                ] as $algorithm) {
                    $this->assertStringContainsString('data-algorithm="'.$algorithm.'"', $hydrated['content']['html']);
                }
            }
        }
    }
}
