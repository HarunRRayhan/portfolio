<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPostSchedule;
use App\Support\BlogRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ScheduleBlogPostController extends Controller
{
    public function store(Request $request, string $slug): RedirectResponse
    {
        $blog = new BlogRepository;
        $post = $blog->find($slug);

        abort_unless(is_array($post) && (bool) ($post['draft'] ?? false) && ! $blog->isPublic($post), 404);

        $validated = $request->validate([
            'publish_at' => ['required', 'date'],
        ]);

        $publishAt = Carbon::parse((string) $validated['publish_at'], BlogRepository::SCHEDULE_TIMEZONE)->utc();

        if ($publishAt->lessThanOrEqualTo(now())) {
            throw ValidationException::withMessages([
                'publish_at' => 'Pick a future time. The clock is '.BlogRepository::SCHEDULE_TIMEZONE.'.',
            ]);
        }

        BlogPostSchedule::query()->updateOrCreate(
            ['slug' => $slug],
            [
                'publish_at' => $publishAt,
                'notified_at' => null,
            ],
        );

        return redirect()
            ->route('admin.posts.index')
            ->with('status', 'Scheduled. It goes live at '.$publishAt->timezone(BlogRepository::SCHEDULE_TIMEZONE)->format('M j, Y g:i A').' '.BlogRepository::SCHEDULE_TIMEZONE.'.');
    }
}
