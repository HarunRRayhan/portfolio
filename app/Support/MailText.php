<?php

namespace App\Support;

/** Keeps user-supplied text from rendering as markdown in markdown mails. */
final class MailText
{
    /** Inline text with markdown link and formatting characters and line breaks removed. */
    public static function plain(?string $text): string
    {
        return trim((string) preg_replace('/\s+/', ' ', str_replace(str_split('[]()<>*_`#!'), '', (string) $text)));
    }

    /** A code span or fenced block whose fence is longer than any backtick run in the text. */
    public static function code(string $text, bool $block = false): string
    {
        // A line break would end an inline code span and let the rest render as markdown.
        $text = $block ? $text : (string) preg_replace('/[\r\n]+/', ' ', $text);
        preg_match_all('/`+/', $text, $runs);
        $fence = str_repeat('`', max($block ? 3 : 1, ...array_map(fn ($r) => strlen($r) + 1, $runs[0] ?: [''])));

        return $block ? "{$fence}\n{$text}\n{$fence}" : "{$fence} {$text} {$fence}";
    }
}
