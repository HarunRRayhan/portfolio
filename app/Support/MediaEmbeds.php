<?php

namespace App\Support;

class MediaEmbeds
{
    /**
     * Extract an 11-character YouTube video ID from a watch/short/embed URL, or
     * null if $url isn't a recognizable YouTube link. Used by the video detail
     * route to build a privacy-friendly youtube-nocookie embed.
     */
    public static function youtubeEmbedUrl(string $url): ?string
    {
        $pattern = '#(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})#i';

        if (! preg_match($pattern, $url, $match)) {
            return null;
        }

        return 'https://www.youtube-nocookie.com/embed/'.$match[1];
    }

    /**
     * Turn a Google Slides link (edit or Publish-to-web form) into its embed
     * form, or null if $url isn't a recognizable Google Slides link. Used by
     * the slide detail route; a non-Google-Slides URL falls back to the
     * thumbnail + "View slides" button instead of an iframe.
     */
    public static function slideEmbedUrl(string $url): ?string
    {
        $pattern = '#docs\.google\.com/presentation/d/(e/)?([a-zA-Z0-9_-]+)#i';

        if (! preg_match($pattern, $url, $match)) {
            return null;
        }

        $path = $match[1].$match[2];

        return "https://docs.google.com/presentation/d/{$path}/embed?start=false&loop=false&delayms=3000";
    }
}
