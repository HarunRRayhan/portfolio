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
                $this->assertSame('Why You Should Use S3 Presigned URLs to Upload Big Static Files', $post['title']);
                $this->assertStringContainsString('Choose Browser or API and it stays on that side', $hydrated['content']['html']);
                $this->assertStringContainsString('creates the multipart upload and signs the part URLs', $hydrated['content']['html']);
                $this->assertStringContainsString('Why the API should not carry the file', $hydrated['content']['html']);
                $this->assertStringContainsString('The requests that make a multipart cycle', $hydrated['content']['html']);
                $this->assertStringContainsString('hrr_createMultipartUpload', $hydrated['content']['html']);
                $this->assertStringContainsString('hrr_uploadVideoParts', $hydrated['content']['html']);
                $this->assertStringContainsString('2 GB', $hydrated['content']['html']);
                $this->assertStringContainsString('Is this secure?', $hydrated['content']['html']);
                $this->assertStringContainsString('<h2>How?</h2>', $hydrated['content']['html']);
                $this->assertStringContainsString('href="https://x.com/harundotdev"', $hydrated['content']['html']);
                $this->assertStringContainsString('href="https://harun.dev/bio"', $hydrated['content']['html']);
                $this->assertStringContainsString('target="_blank"', $hydrated['content']['html']);
                $this->assertStringContainsString('rel="noopener noreferrer"', $hydrated['content']['html']);
                $this->assertStringNotContainsString('Who can fetch the object', $hydrated['content']['html']);
                $this->assertStringNotContainsString('Make the object public', $hydrated['content']['html']);
                $this->assertStringNotContainsString('—', $hydrated['content']['html']);
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

            if ($slug === 'why-rust-is-faster-than-python-javascript-php-and-go') {
                $this->assertSame('Why Rust Finishes That Loop Before Python, PHP, JavaScript, and Go', $post['title']);
                $this->assertStringContainsString('The race starts when the block is on screen', $hydrated['content']['html']);
                $this->assertStringContainsString('At 1× it is a crawl on purpose', $hydrated['content']['html']);
                $this->assertStringContainsString('Slide toward 100× when you want Rust to look unfairly fast', $hydrated['content']['html']);
                $this->assertStringContainsString('left to right, then back left again', $hydrated['content']['html']);
                $this->assertStringContainsString('Relative speed', $hydrated['content']['html']);
                $this->assertStringContainsString('>115×</td>', $hydrated['content']['html']);
                $this->assertStringContainsString('>53×</td>', $hydrated['content']['html']);
                $this->assertStringContainsString('>13×</td>', $hydrated['content']['html']);
                $this->assertStringContainsString('>3×</td>', $hydrated['content']['html']);
                $this->assertStringContainsString('Each ball runs left to right, then back left again', $hydrated['content']['html']);
                $this->assertStringContainsString('What the model is measuring', $hydrated['content']['html']);
                $this->assertStringContainsString('When the chart lies', $hydrated['content']['html']);
                $this->assertStringContainsString('href="https://x.com/harundotdev"', $hydrated['content']['html']);
                $this->assertStringContainsString('href="https://harun.dev/bio"', $hydrated['content']['html']);
                $this->assertStringContainsString('target="_blank"', $hydrated['content']['html']);
                $this->assertStringContainsString('rel="noopener noreferrer"', $hydrated['content']['html']);
                $this->assertStringNotContainsString('Relative speed vs Python', $hydrated['content']['html']);
                $this->assertStringNotContainsString('~40×', $hydrated['content']['html']);
                $this->assertStringNotContainsString('<th>Finish</th>', $hydrated['content']['html']);
                $this->assertStringNotContainsString('data-activity-play', $hydrated['content']['html']);
                $this->assertStringNotContainsString('—', $hydrated['content']['html']);
            }

            if ($slug === 'terraform-or-pulumi') {
                $this->assertSame('Terraform or Pulumi, Pick From the Team You Have', $post['title']);
                $this->assertStringContainsString('The two terminals below run that deploy side by side', $hydrated['content']['html']);
                $this->assertStringContainsString('The loop is the product', $hydrated['content']['html']);
                $this->assertStringContainsString('The Terraform state caveat', $hydrated['content']['html']);
                $this->assertStringContainsString('The Pulumi equivalent', $hydrated['content']['html']);
                $this->assertStringContainsString('stack state', $hydrated['content']['html']);
                $this->assertStringContainsString('Which one should you pick?', $hydrated['content']['html']);
                $this->assertStringContainsString('/images/logos/tech/terraformio-icon.svg', $hydrated['content']['html']);
                $this->assertStringContainsString('/images/logos/tech/pulumi-logo.svg', $hydrated['content']['html']);
                $this->assertStringContainsString('href="https://x.com/harundotdev"', $hydrated['content']['html']);
                $this->assertStringContainsString('href="https://harun.dev/bio"', $hydrated['content']['html']);
                $this->assertStringContainsString('target="_blank"', $hydrated['content']['html']);
                $this->assertStringContainsString('rel="noopener noreferrer"', $hydrated['content']['html']);
                $this->assertStringNotContainsString('Choose Terraform or Pulumi and it stays on that side', $hydrated['content']['html']);
                $this->assertStringNotContainsString('—', $hydrated['content']['html']);
            }
        }
    }
}
