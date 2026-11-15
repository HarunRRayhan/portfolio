<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\RoadmapRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapCommentsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: string, 1: string} beginner topic id and its first lesson id */
    private function ids(): array
    {
        $roadmap = (new RoadmapRepository)->find('internet-networking');
        $topic = $roadmap['stages'][0]['topics'][0];

        return [$topic['id'], $topic['lessons'][0]['id']];
    }

    public function test_lesson_page_renders_with_resources_and_neighbours(): void
    {
        [$topic, $lesson] = $this->ids();

        $this->get("/roadmaps/internet-networking/{$topic}/{$lesson}")->assertOk()->assertInertia(fn ($p) => $p
            ->component('Roadmaps/Lesson')
            ->where('lesson.id', $lesson)
            ->where('topic.id', $topic)
            ->has('lesson.resources')
            ->missing('lesson.prompt')
            ->where('prev', null)
            ->has('next.id')
            ->where('comments', [])
            ->has('seo.title'));

        $this->get("/roadmaps/internet-networking/{$topic}/nope")->assertNotFound();
    }

    public function test_guests_cannot_comment(): void
    {
        [$topic, $lesson] = $this->ids();

        $this->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => 'Hello there'])->assertRedirect('/login');
        $this->post("/roadmaps/internet-networking/{$topic}/{$lesson}/comments", ['content' => 'Hello there'])->assertRedirect('/login');
    }

    public function test_comments_are_public_and_threaded(): void
    {
        [$topic, $lesson] = $this->ids();
        $alice = User::factory()->create(['name' => 'Alice', 'email' => 'alice@example.com']);
        $bob = User::factory()->create(['name' => 'Bob']);

        $this->actingAs($alice)->post("/roadmaps/internet-networking/{$topic}/{$lesson}/comments", ['content' => 'Great resources'])->assertRedirect();
        $this->get("/roadmaps/internet-networking/{$topic}/{$lesson}")->assertInertia(fn ($p) => $p
            ->where('comments.0.content', 'Great resources')
            ->where('comments.0.user.name', 'Alice')
            ->missing('comments.0.user.email'));
        $parentId = $this->get("/roadmaps/internet-networking/{$topic}/{$lesson}")->viewData('page')['props']['comments'][0]['id'];

        $this->actingAs($bob)->post("/roadmaps/internet-networking/{$topic}/{$lesson}/comments", ['content' => 'Agreed!', 'parent_id' => $parentId])->assertRedirect();
        $this->get("/roadmaps/internet-networking/{$topic}/{$lesson}")->assertInertia(fn ($p) => $p
            ->where('comments.0.replies.0.content', 'Agreed!')
            ->where('commentCount', 2));

        // Topic and lesson threads are separate.
        $this->get("/roadmaps/internet-networking/{$topic}")->assertInertia(fn ($p) => $p->where('comments', []));
        $this->actingAs($bob)->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => 'Topic note'])->assertRedirect();
        $this->get("/roadmaps/internet-networking/{$topic}")->assertInertia(fn ($p) => $p->where('comments.0.content', 'Topic note'));
    }

    public function test_comment_validation(): void
    {
        [$topic] = $this->ids();
        $user = User::factory()->create();

        $this->actingAs($user)->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => ''])->assertSessionHasErrors('content');
        $this->actingAs($user)->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => str_repeat('a', 3001)])->assertSessionHasErrors('content');
        $this->actingAs($user)->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => 'Reply', 'parent_id' => 999999])->assertStatus(422);
        $this->actingAs($user)->post('/roadmaps/internet-networking/nope/comments', ['content' => 'Hello'])->assertNotFound();
    }

    public function test_only_the_author_or_an_admin_can_delete(): void
    {
        [$topic] = $this->ids();
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($alice)->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => 'Mine']);
        $id = $this->get("/roadmaps/internet-networking/{$topic}")->viewData('page')['props']['comments'][0]['id'];

        $this->actingAs($bob)->delete("/roadmaps/comments/{$id}")->assertForbidden();
        $this->actingAs($alice)->delete("/roadmaps/comments/{$id}")->assertRedirect();
        $this->get("/roadmaps/internet-networking/{$topic}")->assertInertia(fn ($p) => $p->where('comments', []));

        $this->actingAs($alice)->post("/roadmaps/internet-networking/{$topic}/comments", ['content' => 'Again']);
        $id = $this->get("/roadmaps/internet-networking/{$topic}")->viewData('page')['props']['comments'][0]['id'];
        $this->actingAs($admin)->delete("/roadmaps/comments/{$id}")->assertRedirect();
        $this->get("/roadmaps/internet-networking/{$topic}")->assertInertia(fn ($p) => $p->where('comments', []));
    }

    public function test_blog_comments_cannot_be_deleted_through_the_roadmap_route(): void
    {
        $user = User::factory()->create();
        $thread = \App\Models\BlogCommentThread::resolveForPost('x', 'X', 'https://x', 'https://x');
        $comment = $thread->comment('Blog comment', $user);

        $this->actingAs($user)->delete("/roadmaps/comments/{$comment->id}")->assertNotFound();
    }
}
