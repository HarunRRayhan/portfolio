<?php

namespace App\Console\Commands;

use App\Support\AiReadinessReport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class AuditAiReadiness extends Command
{
    protected $signature = 'seo:ai-readiness {--live : Also fetch the public robots.txt and llms.txt}';

    protected $description = 'Check that AI crawlers can learn from the site and that the origin crawl budget is on';

    public function handle(): int
    {
        $failures = 0;

        foreach (AiReadinessReport::checks() as $check) {
            $label = $check['ok'] ? 'PASS' : ($check['required'] ? 'FAIL' : 'WARN');
            $this->line($label.' '.$check['message']);

            if (! $check['ok'] && $check['required']) {
                $failures++;
            }
        }

        if ($this->option('live')) {
            $failures += $this->liveChecks();
        }

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function liveChecks(): int
    {
        $origin = 'https://harun.dev';
        $failures = 0;

        foreach (['/robots.txt', '/llms.txt'] as $path) {
            try {
                $response = Http::timeout(15)
                    ->withHeaders(['User-Agent' => 'HarunDevAiReadiness/1.0'])
                    ->get($origin.$path);
            } catch (\Throwable $exception) {
                $this->line('FAIL '.$origin.$path.' could not be fetched: '.$exception->getMessage());
                $failures++;

                continue;
            }

            if (! $response->successful()) {
                $this->line('FAIL '.$origin.$path.' returned HTTP '.$response->status());
                $failures++;

                continue;
            }

            $body = $response->body();
            $ok = $path === '/robots.txt'
                ? str_contains($body, 'Content-Signal: search=yes, ai-input=yes, ai-train=yes')
                    && ! str_contains($body, 'ai-train=no')
                : str_contains($body, '/consultation') && str_contains($body, '## Hire');

            $this->line(($ok ? 'PASS' : 'FAIL').' live '.$origin.$path.' '.($ok ? 'matches the AI policy.' : 'does not match the AI policy yet.'));

            if (! $ok) {
                $failures++;
            }
        }

        return $failures;
    }
}
