<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Guard the post catalog against text a reader cannot see.
 *
 * Hidden characters are how a document smuggles instructions into an agent's
 * context, and they also survive copy-paste into an editor without showing up.
 * Emoji sequencing characters (ZWJ, ZWNJ, variation selectors) are excluded on
 * purpose: older posts build emoji out of them and removing those changes what
 * the reader sees.
 */
class BlogPostHygieneTest extends TestCase
{
    /** Zero-width, non-breaking, soft-hyphen, tag and control characters. */
    private const HIDDEN_CODEPOINTS = '/[\x{0000}-\x{0008}\x{000B}\x{000C}\x{000E}-\x{001F}\x{007F}\x{00A0}\x{00AD}\x{180E}\x{2007}\x{200B}\x{200E}\x{200F}\x{202F}\x{205F}\x{2060}-\x{2064}\x{206A}-\x{206F}\x{3000}\x{FEFF}\x{E0000}-\x{E007F}]/u';

    /** The same characters written as HTML entities. */
    private const HIDDEN_ENTITIES = '/&(?:(?:nbsp|shy|thinsp|ensp|emsp|hairsp|ZeroWidthSpace|NoBreak|lrm|rlm);|#(?:160|173|8203|8206|8207|8239|8288|8289|8290|8291|65279);|#x(?:a0|ad|200b|200e|200f|202f|2060|feff);)/i';

    /** CSS that renders text a reader never sees. */
    private const HIDDEN_STYLES = '/display\s*:\s*none|visibility\s*:\s*hidden/i';

    public function test_no_post_contains_hidden_characters(): void
    {
        $this->assertCatalogPasses(
            fn (string $contents): ?string => $this->firstMatch(self::HIDDEN_CODEPOINTS, $contents),
            'hidden character',
        );
    }

    public function test_no_post_writes_a_hidden_character_as_an_entity(): void
    {
        $this->assertCatalogPasses(
            fn (string $contents): ?string => $this->firstMatch(self::HIDDEN_ENTITIES, $contents),
            'hidden character entity',
        );
    }

    public function test_no_post_hides_text_with_css_outside_code(): void
    {
        $this->assertCatalogPasses(function (string $contents): ?string {
            $prose = preg_replace('/<pre\b.*?<\/pre>/s', '', $contents) ?? $contents;

            return $this->firstMatch(self::HIDDEN_STYLES, $prose);
        }, 'hidden CSS');
    }

    public function test_no_post_starts_with_a_byte_order_mark_or_uses_crlf(): void
    {
        $this->assertCatalogPasses(function (string $contents): ?string {
            if (str_starts_with($contents, "\u{FEFF}")) {
                return 'byte order mark at the start of the file';
            }

            return str_contains($contents, "\r") ? 'CRLF line ending' : null;
        }, 'byte order mark or CRLF');
    }

    public function test_no_post_line_ends_with_whitespace(): void
    {
        $this->assertCatalogPasses(function (string $contents): ?string {
            if (preg_match('/^[ \t]+$/m', $contents, $match, PREG_OFFSET_CAPTURE) !== 1) {
                return null;
            }

            return 'trailing whitespace on line '.$this->lineAt($contents, $match[0][1]);
        }, 'trailing whitespace');
    }

    /**
     * @param  callable(string): ?string  $check
     */
    private function assertCatalogPasses(callable $check, string $problem): void
    {
        $failures = [];

        foreach (glob(resource_path('blog/posts/*.md')) ?: [] as $path) {
            $contents = (string) file_get_contents($path);
            $detail = $check($contents);

            if ($detail !== null) {
                $failures[] = basename($path).': '.$detail;
            }
        }

        $this->assertSame([], $failures, "The post catalog contains {$problem}. Fix these files:\n- ".implode("\n- ", $failures));
    }

    private function firstMatch(string $pattern, string $contents): ?string
    {
        if (preg_match($pattern, $contents, $match, PREG_OFFSET_CAPTURE) !== 1) {
            return null;
        }

        $found = $match[0][0];
        $codepoint = mb_ord($found, 'UTF-8');

        return sprintf(
            'U+%s %s on line %d',
            str_pad(strtoupper(dechex($codepoint)), 4, '0', STR_PAD_LEFT),
            $found === ' ' ? 'space' : 'character',
            $this->lineAt($contents, $match[0][1]),
        );
    }

    private function lineAt(string $contents, int $offset): int
    {
        return substr_count(substr($contents, 0, $offset), "\n") + 1;
    }
}
