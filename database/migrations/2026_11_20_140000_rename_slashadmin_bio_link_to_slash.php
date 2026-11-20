<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private const URL = 'https://app.slash.com/i/harun';

    public function up(): void
    {
        BioLink::where('url', self::URL)->update(['label' => 'Slash']);
    }

    public function down(): void
    {
        BioLink::where('url', self::URL)->update(['label' => 'SlashAdmin']);
    }
};
