<?php

namespace App\Models;

use App\Support\SponsorXp;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use RyanChandler\Comments\Concerns\HasComments;

/** A public discussion on a roadmap topic or lesson. Comments live in the shared `comments` table. */
class RoadmapCommentThread extends Model
{
    use HasComments;

    protected $fillable = ['key'];

    public static function forKey(string $key): self
    {
        return static::firstOrCreate(['key' => $key]);
    }

    public static function findKey(string $key): ?self
    {
        return static::where('key', $key)->first();
    }

    /**
     * Every comment, oldest first, nested by parent. Only the author's public name, picture and profile link are exposed, never the email.
     *
     * @return list<array<string, mixed>>
     */
    public function tree(): array
    {
        $comments = $this->comments()->with('user:id,name,email,avatar_url,anonymous,anon_name,profile_slug,username')->orderBy('created_at')->get();
        // One query for every author's Sponsor tag, same rule as the leaderboard.
        $sponsors = XpAward::whereIn('user_id', $comments->pluck('user_id')->filter()->unique())
            ->where('key', 'like', SponsorXp::KEY_PREFIX.'%')->where('points', '>', 0)->pluck('user_id')->flip();

        return $this->branch($comments, null, $sponsors);
    }

    private function branch(Collection $comments, ?int $parentId, Collection $sponsors): array
    {
        return $comments
            ->filter(fn ($c) => ($c->parent_id === null ? null : (int) $c->parent_id) === $parentId)
            ->map(fn ($c) => [
                'id' => (int) $c->id,
                'content' => (string) $c->content,
                'createdAt' => $c->created_at?->toAtomString(),
                'user' => $c->user ? ['mine' => auth()->id() === (int) $c->user->id, 'name' => $c->user->publicName(), 'avatarUrl' => $c->user->publicAvatar(), 'profile' => $c->user->profileHandle(), 'sponsor' => $sponsors->has($c->user->id)] : null,
                'replies' => $this->branch($comments, (int) $c->id, $sponsors),
            ])
            ->values()
            ->all();
    }
}
