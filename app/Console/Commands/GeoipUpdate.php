<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use PharData;
use Throwable;

/**
 * Downloads the free GeoLite2-Country database from MaxMind.
 *
 * MaxMind ships it as a gzipped tarball whose single .mmdb sits inside a
 * date-stamped directory, so we extract to a temp dir, locate the .mmdb, and
 * move it into place. The final swap uses rename() so a concurrent request
 * reads either the old database or the new one, never a half-written file.
 */
#[Signature('geoip:update {--force : Replace the database even if it looks current}')]
#[Description('Download or refresh the MaxMind GeoLite2-Country database')]
class GeoipUpdate extends Command
{
    private const EDITION = 'GeoLite2-Country';

    public function handle(): int
    {
        $licenseKey = config('services.maxmind.license_key');

        if (! $licenseKey) {
            $this->error('MAXMIND_LICENSE_KEY is not set.');
            $this->line('Create a free account at https://www.maxmind.com/en/geolite2/signup,');
            $this->line('generate a license key, then add MAXMIND_LICENSE_KEY to your .env.');

            return self::FAILURE;
        }

        $destination = config('services.maxmind.database');

        if (! $this->shouldDownload($destination)) {
            $this->info('Database is less than a week old. Use --force to refresh anyway.');

            return self::SUCCESS;
        }

        $workDir = storage_path('app/geoip/.tmp-'.bin2hex(random_bytes(4)));

        try {
            return $this->download($licenseKey, $destination, $workDir);
        } catch (Throwable $e) {
            $this->error('Update failed: '.$e->getMessage());

            return self::FAILURE;
        } finally {
            $this->deleteDirectory($workDir);
        }
    }

    private function shouldDownload(string $destination): bool
    {
        return $this->option('force')
            || ! is_file($destination)
            || filemtime($destination) < now()->subWeek()->getTimestamp();
    }

    private function download(string $licenseKey, string $destination, string $workDir): int
    {
        @mkdir($workDir, 0755, true);
        @mkdir(dirname($destination), 0755, true);

        $archive = $workDir.'/'.self::EDITION.'.tar.gz';

        $this->info('Downloading '.self::EDITION.' from MaxMind...');

        $response = Http::timeout(120)->sink($archive)->get(
            'https://download.maxmind.com/app/geoip_download',
            [
                'edition_id' => self::EDITION,
                'license_key' => $licenseKey,
                'suffix' => 'tar.gz',
            ],
        );

        if (! $response->successful()) {
            $this->error("MaxMind returned HTTP {$response->status()}.");

            if ($response->status() === 401) {
                $this->line('That usually means the license key is wrong or has been revoked.');
            }

            return self::FAILURE;
        }

        $this->info('Extracting...');

        (new PharData($archive))->decompress()->extractTo($workDir, null, true);

        $extracted = $this->findDatabase($workDir);

        if ($extracted === null) {
            $this->error('No .mmdb file was found inside the archive.');

            return self::FAILURE;
        }

        if (! @rename($extracted, $destination)) {
            $this->error("Could not move the database into {$destination}.");

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Updated %s (%.1f MB).',
            $destination,
            filesize($destination) / 1024 / 1024,
        ));

        return self::SUCCESS;
    }

    private function findDatabase(string $directory): ?string
    {
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
        );

        foreach ($files as $file) {
            if ($file->isFile() && $file->getExtension() === 'mmdb') {
                return $file->getPathname();
            }
        }

        return null;
    }

    private function deleteDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            return;
        }

        $entries = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($entries as $entry) {
            $entry->isDir() ? @rmdir($entry->getPathname()) : @unlink($entry->getPathname());
        }

        @rmdir($directory);
    }
}
