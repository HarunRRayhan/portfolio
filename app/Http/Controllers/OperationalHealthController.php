<?php

namespace App\Http\Controllers;

use App\Services\Operations\DatabaseProbe;
use Illuminate\Database\Connection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Throwable;

class OperationalHealthController extends Controller
{
    private ?Connection $probe = null;

    public function web(): JsonResponse
    {
        $checks = ['database' => $this->databaseReady(), 'assets' => $this->assetsReady()];

        return $this->response($checks);
    }

    public function scheduler(): JsonResponse
    {
        $database = $this->databaseReady();
        $heartbeat = null;
        $fresh = false;
        if ($database) {
            try {
                $row = $this->probe->table('service_heartbeats')->where('service', 'scheduler')->first();
                if ($row) {
                    $lastSeen = Carbon::parse($row->last_seen_at, 'UTC');
                    $age = now('UTC')->timestamp - $lastSeen->timestamp;
                    $fresh = $age >= 0 && $age <= (int) config('operations.scheduler_max_age_seconds');
                    $heartbeat = [
                        'last_seen_at' => $lastSeen->toIso8601String(),
                        'build_version' => $row->build_version,
                        'deployment_id' => $row->deployment_id,
                    ];
                }
            } catch (Throwable) {
                // An absent table or unreadable heartbeat remains unhealthy.
            }
        }

        return $this->response(['database' => $database, 'scheduler' => $fresh], ['scheduler' => $heartbeat]);
    }

    private function databaseReady(): bool
    {
        try {
            $this->probe = app(DatabaseProbe::class)->connection();
            $this->probe->select('SELECT 1');
            $this->probe->table('service_heartbeats')->limit(1)->get();

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    private function assetsReady(): bool
    {
        try {
            $path = (string) config('operations.manifest_path');
            if (! is_file($path)) {
                return false;
            }
            $manifest = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($manifest) || ! isset($manifest['resources/js/app.tsx']['file'])) {
                return false;
            }
            $root = realpath(dirname($path)).DIRECTORY_SEPARATOR;
            foreach ($manifest as $entry) {
                if (! is_array($entry) || ! isset($entry['file'])) {
                    return false;
                }
                foreach ([$entry['file'], ...($entry['css'] ?? []), ...($entry['assets'] ?? [])] as $relative) {
                    if (! is_string($relative)) {
                        return false;
                    }
                    $asset = realpath($root.$relative);
                    if ($asset === false || ! str_starts_with($asset, $root) || ! is_file($asset)) {
                        return false;
                    }
                }
            }

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /** @param array<string, bool> $checks */
    private function response(array $checks, array $extra = []): JsonResponse
    {
        $ready = ! in_array(false, $checks, true);
        $version = config('app.build_version', 'local');
        $deployment = config('app.deployment_id', 'local');

        return response()->json([
            'status' => $ready ? 'ok' : 'degraded',
            'checks' => $checks,
            'build_version' => $version,
            'deployment_id' => $deployment,
            'timestamp' => now('UTC')->toIso8601String(),
            ...$extra,
        ], $ready ? 200 : 503)->header('X-App-Version', $version)
            ->header('X-Deployment-Id', $deployment)->header('Cache-Control', 'no-store');
    }
}
