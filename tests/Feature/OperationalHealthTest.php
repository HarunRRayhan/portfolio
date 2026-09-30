<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OperationalHealthTest extends TestCase
{
    use RefreshDatabase;

    private string $assets;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assets = sys_get_temp_dir().'/harundev-health-'.bin2hex(random_bytes(8));
        mkdir($this->assets.'/assets', 0777, true);
        file_put_contents($this->assets.'/assets/app.js', 'console.log("fixture");');
        file_put_contents($this->assets.'/assets/app.css', 'body{}');
        file_put_contents($this->assets.'/manifest.json', json_encode(['resources/js/app.tsx' => ['file' => 'assets/app.js', 'css' => ['assets/app.css']]]));
        config(['operations.manifest_path' => $this->assets.'/manifest.json', 'app.build_version' => 'release-test-sha', 'app.deployment_id' => 'deployment-test-id']);
    }

    protected function tearDown(): void
    {
        @unlink($this->assets.'/assets/app.js');
        @unlink($this->assets.'/assets/app.css');
        @unlink($this->assets.'/manifest.json');
        @rmdir($this->assets.'/assets');
        @rmdir($this->assets);
        parent::tearDown();
    }

    public function test_web_readiness_checks_database_and_assets_without_requiring_scheduler(): void
    {
        $this->getJson('/health')->assertOk()->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database', true)->assertJsonPath('checks.assets', true)
            ->assertJsonPath('build_version', 'release-test-sha')->assertHeader('X-Deployment-Id', 'deployment-test-id')
            ->assertHeaderMissing('Set-Cookie');
    }

    public function test_missing_manifest_chunk_makes_web_unready(): void
    {
        unlink($this->assets.'/assets/app.js');
        $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.assets', false)->assertJsonPath('checks.database', true);
    }

    public function test_missing_lazy_page_chunk_makes_web_unready(): void
    {
        file_put_contents($this->assets.'/manifest.json', json_encode([
            'resources/js/app.tsx' => ['file' => 'assets/app.js'],
            'resources/js/Pages/Contact.tsx' => ['file' => 'assets/missing-contact.js', 'isDynamicEntry' => true],
        ]));
        $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.assets', false);
    }

    public function test_missing_operational_schema_prevents_web_readiness(): void
    {
        Schema::drop('service_heartbeats');
        $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.database', false);
    }

    public function test_invalid_manifest_makes_web_unready_without_leaking_paths(): void
    {
        file_put_contents($this->assets.'/manifest.json', 'invalid json');
        $response = $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.assets', false);
        $this->assertStringNotContainsString($this->assets, $response->getContent());
    }

    public function test_failed_database_makes_web_unready_without_exposing_connection_details(): void
    {
        config(['database.default' => 'unavailable', 'database.connections.unavailable' => ['driver' => 'sqlite', 'database' => '/nonexistent/health-database-secret.sqlite', 'prefix' => '']]);
        try {
            $response = $this->getJson('/health')->assertStatus(503)->assertJsonPath('checks.database', false);
            $this->assertStringNotContainsString('health-database-secret', $response->getContent());
        } finally {
            config(['database.default' => 'sqlite']);
        }
    }

    public function test_scheduler_health_reports_missing_or_stale_heartbeats(): void
    {
        $this->getJson('/health/scheduler')->assertStatus(503)->assertJsonPath('checks.scheduler', false);
        DB::table('service_heartbeats')->insert(['service' => 'scheduler', 'last_seen_at' => now()->subMinutes(6), 'build_version' => 'old-sha', 'deployment_id' => 'old-id']);
        $this->getJson('/health/scheduler')->assertStatus(503)->assertJsonPath('checks.scheduler', false);
    }

    public function test_scheduler_health_reports_fresh_tick_and_its_own_release(): void
    {
        DB::table('service_heartbeats')->insert(['service' => 'scheduler', 'last_seen_at' => now(), 'build_version' => 'scheduler-sha', 'deployment_id' => 'scheduler-id']);
        $this->getJson('/health/scheduler')->assertOk()->assertJsonPath('checks.scheduler', true)
            ->assertJsonPath('scheduler.build_version', 'scheduler-sha')->assertJsonPath('scheduler.deployment_id', 'scheduler-id');
    }
}
