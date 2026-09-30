<?php

namespace App\Services\Operations;

use Illuminate\Database\Connection;
use Illuminate\Database\PostgresConnection;
use Illuminate\Support\Facades\DB;

class DatabaseProbe
{
    public function connection(): Connection
    {
        $connection = DB::connection();
        $config = $connection->getConfig();
        if ($connection->getDriverName() !== 'pgsql') {
            return $connection;
        }

        $pdo = (new ProbePostgresConnector)->connect($config);

        return new PostgresConnection($pdo, $config['database'], $config['prefix'] ?? '', $config);
    }
}
