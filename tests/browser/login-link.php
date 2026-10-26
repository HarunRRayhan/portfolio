<?php

use App\Models\MagicLoginToken;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Str;

// CLI-only: mints a magic-link token in the browser runner's temporary DB and prints its URL.
if (PHP_SAPI !== 'cli' || getenv('BROWSER_TEST_RUN') !== '1' || empty($argv[1])) {
    exit(1);
}

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = realpath(config('database.connections.sqlite.database'));
$temporaryRoot = realpath(sys_get_temp_dir());
if (config('database.default') !== 'sqlite' || ! $database || ! $temporaryRoot
    || ! str_starts_with($database, $temporaryRoot.DIRECTORY_SEPARATOR.'harundev-browser-')) {
    throw new RuntimeException('Browser fixtures require the isolated runner database.');
}

$plain = Str::random(48);
MagicLoginToken::create([
    'email' => strtolower($argv[1]),
    'token_hash' => hash('sha256', $plain),
    'expires_at' => now()->addMinutes(15),
]);

echo route('magic-link.show', $plain);
