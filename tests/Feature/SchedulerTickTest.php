<?php

namespace Tests\Feature;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchedulerTickTest extends TestCase
{
    use RefreshDatabase;

    private function isolatedSchedule(): Schedule
    {
        $this->app->make(Kernel::class)->bootstrap();
        $schedule = new Schedule;
        $this->app->instance(Schedule::class, $schedule);

        return $schedule;
    }

    public function test_completed_tick_records_own_release_identity(): void
    {
        $ran = false;
        $this->isolatedSchedule()->call(function () use (&$ran) {
            $ran = true;
        })->everyMinute();
        config(['app.build_version' => 'tick-sha', 'app.deployment_id' => 'tick-id']);
        $this->artisan('operations:scheduler-tick')->assertSuccessful();
        $this->assertTrue($ran);
        $this->assertDatabaseHas('service_heartbeats', ['service' => 'scheduler', 'build_version' => 'tick-sha', 'deployment_id' => 'tick-id']);
    }

    public function test_failed_task_does_not_refresh_previous_heartbeat(): void
    {
        $seen = now()->subMinutes(10)->toDateTimeString();
        DB::table('service_heartbeats')->insert(['service' => 'scheduler', 'last_seen_at' => $seen, 'build_version' => 'old-sha', 'deployment_id' => 'old-id']);
        $this->isolatedSchedule()->call(fn () => throw new \RuntimeException('isolated scheduled task failed'))->everyMinute();
        $this->artisan('operations:scheduler-tick')->assertFailed();
        $this->assertDatabaseHas('service_heartbeats', ['service' => 'scheduler', 'last_seen_at' => $seen, 'build_version' => 'old-sha']);
    }

    public function test_nonzero_scheduled_command_exit_does_not_create_heartbeat(): void
    {
        $this->isolatedSchedule()->exec(PHP_BINARY, ['-r', 'exit(3);'])->everyMinute();
        $this->artisan('operations:scheduler-tick')->assertFailed();
        $this->assertDatabaseMissing('service_heartbeats', ['service' => 'scheduler']);
    }

    public function test_missing_heartbeat_schema_fails_before_running_tasks(): void
    {
        $ran = false;
        $this->isolatedSchedule()->call(function () use (&$ran) {
            $ran = true;
        })->everyMinute();
        Schema::drop('service_heartbeats');
        $this->artisan('operations:scheduler-tick')->assertExitCode(75);
        $this->assertFalse($ran);
    }
}
