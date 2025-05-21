<?php
// This wrapper ensures the site is always available even when Laravel has database issues
try {
    // Try to run the normal Laravel application
    require_once __DIR__.'/../vendor/autoload.php';
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    );
    $response->send();
    $kernel->terminate($request, $response);
} catch (Exception $e) {
    // On any error, show the fallback page
    require_once __DIR__.'/fallback.php';
}
