<?php

namespace Tests\Feature;

use App\Models\BlogCommentThread;
use App\Models\Subscriber;
use App\Models\User;
use App\Models\XpAward;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RyanChandler\Comments\Models\Comment;
use Tests\TestCase;

class XpEarningTest extends TestCase
{
    use RefreshDatabase;

    private const R = '/roadmaps/internet-networking';

    private function xp(User $user): int
    {
        return (int) XpAward::where('user_id', $user->id)->sum('points');
    }

    private function user(): User
    {
        return User::factory()->create(['terms_accepted_at' => now()]);
    }

    public function test_signup_awards_50(): void
    {
        $this->assertSame(50, $this->xp($this->user()));
    }

    public function test_verified_subscribe_awards_newsletter_once(): void
    {
        $user = $this->user();
        Subscriber::subscribeVerified(strtoupper($user->email), 'account');
        Subscriber::subscribeVerified($user->email, 'account');
        $this->assertSame(75, $this->xp($user));

        Subscriber::subscribeVerified('nobody@example.com', 'footer'); // no account: nothing, no error
        $this->assertSame(1, XpAward::where('key', 'newsletter')->count());
    }

    public function test_existing_subscriber_signing_up_gets_newsletter_xp(): void
    {
        Subscriber::subscribeVerified('new@example.com', 'footer');
        $this->assertSame(75, $this->xp(User::factory()->create(['email' => 'New@example.com'])));
        $this->assertSame(50, $this->xp(User::factory()->unverified()->create(['email' => 'NEW@example.com'])));
    }

    public function test_comment_caps_per_page_on_roadmaps_and_blog(): void
    {
        $user = $this->user();
        $page = self::R.'/ip-addresses/comments';
        $this->actingAs($user)->post($page, ['content' => 'first'])->assertRedirect();
        $this->actingAs($user)->post($page, ['content' => 'second'])->assertRedirect();
        $parent = Comment::first();
        $this->actingAs($user)->post($page, ['content' => 'reply one', 'parent_id' => $parent->id]);
        $this->actingAs($user)->post($page, ['content' => 'reply two', 'parent_id' => $parent->id]);
        $this->assertSame(50 + 5 + 3, $this->xp($user));

        $this->actingAs($user)->post(self::R.'/ip-addresses/dhcp/comments', ['content' => 'lesson page']);
        $this->assertSame(63, $this->xp($user));

        $thread = BlogCommentThread::resolveForPost('some-post', 'Some post', 'https://harun.dev/blog/some-post', 'x');
        $thread->comment('blog one', $user);
        $thread->comment('blog two', $user);
        $this->assertSame(68, $this->xp($user));
    }

    public function test_deleting_awarded_comment_frees_slot_but_other_delete_does_not(): void
    {
        $user = $this->user();
        $page = self::R.'/ip-addresses/comments';
        $this->actingAs($user)->post($page, ['content' => 'first']);
        $this->actingAs($user)->post($page, ['content' => 'second']);
        [$first, $second] = Comment::orderBy('id')->get();

        $this->actingAs($user)->delete('/roadmaps/comments/'.$second->id);
        $this->assertSame(55, $this->xp($user));

        $this->actingAs($user)->delete('/roadmaps/comments/'.$first->id);
        $this->assertSame(50, $this->xp($user));

        $this->actingAs($user)->post($page, ['content' => 'again']);
        $this->assertSame(55, $this->xp($user));
    }

    public function test_lesson_xp_once_and_kept_on_undo(): void
    {
        $user = $this->user();
        $this->actingAs($user)->post(self::R.'/lessons/dhcp')->assertSessionHas('xp', 10);
        $this->actingAs($user)->delete(self::R.'/lessons/dhcp');
        $this->actingAs($user)->post(self::R.'/lessons/dhcp');
        $this->assertSame(60, $this->xp($user));
    }

    public function test_optional_lesson_no_xp_and_topic_bonus_on_last_required(): void
    {
        $user = $this->user();
        $this->actingAs($user)->post(self::R.'/lessons/mtu');
        $this->assertSame(50, $this->xp($user));

        $this->actingAs($user)->post(self::R.'/lessons/why-packets');
        $this->assertSame(60, $this->xp($user));
        $this->actingAs($user)->post(self::R.'/lessons/headers-and-payload');
        $this->assertSame(50 + 20 + 25, $this->xp($user));
        $this->assertTrue(XpAward::where(['user_id' => $user->id, 'key' => 'topic:internet-networking/packets'])->exists());
    }
}
