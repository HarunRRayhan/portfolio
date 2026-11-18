<?php

namespace Tests\Feature;

use App\Models\BlogCommentThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Support\CreatesDraftBlogPost;
use Tests\TestCase;

class BlogCommentTest extends TestCase
{
    use CreatesDraftBlogPost;
    use RefreshDatabase;

    #[Test]
    public function it_initializes_a_comment_thread_when_rendering_a_blog_post(): void
    {
        $response = $this->get('/blog/github-actions-lambda-terraform-cicd');

        $response->assertOk();

        $this->assertDatabaseHas('blog_comment_threads', [
            'slug' => 'github-actions-lambda-terraform-cicd',
            'title' => 'GitHub Actions + Terraform CI/CD for AWS Lambda with OIDC',
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

    #[Test]
    public function it_blocks_comments_on_draft_posts(): void
    {
        $draft = $this->createDraftBlogPost();
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/blog/'.$draft['slug'].'/comments', [
            'content' => 'This is a draft comment.',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseMissing('comments', [
            'content' => 'This is a draft comment.',
        ]);
    }

    #[Test]
    public function comments_are_public_without_emails(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Writer', 'email' => 'alice@example.com']);
        $this->actingAs($alice)->post('/blog/github-actions-lambda-terraform-cicd/comments', ['content' => 'Public note'])->assertRedirect();
        auth()->logout();

        $this->get('/blog/github-actions-lambda-terraform-cicd')->assertOk()
            ->assertDontSee('alice@example.com')
            ->assertInertia(fn ($p) => $p
                ->where('commentCount', 1)
                ->where('comments.0.content', 'Public note')
                ->where('comments.0.user.name', 'Alice Writer')
                ->where('comments.0.user.profile', $alice->fresh()->profileHandle())
                ->missing('comments.0.user.email')
                ->missing('comments.0.user.id'));

        $this->actingAs(User::factory()->create())->get('/blog/github-actions-lambda-terraform-cicd')
            ->assertInertia(fn ($p) => $p->where('comments.0.content', 'Public note'));

        // Going anonymous takes effect on cached comments right away.
        $alice->forceFill(['terms_accepted_at' => now()])->save();
        $this->actingAs($alice)->patch('/profile/public', ['anonymous' => true])->assertRedirect();
        auth()->logout();
        $this->get('/blog/github-actions-lambda-terraform-cicd')->assertDontSee('Alice Writer')
            ->assertInertia(fn ($p) => $p->where('comments.0.user.name', $alice->fresh()->anon_name));
    }
}
