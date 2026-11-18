<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// bKash would have meant sharing a personal phone number; Bangladesh pays by bank transfer instead.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', fn (Blueprint $table) => $table->renameColumn('payer_phone', 'payer_account'));
        Schema::table('payment_requests', fn (Blueprint $table) => $table->string('payer_account', 120)->nullable()->change());
        DB::table('payment_requests')->where('method', 'bkash')->update(['method' => 'bank']);
    }

    public function down(): void
    {
        Schema::table('payment_requests', fn (Blueprint $table) => $table->renameColumn('payer_account', 'payer_phone'));
    }
};
