<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCrosspost;
use App\Support\BlogRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MediumCrosspostController extends Controller
{
    // Medium has no publish API; the admin imports by hand, then records the story link here.
    public function store(Request $request, string $slug): RedirectResponse
    {
        $blog = new BlogRepository;
        $post = $blog->find($slug);

        abort_unless(is_array($post) && $blog->isPublic($post), 404);

        $validated = $request->validate([
            'url' => ['required', 'url:https', 'max:300', 'regex:~^https://([a-z0-9-]+\.)?medium\.com/~i'],
        ]);

        BlogCrosspost::updateOrCreate(
            ['slug' => $slug, 'platform' => 'medium'],
            ['remote_id' => basename(parse_url($validated['url'], PHP_URL_PATH) ?: ''), 'remote_url' => $validated['url']],
        );

        return back();
    }
}
