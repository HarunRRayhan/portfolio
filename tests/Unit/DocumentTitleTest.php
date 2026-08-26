<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class DocumentTitleTest extends TestCase
{
    #[Test]
    #[DataProvider('titles')]
    public function it_resolves_hydrated_document_titles(string $title, string $expected): void
    {
        $this->assertSame($expected, $this->resolveFromSource($title));
    }

    /**
     * @return array<string, array{0: string, 1: string}>
     */
    public static function titles(): array
    {
        return [
            'empty falls back to the site name' => ['', 'Harun R. Rayhan'],
            'already branded catalog title stays' => ['Blog | Harun R. Rayhan', 'Blog | Harun R. Rayhan'],
            'blog post title stays' => ["How I Review | Harun's Blog", "How I Review | Harun's Blog"],
            'homepage dash title stays' => [
                'Harun R. Rayhan - Senior Software Engineer & DevOps Consultant',
                'Harun R. Rayhan - Senior Software Engineer & DevOps Consultant',
            ],
            'short admin title gets the site name' => ['Profile', 'Profile - Harun R. Rayhan'],
            'auth title never becomes Laravel' => ['Log in', 'Log in - Harun R. Rayhan'],
        ];
    }

    private function resolveFromSource(string $title): string
    {
        $module = dirname(__DIR__, 2).'/resources/js/lib/documentTitle.ts';
        $source = file_get_contents($module);
        $this->assertIsString($source);
        $this->assertStringNotContainsString('Laravel', $source);

        $import = json_encode($module, JSON_THROW_ON_ERROR);
        $escaped = json_encode($title, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $script = "import { resolveDocumentTitle } from {$import}; console.log(JSON.stringify(resolveDocumentTitle({$escaped})));";

        $output = [];
        $exit = 0;
        exec(
            'node --experimental-strip-types --no-warnings --input-type=module --eval '.escapeshellarg($script).' 2>&1',
            $output,
            $exit,
        );

        $this->assertSame(0, $exit, "documentTitle.ts must run under node:\n".implode("\n", $output));

        return json_decode(implode("\n", $output), true, 512, JSON_THROW_ON_ERROR);
    }
}
