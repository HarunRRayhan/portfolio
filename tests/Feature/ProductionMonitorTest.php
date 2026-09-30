<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ProductionMonitorTest extends TestCase
{
    #[DataProvider('incidents')]
    public function test_monitor_mutates_only_confirmed_crashed_application_service(string $component, string $status, bool $database, bool $assets, bool $restart): void
    {
        $directory = sys_get_temp_dir().'/harundev-monitor-'.bin2hex(random_bytes(8));
        mkdir($directory);
        file_put_contents($directory.'/curl', <<<'BASH'
#!/usr/bin/env bash
output=''; payload=''
while [[ $# -gt 0 ]]; do
  case "$1" in -o) output="$2"; shift ;; --data) payload="$2"; shift ;; esac
  shift
done
if [[ -n "$output" ]]; then printf '%s' "$FAKE_HEALTH" > "$output"; printf '503';
elif [[ "$payload" == *deploymentRedeploy* ]]; then
  printf '%s\n' "$payload" >> "$FAKE_DIRECTORY/mutations"
  printf '{"data":{"deploymentRedeploy":{"id":"restarted","status":"DEPLOYING"}}}'
else
  printf '%s\n' "$payload" >> "$FAKE_DIRECTORY/queries"
  printf '%s' "$FAKE_DEPLOYMENTS"
fi
BASH);
        file_put_contents($directory.'/gh', <<<'BASH'
#!/usr/bin/env bash
if [[ "$1" == api ]]; then printf '[]';
elif [[ "$1 $2" == 'issue create' ]]; then printf 'https://github.com/fixture/repo/issues/1'; fi
BASH);
        file_put_contents($directory.'/sleep', "#!/usr/bin/env bash\nexit 0\n");
        foreach (['curl', 'gh', 'sleep'] as $name) {
            chmod($directory.'/'.$name, 0700);
        }
        $env = [
            'PATH' => $directory.':'.getenv('PATH'), 'MONITOR_COMPONENT' => $component,
            'RAILWAY_WEB_SERVICE_ID' => 'web-service', 'RAILWAY_SCHEDULER_SERVICE_ID' => 'scheduler-service',
            'RAILWAY_ENVIRONMENT_ID' => 'fixture-env', 'RAILWAY_PROJECT_ID' => 'fixture-project', 'RAILWAY_TOKEN' => 'fake-token',
            'GITHUB_RUN_ID' => '1', 'GITHUB_RUN_ATTEMPT' => '1', 'GITHUB_REPOSITORY' => 'fixture/repo',
            'FAKE_DIRECTORY' => $directory,
            'FAKE_HEALTH' => json_encode(['status' => 'degraded', 'checks' => ['database' => $database, 'assets' => $assets, 'scheduler' => false]]),
            'FAKE_DEPLOYMENTS' => json_encode(['data' => ['deployments' => ['edges' => [['node' => ['id' => $component.'-current', 'status' => $status, 'canRedeploy' => true, 'deploymentStopped' => false, 'createdAt' => '2026-09-30T00:00:00Z']]]]]]),
        ];
        try {
            $process = new Process(['bash', base_path('scripts/monitor-production.sh')], base_path(), $env);
            $process->run();
            $this->assertSame(1, $process->getExitCode(), $process->getErrorOutput());
            $query = json_decode(file_get_contents($directory.'/queries'), true);
            $this->assertSame($component.'-service', $query['variables']['serviceId']);
            $this->assertSame($restart, is_file($directory.'/mutations'));
            if ($restart) {
                $mutations = file($directory.'/mutations');
                $this->assertCount(1, $mutations);
                $mutation = json_decode($mutations[0], true);
                $this->assertSame($component.'-current', $mutation['variables']['id']);
                $this->assertStringContainsString('usePreviousImageTag:true', $mutation['query']);
            }
        } finally {
            foreach (glob($directory.'/*') as $path) {
                unlink($path);
            }
            rmdir($directory);
        }
    }

    public static function incidents(): array
    {
        return [
            'crashed web' => ['web', 'CRASHED', true, true, true],
            'crashed scheduler' => ['scheduler', 'CRASHED', true, true, true],
            'database outage' => ['web', 'CRASHED', false, true, false],
            'missing assets' => ['web', 'CRASHED', true, false, false],
            'long running scheduler' => ['scheduler', 'SUCCESS', true, true, false],
        ];
    }
}
