<?php

namespace App\Services\Operations;

use Illuminate\Database\Connectors\PostgresConnector;
use PDO;

/** A separate, nonpersistent connection; readiness never changes application sessions. */
class ProbePostgresConnector extends PostgresConnector
{
    protected function getDsn(array $config)
    {
        return parent::getDsn($config).";options='--statement_timeout=2000'";
    }

    public function getOptions(array $config)
    {
        return [PDO::ATTR_TIMEOUT => 3, PDO::ATTR_PERSISTENT => false] + parent::getOptions($config);
    }

    public function createConnection($dsn, array $config, array $options)
    {
        // No automatic reconnect/retry: every failed probe has a bounded budget.
        return $this->createPdoConnection($dsn, $config['username'] ?? null, $config['password'] ?? null, $options);
    }
}
