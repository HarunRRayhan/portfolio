<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->text('admin_note')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $table) {
            $table->string('admin_note')->nullable()->change();
        });
    }
};
