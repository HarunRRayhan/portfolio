<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Sponsorships recorded before monthly_price_cents existed: read the amount from the stored webhook bodies.
return new class extends Migration
{
    public function up(): void
    {
        $prices = [];
        DB::table('github_webhook_events')->where('event', 'sponsorship')->whereIn('action', ['created', 'tier_changed'])
            ->orderBy('id')->each(function ($e) use (&$prices) {
                $sp = json_decode($e->payload, true)['sponsorship'] ?? [];
                if (isset($sp['node_id'], $sp['tier']['monthly_price_in_cents'])) {
                    $prices[$sp['node_id']] = (int) $sp['tier']['monthly_price_in_cents']; // latest event wins
                }
            });

        foreach ($prices as $nodeId => $cents) {
            DB::table('github_sponsorships')->where('github_sponsorship_node_id', $nodeId)
                ->whereNull('monthly_price_cents')->update(['monthly_price_cents' => $cents]);
        }
    }

    public function down(): void {}
};
