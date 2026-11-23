<?php

namespace App\Http\Controllers;

use App\Models\RoadmapCommentThread;
use App\Support\RoadmapAccess;
use App\Support\RoadmapRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RyanChandler\Comments\Models\Comment;

class RoadmapCommentController extends Controller
{
    public function __construct(private RoadmapRepository $repo) {}

    public function storeRoadmap(Request $request, string $slug): RedirectResponse
    {
        abort_unless($this->repo->find($slug), 404);

        return $this->store($request, $slug);
    }

    public function storeTopic(Request $request, string $slug, string $topic): RedirectResponse
    {
        $this->topicOr404($slug, $topic);

        return $this->store($request, "{$slug}/{$topic}");
    }

    public function storeLesson(Request $request, string $slug, string $topic, string $lesson): RedirectResponse
    {
        $found = $this->topicOr404($slug, $topic);
        abort_unless(collect($found['topic']['lessons'])->contains('id', $lesson), 404);

        return $this->store($request, "{$slug}/{$topic}/{$lesson}");
    }

    public function destroy(Request $request, string $comment): RedirectResponse
    {
        // Manual lookup scoped to roadmap threads, so blog comments can't be reached through this route.
        $found = Comment::query()
            ->where('commentable_type', (new RoadmapCommentThread)->getMorphClass())
            ->findOrFail($comment);
        $user = $request->user();
        abort_unless((int) $found->user_id === (int) $user->id || $user->isAdmin(), 403);

        $found->delete();

        return back();
    }

    private function store(Request $request, string $key): RedirectResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'min:2', 'max:3000'],
            'parent_id' => ['nullable', 'integer'],
        ]);
        $thread = RoadmapCommentThread::forKey($key);

        $parent = null;
        if (! empty($data['parent_id'])) {
            $parent = $thread->comments()->whereKey((int) $data['parent_id'])->first();
            abort_unless($parent instanceof Comment, 422, 'The comment you replied to is gone.');
        }

        $thread->comment(trim($data['content']), $request->user(), $parent);

        return back();
    }

    /** @return array<string, mixed> */
    private function topicOr404(string $slug, string $topic): array
    {
        $roadmap = $this->repo->find($slug);
        $found = $roadmap ? $this->repo->findTopic($roadmap, $topic) : null;
        abort_unless($found, 404);
        // Paid topics' discussions are for readers who can open them.
        abort_if(! $found['stage']['free'] && ! RoadmapAccess::canAccessPaid(request()->user()), 403);

        return $found;
    }
}
