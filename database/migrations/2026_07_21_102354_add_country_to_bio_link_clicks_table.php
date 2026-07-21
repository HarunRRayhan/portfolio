<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bio_link_clicks', function (Blueprint $table) {
            // ISO 3166-1 alpha-2, resolved at click time. Nullable because the
            // GeoLite2 database is optional and private IPs never resolve.
            $table->char('country', 2)->nullable()->after('ip_address');

            // Every analytics query filters by link and groups over a date range.
            $table->index(['bio_link_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('bio_link_clicks', function (Blueprint $table) {
            $table->dropIndex(['bio_link_id', 'created_at']);
            $table->dropColumn('country');
        });
    }
};
