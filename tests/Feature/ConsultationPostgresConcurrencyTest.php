<?php

namespace Tests\Feature;

use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationGoogleOperation;
use App\Models\ConsultationTier;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConsultationPostgresConcurrencyTest extends TestCase
{
    private string $originalDefaultConnection;

    protected function setUp(): void
    {
        parent::setUp();

        if (getenv('CONSULTATION_PG_TESTS') !== '1') {
            $this->markTestSkipped('Set CONSULTATION_PG_TESTS=1 with a dedicated PostgreSQL database to run concurrency tests.');
        }

        foreach (['CONSULTATION_PG_DATABASE', 'CONSULTATION_PG_USERNAME'] as $name) {
            $value = getenv($name);
            if (! is_string($value) || trim($value) === '') {
                $this->markTestSkipped("Missing {$name} for PostgreSQL concurrency tests.");
            }
        }

        $this->originalDefaultConnection = (string) config('database.default');
        config([
            'database.connections.consultation_pg' => $this->postgresConnection(),
            'database.default' => 'consultation_pg',
        ]);
        DB::purge('consultation_pg');
        Artisan::call('migrate:fresh', ['--database' => 'consultation_pg', '--force' => true]);
    }

    protected function tearDown(): void
    {
        if (isset($this->originalDefaultConnection)) {
            DB::disconnect('consultation_pg');
            DB::purge('consultation_pg');
            config(['database.default' => $this->originalDefaultConnection]);
        }

        parent::tearDown();
    }

    public function test_two_postgres_requests_for_one_slot_create_one_booking(): void
    {
        $startsAt = $this->nextWeekday()->setTime(10, 0);
        $tier = ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        ConsultationAvailabilityWindow::create([
            'weekday' => $startsAt->dayOfWeek,
            'start_time' => '10:00:00',
            'end_time' => '13:00:00',
            'is_active' => true,
        ]);

        $results = $this->runWorkers('booking', $startsAt->toIso8601String());

        $this->assertSame(1, ConsultationBooking::query()->count());
        $this->assertCount(2, $results);
        $this->assertSame(1, count(array_filter($results, fn (string $result): bool => str_starts_with($result, 'ok'))));
        $this->assertSame($tier->id, ConsultationBooking::query()->value('consultation_tier_id'));
    }

    public function test_two_postgres_workers_claim_one_google_operation(): void
    {
        $tier = ConsultationTier::query()->where('slug', 'max')->firstOrFail();
        $startsAt = $this->nextWeekday()->setTime(10, 0);
        $booking = ConsultationBooking::create([
            'consultation_tier_id' => $tier->id,
            'client_name' => 'Operation race',
            'client_email' => 'operation-race@example.com',
            'starts_at' => $startsAt,
            'ends_at' => $startsAt->copy()->addMinutes($tier->duration_minutes),
            'status' => ConsultationBooking::STATUS_CONFIRMED,
            'list_price_cents' => $tier->price_cents,
            'amount_due_cents' => $tier->price_cents,
            'currency' => 'usd',
            'meet_link' => 'https://meet.google.com/race-room',
            'access_token_hash' => hash('sha256', 'operation-race'),
        ]);
        $operation = ConsultationGoogleOperation::create([
            'consultation_booking_id' => $booking->id,
            'operation_key' => 'consultation-booking-'.$booking->id.'-google-meet_recording',
            'operation' => 'meet_recording',
            'payload' => ['meet_link' => $booking->meet_link],
            'status' => ConsultationGoogleOperation::STATUS_FAILED,
            'attempts' => 0,
            'available_at' => now('UTC')->subMinute(),
        ]);

        $this->runWorkers('google');

        $this->assertSame(1, $operation->fresh()->attempts);
        $this->assertSame(ConsultationGoogleOperation::STATUS_FAILED, $operation->fresh()->status);
    }

    /** @return list<string> */
    private function runWorkers(string $action, ?string $startsAt = null): array
    {
        $barrier = tempnam(sys_get_temp_dir(), 'consultation-pg-barrier-');
        $script = <<<'PHP'
require $argv[1].'/vendor/autoload.php';
$app = require $argv[1].'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config([
    'database.connections.consultation_pg' => [
        'driver' => 'pgsql',
        'host' => getenv('CONSULTATION_PG_HOST') ?: '127.0.0.1',
        'port' => getenv('CONSULTATION_PG_PORT') ?: 5432,
        'database' => getenv('CONSULTATION_PG_DATABASE'),
        'username' => getenv('CONSULTATION_PG_USERNAME'),
        'password' => getenv('CONSULTATION_PG_PASSWORD') ?: null,
        'charset' => 'utf8',
        'prefix' => '',
        'prefix_indexes' => true,
        'search_path' => 'public',
        'sslmode' => getenv('CONSULTATION_PG_SSLMODE') ?: 'prefer',
    ],
    'database.default' => 'consultation_pg',
]);
\Illuminate\Support\Facades\DB::purge('consultation_pg');
$barrier = fopen($argv[2], 'c+');
flock($barrier, LOCK_EX);
$contents = stream_get_contents($barrier);
$count = (int) trim($contents ?: '0');
ftruncate($barrier, 0);
rewind($barrier);
fwrite($barrier, (string) ($count + 1));
fflush($barrier);
flock($barrier, LOCK_UN);
do {
    usleep(10000);
    $ready = (int) trim((string) file_get_contents($argv[2]));
} while ($ready < 2);

try {
    if ($argv[3] === 'booking') {
        $tier = \App\Models\ConsultationTier::query()->where('slug', 'light')->firstOrFail();
        app(\App\Services\Consultation\BookingWorkflowService::class)->requestBooking(
            $tier,
            'Concurrent client',
            'concurrent@example.com',
            null,
            \Carbon\Carbon::parse($argv[4])->utc(),
        );
        echo 'ok';
    } else {
        app(\App\Services\Consultation\ConsultationGoogleOperationService::class)->retryDue(
            app(\App\Services\Consultation\BookingWorkflowService::class),
        );
        echo 'ok';
    }
} catch (\Throwable $exception) {
    echo 'error:'.$exception->getMessage();
}
PHP;

        $processes = [];
        for ($i = 0; $i < 2; $i++) {
            $pipes = [];
            $processes[] = [
                'process' => proc_open(
                    [PHP_BINARY, '-r', $script, base_path(), $barrier, $action, $startsAt ?? ''],
                    [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
                    $pipes,
                ),
                'pipes' => $pipes,
            ];
        }

        $results = [];
        foreach ($processes as $entry) {
            $results[] = trim(stream_get_contents($entry['pipes'][1]).stream_get_contents($entry['pipes'][2]));
            fclose($entry['pipes'][1]);
            fclose($entry['pipes'][2]);
            proc_close($entry['process']);
        }

        @unlink($barrier);

        return $results;
    }

    /** @return array<string, mixed> */
    private function postgresConnection(): array
    {
        return [
            'driver' => 'pgsql',
            'host' => getenv('CONSULTATION_PG_HOST') ?: '127.0.0.1',
            'port' => getenv('CONSULTATION_PG_PORT') ?: 5432,
            'database' => getenv('CONSULTATION_PG_DATABASE'),
            'username' => getenv('CONSULTATION_PG_USERNAME'),
            'password' => getenv('CONSULTATION_PG_PASSWORD') ?: null,
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => getenv('CONSULTATION_PG_SSLMODE') ?: 'prefer',
        ];
    }

    private function nextWeekday(): Carbon
    {
        $date = now('UTC')->addDays(5)->startOfDay();

        while ($date->isWeekend()) {
            $date->addDay();
        }

        return $date;
    }
}
