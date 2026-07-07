<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use RyanChandler\Comments\Concerns\HasComments;

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
    public function visibleCommentCountForViewer(?\App\Models\User $viewer): int
    {
        $query = $this->comments();

        if ($viewer && ! $viewer->isAdmin()) {
            $query->where('user_id', $viewer->id);
        }

        return $query->count();
    }

    /**
     * Convert flat comment records into a nested tree for the UI.
     *
     * Admins see every comment. Non-admin (commenter) users see only their own.
     *
     * @return array<int, array<string, mixed>>
     */
    public function commentTree(): array
    {
        $comments = $this->comments()
            ->with('user')
            ->orderBy('created_at')
            ->get();

        $viewer = auth()->user();
        $isAdmin = $viewer && method_exists($viewer, 'isAdmin') && $viewer->isAdmin();

        if (! $isAdmin) {
            $allowedUserIds = $viewer ? [intval($viewer->id)] : [];

            $comments = $comments->filter(function ($comment) use ($allowedUserIds) {
                $authorId = optional($comment->user)->id;

                return $authorId !== null && in_array(intval($authorId), $allowedUserIds, true);
            })->values();
        }

        return $this->buildTree($comments);
    }

    /**
     * @param  Collection<int, \RyanChandler\Comments\Models\Comment>  $comments
     * @return array<int, array<string, mixed>>
     */
    private function buildTree(Collection $comments, ?int $parentId = null): array
    {
        return $comments
            ->filter(function ($comment) use ($parentId): bool {
                $commentParentId = $comment->parent_id;

                return $parentId === null
                    ? $commentParentId === null
                    : (int) $commentParentId === $parentId;
            })
            ->map(function ($comment) use ($comments): array {
                $createdAt = $comment->created_at;

                return [
                    'id' => (int) $comment->id,
                    'content' => (string) $comment->content,
                    'createdAtIso' => $createdAt?->toAtomString() ?? now()->toAtomString(),
                    'createdAtHuman' => $createdAt?->format('M j, Y g:i A') ?? '',
                    'parentId' => $comment->parent_id ? (int) $comment->parent_id : null,
                    'user' => $comment->user ? [
                        'id' => (int) $comment->user->id,
                        'name' => (string) $comment->user->name,
                        'email' => (string) $comment->user->email,
                    ] : null,
                    'children' => $this->buildTree($comments, (int) $comment->id),
                ];
            })
            ->values()
            ->all();
    }
}
