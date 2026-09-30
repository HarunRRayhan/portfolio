<?php

use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationBooking;
use App\Models\ConsultationGoogleCredential;
use App\Models\ConsultationTier;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;

// This fixture is CLI-only and may only change the browser runner's temporary DB.
if (PHP_SAPI !== 'cli' || getenv('BROWSER_TEST_RUN') !== '1') {
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

ConsultationGoogleCredential::query()->delete();
$user = User::firstOrNew(['email' => 'browser-admin@example.test']);
$user->forceFill([
    'name' => 'Browser test admin',
    'password' => Hash::make('browser-tests-only'),
    'role' => 'admin',
    'email_verified_at' => now(),
])->save();

ConsultationAvailabilityWindow::query()->delete();
ConsultationAvailabilityWindow::create([
    'weekday' => 1, 'start_time' => '10:00:00', 'end_time' => '16:00:00', 'is_active' => true,
]);

$tier = ConsultationTier::where('slug', 'light')->firstOrFail();
ConsultationBooking::create([
    'consultation_tier_id' => $tier->id,
    'client_name' => 'Browser validation client',
    'client_email' => 'browser-client@example.test',
    'starts_at' => now()->addDays(7),
    'ends_at' => now()->addDays(7)->addMinutes(30),
    'status' => 'pending_approval',
    'list_price_cents' => 24900,
    'amount_due_cents' => 14900,
    'access_token_hash' => hash('sha256', random_bytes(32)),
]);

for ($i = 1; $i <= 26; $i++) {
    ConsultationBooking::create([
        'consultation_tier_id' => $tier->id,
        'client_name' => 'Browser pagination client '.$i,
        'client_email' => 'browser-page-'.$i.'@example.test',
        'company_name' => 'Browser Pagination Co',
        'starts_at' => now()->subDays($i),
        'ends_at' => now()->subDays($i)->addMinutes(30),
        'status' => 'confirmed',
        'list_price_cents' => 24900,
        'amount_due_cents' => 14900,
        'access_token_hash' => hash('sha256', random_bytes(32)),
    ]);
}
foreach (['paid', 'unpaid', 'refunded'] as $payment) {
    ConsultationBooking::create([
        'consultation_tier_id' => $tier->id,
        'client_name' => 'Browser '.$payment.' cancellation',
        'client_email' => 'browser-'.$payment.'@example.test',
        'starts_at' => now()->addDays(14),
        'ends_at' => now()->addDays(14)->addMinutes(30),
        'status' => 'cancel_requested',
        'list_price_cents' => 24900,
        'amount_due_cents' => 14900,
        'stripe_payment_intent_id' => $payment === 'unpaid' ? null : 'pi_browser_fixture_only',
        'stripe_paid_at' => $payment === 'unpaid' ? null : now(),
        'stripe_refund_id' => $payment === 'refunded' ? 're_browser_fixture_only' : null,
        'stripe_refunded_at' => $payment === 'refunded' ? now() : null,
        'access_token_hash' => hash('sha256', random_bytes(32)),
    ]);
}
