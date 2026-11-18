<?php

namespace Tests\Feature;

use App\Models\BlogCommentThread;
use App\Models\RoadmapAccessGrant;
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
            ->has('next.topicTitle')
            ->where('siblings.0.id', $lesson)
            ->where('siblings.0.done', false)
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
            ->where('comments.0.user.name', 'Al•••') // a name that is just the email's local part is masked
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

        // The roadmap counts every comment under it.
        $this->get('/roadmaps/internet-networking')->assertInertia(fn ($p) => $p->where('discussionCount', 3)->where('commentCount', 0));

        // Anonymous authors show their anonymous name and no picture.
        $alice->forceFill(['avatar_url' => 'https://example.com/a.png'])->save();
        $alice->setAnonymous(true);
        $this->get("/roadmaps/internet-networking/{$topic}/{$lesson}")->assertInertia(fn ($p) => $p
            ->where('comments.0.user.name', $alice->fresh()->anon_name)
            ->where('comments.0.user.avatarUrl', null)
            ->where('comments.0.user.profile', $alice->fresh()->profile_slug));
    }

    public function test_roadmap_has_its_own_discussion(): void
    {
        $this->post('/roadmaps/internet-networking/comments', ['content' => 'Hi'])->assertRedirect('/login');
        $this->post('/roadmaps/not-a-roadmap/comments', ['content' => 'Hi'])->assertRedirect('/login');

        $user = User::factory()->create(['terms_accepted_at' => now()]);
        $this->actingAs($user)->post('/roadmaps/internet-networking/comments', ['content' => 'Great path'])->assertRedirect();
        $this->actingAs($user)->post('/roadmaps/not-a-roadmap/comments', ['content' => 'Hi'])->assertNotFound();

        auth()->logout();
        $this->get('/roadmaps/internet-networking')->assertInertia(fn ($p) => $p->where('comments.0.content', 'Great path')->where('commentCount', 1));
        $this->assertDatabaseHas('xp_awards', ['user_id' => $user->id, 'key' => 'comment:roadmap/internet-networking']);
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

    public function test_paid_topic_comments_need_access(): void
    {
        $roadmap = (new RoadmapRepository)->find('internet-networking');
        $topic = $roadmap['stages'][1]['topics'][0];
        $lesson = $topic['lessons'][0]['id'];
        $base = "/roadmaps/internet-networking/{$topic['id']}";
        $free = User::factory()->create(['email' => 'free@example.com']);

        $this->actingAs($free)->post("{$base}/comments", ['content' => 'Hi'])->assertForbidden();
        $this->actingAs($free)->post("{$base}/{$lesson}/comments", ['content' => 'Hi'])->assertForbidden();

        RoadmapAccessGrant::create(['email' => 'sponsor@example.com', 'expires_at' => now()->addDay()]);
        $sponsor = User::factory()->create(['email' => 'sponsor@example.com']);
        $this->actingAs($sponsor)->post("{$base}/{$lesson}/comments", ['content' => 'Paid tip'])->assertRedirect();

        $this->actingAs($sponsor)->get("{$base}/{$lesson}")->assertInertia(fn ($p) => $p->where('comments.0.content', 'Paid tip'));
        $this->actingAs($free)->get("{$base}/{$lesson}")->assertRedirect('/roadmaps/internet-networking#unlock');
        $this->get("{$base}/{$lesson}")->assertDontSee('Paid tip');
    }

    public function test_blog_comments_cannot_be_deleted_through_the_roadmap_route(): void
    {
        $user = User::factory()->create();
        $thread = BlogCommentThread::resolveForPost('x', 'X', 'https://x', 'https://x');
        $comment = $thread->comment('Blog comment', $user);

        $this->actingAs($user)->delete("/roadmaps/comments/{$comment->id}")->assertNotFound();
    }
}
