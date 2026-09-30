<?php

namespace Tests\Feature;

use App\Services\Operations\DatabaseProbe;
use App\Services\Operations\ProbePostgresConnector;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use PDO;
use Tests\TestCase;

class OperationalPostgresHealthTest extends TestCase
{
    public function test_dedicated_probe_limits_statements_without_changing_application_session(): void
    {
        if (getenv('CONSULTATION_PG_TESTS') !== '1') {
            $this->markTestSkipped('Requires the isolated PostgreSQL CI service.');
        }
        config(['database.connections.operations_pg' => [
            'driver' => 'pgsql', 'host' => getenv('CONSULTATION_PG_HOST') ?: '127.0.0.1',
            'port' => getenv('CONSULTATION_PG_PORT') ?: '5432', 'database' => getenv('CONSULTATION_PG_DATABASE'),
            'username' => getenv('CONSULTATION_PG_USERNAME'), 'password' => getenv('CONSULTATION_PG_PASSWORD'),
            'charset' => 'utf8', 'prefix' => '', 'search_path' => 'public', 'sslmode' => 'disable',
        ]]);
        $original = config('database.default');
        config(['database.default' => 'operations_pg']);
        try {
            $applicationTimeout = DB::selectOne('SHOW statement_timeout')->statement_timeout;
            $probe = app(DatabaseProbe::class)->connection();
            $this->assertSame('2s', $probe->selectOne('SHOW statement_timeout')->statement_timeout);
            $this->assertSame(3, (new ProbePostgresConnector)->getOptions([])[PDO::ATTR_TIMEOUT]);
            $start = microtime(true);
            try {
                $probe->select('SELECT pg_sleep(4)');
                $this->fail('The probe statement timeout must cancel slow SQL.');
            } catch (QueryException $exception) {
                $this->assertSame('57014', $exception->getPrevious()->getCode());
                $this->assertLessThan(3.5, microtime(true) - $start);
            }
            $this->assertSame($applicationTimeout, DB::selectOne('SHOW statement_timeout')->statement_timeout);
        } finally {
            DB::purge('operations_pg');
            config(['database.default' => $original]);
        }
    }
}
