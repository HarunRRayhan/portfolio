<?php

namespace App\Models;

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
     * Every comment, oldest first, nested by parent. Only the author's name is exposed, never the email.
     *
     * @return list<array<string, mixed>>
     */
    public function tree(): array
    {
        return $this->branch($this->comments()->with('user:id,name')->orderBy('created_at')->get(), null);
    }

    private function branch(Collection $comments, ?int $parentId): array
    {
        return $comments
            ->filter(fn ($c) => ($c->parent_id === null ? null : (int) $c->parent_id) === $parentId)
            ->map(fn ($c) => [
                'id' => (int) $c->id,
                'content' => (string) $c->content,
                'createdAt' => $c->created_at?->toAtomString(),
                'user' => $c->user ? ['id' => (int) $c->user->id, 'name' => (string) $c->user->name] : null,
                'replies' => $this->branch($comments, (int) $c->id),
            ])
            ->values()
            ->all();
    }
}
