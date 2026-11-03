<?php

namespace Tests\Feature;

use App\Mail\Sponsorship\BookingRetiredMail;
use App\Mail\Sponsorship\CreditExpiringMail;
use App\Mail\Sponsorship\ScanRequestedMail;
use App\Mail\Sponsorship\SponsorCreditsReadyMail;
use Tests\TestCase;

class SponsorMailMarkdownTest extends TestCase
{
    private const EVIL = '[x](https://evil.test) **bold** <https://evil.test>';

    public function test_user_text_never_renders_as_markdown_links(): void
    {
        $mails = [
            new SponsorCreditsReadyMail(self::EVIL, now()->addDays(30)),
            new CreditExpiringMail(self::EVIL, now()->addDays(3)),
            new BookingRetiredMail(self::EVIL),
            new ScanRequestedMail(self::EVIL, 'a@example.test', 'https://github.com/a/b', "hi\n```\n".self::EVIL."\n```"),
        ];

        foreach ($mails as $mail) {
            $html = $mail->render();
            $this->assertStringNotContainsString('href="https://evil.test"', $html, $mail::class);
            $this->assertStringNotContainsString('<strong>bold</strong>', $html, $mail::class);
        }
    }

    public function test_inline_code_value_with_line_break_stays_code(): void
    {
        $html = (new ScanRequestedMail('Ann', "a@example.test\n\n[x](https://evil.test)", 'https://github.com/a/b'))->render();

        $this->assertStringNotContainsString('href="https://evil.test"', $html);
    }

    public function test_scan_mail_keeps_repo_url_and_notes_readable(): void
    {
        $html = (new ScanRequestedMail('Ann', 'a_b@example.test', 'https://github.com/a/b_c', 'Check [x](https://evil.test)'))->render();

        $this->assertStringContainsString('https://github.com/a/b_c', $html);
        $this->assertStringContainsString('a_b@example.test', $html);
        $this->assertStringContainsString('Check [x](https://evil.test)', $html);
    }
}
