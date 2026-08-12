<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        BioLink::where('icon', 'linkedin')->update([
            'url' => 'https://www.linkedin.com/in/harundotdev/',
        ]);
    }

    public function down(): void
    {
        BioLink::where('icon', 'linkedin')->update([
            'url' => 'https://www.linkedin.com/in/harunrrayhan/',
        ]);
    }
};
