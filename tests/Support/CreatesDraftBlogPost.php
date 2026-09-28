<?php

namespace Tests\Support;

use App\Support\BlogRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

trait CreatesDraftBlogPost
{
    /** @return array{slug: string, token: string, title: string} */
    protected function createDraftBlogPost(): array
    {
        $slug = 'test-draft-'.Str::lower(Str::random(12));
        $token = bin2hex(random_bytes(16));
        $title = 'Temporary Draft Post';
        $path = resource_path("blog/posts/{$slug}.md");

        file_put_contents($path, <<<MARKDOWN
---
title: "{$title}"
slug: "{$slug}"
draft: true
draftToken: "{$token}"
brief: "Temporary draft used by the test suite."
publishedAt: "2099-01-01T00:00:00.000Z"
readTimeInMinutes: 1
tags: []
---
This draft exists only for this test.
MARKDOWN);

        Cache::forget(BlogRepository::cacheKey());
        $this->beforeApplicationDestroyed(function () use ($path): void {
            @unlink($path);
            Cache::forget(BlogRepository::cacheKey());
        });

        return compact('slug', 'token', 'title');
    }
}
