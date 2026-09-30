<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ProductionRecoveryPolicyTest extends TestCase
{
    #[DataProvider('recoveryScenarios')]
    public function test_recovery_only_targets_a_diagnosed_application_service(string $component, string $status, bool $databaseHealthy, bool $assetsHealthy, bool $schedulerHealthy, string $expected): void
    {
        $deployments = [];
        foreach (['web', 'scheduler', 'postgres'] as $service) {
            $deployments[$service] = ['edges' => [['node' => ['id' => $service.'-current', 'status' => $status, 'canRedeploy' => true, 'deploymentStopped' => false, 'createdAt' => '2026-09-30T10:00:00Z']]]];
        }
        $health = ['checks' => ['database' => $databaseHealthy, 'assets' => $assetsHealthy, 'scheduler' => $schedulerHealthy]];
        $process = new Process(['bash', '-c', 'source "$1"; select_redeploy_id "$2" "$3" "$4"', 'test', base_path('scripts/monitor-recovery.sh'), $component, json_encode($deployments), json_encode($health)]);
        $process->run();
        $this->assertSame($expected, trim($process->getOutput()));
        $this->assertSame(0, $process->getExitCode(), $process->getErrorOutput());
    }

    public function test_a_failed_latest_build_never_falls_back_to_an_older_image(): void
    {
        $deployments = ['web' => ['edges' => [
            ['node' => ['id' => 'new-failed', 'status' => 'FAILED', 'canRedeploy' => true, 'deploymentStopped' => false, 'createdAt' => '2026-09-30T10:00:00Z']],
            ['node' => ['id' => 'old-crashed', 'status' => 'CRASHED', 'canRedeploy' => true, 'deploymentStopped' => false, 'createdAt' => '2026-09-29T10:00:00Z']],
        ]]];
        $process = new Process(['bash', '-c', 'source "$1"; select_redeploy_id web "$2"', 'test', base_path('scripts/monitor-recovery.sh'), json_encode($deployments)]);
        $process->mustRun();
        $this->assertSame('', trim($process->getOutput()));
    }

    public static function recoveryScenarios(): array
    {
        return [
            'crashed web' => ['web', 'CRASHED', true, true, false, 'web-current'],
            'crashed scheduler' => ['scheduler', 'CRASHED', true, true, false, 'scheduler-current'],
            'stale scheduler only alerts' => ['scheduler', 'SUCCESS', true, true, false, ''],
            'healthy app' => ['web', 'SUCCESS', true, true, true, ''],
            'database failure' => ['web', 'CRASHED', false, true, false, ''],
            'assets failure' => ['web', 'CRASHED', true, false, false, ''],
            'never postgres' => ['postgres', 'CRASHED', true, true, false, ''],
            'failed build' => ['web', 'FAILED', true, true, false, ''],
        ];
    }
}
