<?php

namespace App\Models;

use App\Support\SponsorXp;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use RyanChandler\Comments\Concerns\HasComments;
use RyanChandler\Comments\Models\Comment;

class BlogCommentThread extends Model
{
    use HasComments;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'slug',
        'title',
        'canonical_url',
        'source_url',
    ];

    /**
     * Find or create a thread for a blog post.
     */
    public static function resolveForPost(string $slug, string $title, string $canonicalUrl, string $sourceUrl): self
    {
        return static::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'title' => $title,
                'canonical_url' => $canonicalUrl,
                'source_url' => $sourceUrl,
            ],
        );
    }

    public function commentCount(): int
    {
        return $this->comments()->count();
    }

    /**
     * Visible comment count for the current viewer.
     *
     * Admins see everything; commenters only see their own comments.
     */
    /**
     * Convert flat comment records into a nested tree for the UI.
     *
     * Public: everyone sees every comment, with the author's public name, picture and profile link only (never the email).
     *
     * @return array<int, array<string, mixed>>
     */
    public function commentTree(): array
    {
        $comments = $this->comments()
            ->with('user:id,name,email,avatar_url,anonymous,anon_name,profile_slug,username')
            ->orderBy('created_at')
            ->get();

        $sponsors = XpAward::whereIn('user_id', $comments->pluck('user_id')->filter()->unique())
            ->where('key', 'like', SponsorXp::KEY_PREFIX.'%')->where('points', '>', 0)->pluck('user_id')->flip();

        return $this->buildTree($comments, null, $sponsors);
    }

    /**
     * @param  Collection<int, Comment>  $comments
     * @return array<int, array<string, mixed>>
     */
    private function buildTree(Collection $comments, ?int $parentId = null, ?Collection $sponsors = null): array
    {
        return $comments
            ->filter(function ($comment) use ($parentId): bool {
                $commentParentId = $comment->parent_id;

                return $parentId === null
                    ? $commentParentId === null
                    : (int) $commentParentId === $parentId;
            })
            ->map(function ($comment) use ($comments, $sponsors): array {
                $createdAt = $comment->created_at;

                return [
                    'id' => (int) $comment->id,
                    'content' => (string) $comment->content,
                    'createdAtIso' => $createdAt?->toAtomString() ?? now()->toAtomString(),
                    'createdAtHuman' => $createdAt?->format('M j, Y g:i A') ?? '',
                    'parentId' => $comment->parent_id ? (int) $comment->parent_id : null,
                    'user' => $comment->user ? [
                        'name' => $comment->user->publicName(),
                        'avatarUrl' => $comment->user->publicAvatar(),
                        'profile' => $comment->user->profileHandle(),
                        'sponsor' => (bool) $sponsors?->has($comment->user->id),
                    ] : null,
                    'children' => $this->buildTree($comments, (int) $comment->id, $sponsors),
                ];
            })
            ->values()
            ->all();
    }
}
