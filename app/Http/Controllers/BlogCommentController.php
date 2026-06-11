<?php

namespace App\Http\Controllers;

use App\Models\BlogCommentThread;
use App\Support\BlogRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use RyanChandler\Comments\Models\Comment;

class BlogCommentController extends Controller
{
    public function store(Request $request, string $slug): RedirectResponse
    {
        $blog = new BlogRepository();
        $post = $blog->find($slug);

        abort_unless($post, 404);
        abort_unless(! (bool) ($post['draft'] ?? false), 404);

        $validated = $request->validate([
            'content' => ['required', 'string', 'min:3', 'max:5000'],
            'parent_id' => ['nullable', 'integer'],
        ]);

        $thread = BlogCommentThread::resolveForPost(
            $slug,
            (string) $post['title'],
            $blog->absoluteUrl($slug),
            (string) ($post['sourceUrl'] ?? $blog->sourceUrl($slug)),
        );

        $parent = null;

        if (! empty($validated['parent_id'])) {
            $parent = $thread->comments()
                ->whereKey((int) $validated['parent_id'])
                ->first();

            abort_unless($parent instanceof Comment, 422, 'The selected reply target is invalid.');
        }

        $thread->comment(
            trim($validated['content']),
            $request->user(),
            $parent,
        );

        Cache::forget('blog.post.'.$slug.'.comments');

        return redirect()->to(route('blog.post', ['slug' => $slug]).'#discussion');
    }
}
