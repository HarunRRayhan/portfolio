<?php

namespace Tests\Feature;

use App\Models\BlogCommentThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BlogCommentTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_initializes_a_comment_thread_when_rendering_a_blog_post(): void
    {
        $response = $this->get('/blog/github-actions-lambda-terraform-cicd');

        $response->assertOk();

        $this->assertDatabaseHas('blog_comment_threads', [
            'slug' => 'github-actions-lambda-terraform-cicd',
            'title' => 'How I Set Up CI/CD for AWS Lambda and Terraform with GitHub Actions',
        ]);
    }

    #[Test]
    public function it_redirects_guests_to_login_when_commenting(): void
    {
        $response = $this->post('/blog/github-actions-lambda-terraform-cicd/comments', [
            'content' => 'Great post!',
        ]);

        $response->assertRedirect('/login');
    }

    #[Test]
    public function it_stores_a_comment_for_authenticated_users(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/blog/github-actions-lambda-terraform-cicd/comments', [
            'content' => 'Great write-up on the deployment flow.',
        ]);

        $response->assertRedirect('/blog/github-actions-lambda-terraform-cicd#discussion');

        $thread = BlogCommentThread::where('slug', 'github-actions-lambda-terraform-cicd')->firstOrFail();

        $this->assertSame(1, $thread->commentCount());
        $this->assertDatabaseHas('comments', [
            'commentable_type' => BlogCommentThread::class,
            'commentable_id' => $thread->id,
            'user_id' => $user->id,
            'content' => 'Great write-up on the deployment flow.',
        ]);
    }
}
