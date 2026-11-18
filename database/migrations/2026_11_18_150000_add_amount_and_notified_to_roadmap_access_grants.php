<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roadmap_access_grants', function (Blueprint $table) {
            $table->unsignedInteger('amount_cents')->nullable(); // what they paid; 100 XP per dollar
            $table->timestamp('notified_at')->nullable(); // "access unlocked" email sent
        });

        // Existing grants were sold at the plan prices, so the length tells the amount: a month $5, a year $10, life $100.
        foreach (DB::table('roadmap_access_grants')->whereNull('revoked_at')->get() as $g) {
            $days = (strtotime($g->expires_at) - strtotime($g->created_at)) / 86400;
            DB::table('roadmap_access_grants')->where('id', $g->id)->update([
                'amount_cents' => $days > 365 * 20 ? 10000 : ($days >= 300 ? 1000 : 500),
            ]);
        }
        // Approved pay-another-way requests already sent their own email; manual grants never did, so the scheduler sends those.
        DB::table('roadmap_access_grants')->whereIn('id', DB::table('payment_requests')->whereNotNull('grant_id')->select('grant_id'))->update(['notified_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('roadmap_access_grants', fn (Blueprint $table) => $table->dropColumn(['amount_cents', 'notified_at']));
    }
};
