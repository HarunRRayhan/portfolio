<?php

namespace App\Console\Commands;

use App\Services\Operations\DatabaseProbe;
use Illuminate\Console\Command;
use Illuminate\Console\Events\ScheduledTaskFailed;
use Illuminate\Console\Events\ScheduledTaskFinished;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Throwable;

class SchedulerTick extends Command
{
    protected $signature = 'operations:scheduler-tick';

    protected $description = 'Run one scheduled tick and persist a heartbeat only after successful completion';

    public function handle(): int
    {
        try {
            app(DatabaseProbe::class)->connection()->table('service_heartbeats')->limit(1)->get();
        } catch (Throwable) {
            $this->error('Scheduler database/schema is not ready.');

            return 75; // Temporary startup dependency failure, before any tasks execute.
        }

        $failed = false;
        Event::listen(ScheduledTaskFailed::class, function () use (&$failed) {
            $failed = true;
        });
        Event::listen(ScheduledTaskFinished::class, function ($event) use (&$failed) {
            $failed = $failed || ($event->task->exitCode !== null && $event->task->exitCode !== 0);
        });
        try {
            $exitCode = $this->call('schedule:run', ['--no-interaction' => true]);
            if ($exitCode !== 0 || $failed) {
                return self::FAILURE;
            }
            DB::table('service_heartbeats')->updateOrInsert(['service' => 'scheduler'], [
                'last_seen_at' => now('UTC'),
                'build_version' => config('app.build_version'),
                'deployment_id' => config('app.deployment_id'),
            ]);

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Scheduler tick failed; heartbeat was not refreshed.');

            return self::FAILURE;
        }
    }
}
