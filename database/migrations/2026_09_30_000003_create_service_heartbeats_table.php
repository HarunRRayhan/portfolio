<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_heartbeats', function (Blueprint $table) {
            $table->string('service')->primary();
            $table->timestampTz('last_seen_at');
            $table->string('build_version');
            $table->string('deployment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_heartbeats');
    }
};
