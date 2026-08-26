<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class DocumentTitleTest extends TestCase
{
    #[Test]
    #[DataProvider('titles')]
    public function it_resolves_hydrated_document_titles(string $title, ?string $siteName, string $expected): void
    {
        $this->assertSame($expected, $this->resolveFromSource($title, $siteName));
    }

    /**
     * @return array<string, array{0: string, 1: ?string, 2: string}>
     */
    public static function titles(): array
    {
        return [
            'empty falls back to the site name' => ['', null, 'Harun R. Rayhan'],
            'already branded catalog title stays' => ['Blog | Harun R. Rayhan', null, 'Blog | Harun R. Rayhan'],
            'blog post title stays' => ["How I Review | Harun's Blog", null, "How I Review | Harun's Blog"],
            'homepage dash title stays' => [
                'Harun R. Rayhan - Senior Software Engineer & DevOps Consultant',
                null,
                'Harun R. Rayhan - Senior Software Engineer & DevOps Consultant',
            ],
            'short admin title gets the site name' => ['Profile', null, 'Profile - Harun R. Rayhan'],
            'auth title never becomes Laravel' => ['Log in', null, 'Log in - Harun R. Rayhan'],
            'placeholder site name is ignored' => ['Profile', 'Laravel', 'Profile - Harun R. Rayhan'],
            'empty site name uses the default' => ['Profile', '', 'Profile - Harun R. Rayhan'],
        ];
    }

    private function resolveFromSource(string $title, ?string $siteName): string
    {
        $module = dirname(__DIR__, 2).'/resources/js/lib/documentTitle.ts';
        $source = file_get_contents($module);
        $this->assertIsString($source);

        $js = preg_replace('/\?: string|: string \| undefined|:\s*string\b/', '', $source);
        $this->assertIsString($js);

        $tmp = sys_get_temp_dir().'/document-title-'.bin2hex(random_bytes(8)).'.mjs';
        file_put_contents($tmp, $js);

        $import = json_encode($tmp, JSON_THROW_ON_ERROR);
        $escapedTitle = json_encode($title, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $escapedSiteName = $siteName === null
            ? ''
            : ', '.json_encode($siteName, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $script = "import { resolveDocumentTitle } from {$import}; console.log(JSON.stringify(resolveDocumentTitle({$escapedTitle}{$escapedSiteName})));";

        $output = [];
        $exit = 0;
        exec(
            'node --input-type=module --eval '.escapeshellarg($script).' 2>&1',
            $output,
            $exit,
        );
        unlink($tmp);

        $this->assertSame(0, $exit, "documentTitle.ts must run under node:\n".implode("\n", $output));

        return json_decode(implode("\n", $output), true, 512, JSON_THROW_ON_ERROR);
    }
}
