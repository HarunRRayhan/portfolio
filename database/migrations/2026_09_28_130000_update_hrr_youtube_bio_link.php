<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        BioLink::query()
            ->where('locale', 'bn')
            ->where('icon', 'youtube')
            ->get()
            ->each(fn (BioLink $link) => $link->update([
                'url' => 'https://www.youtube.com/@HarunRRayhan',
            ]));
    }

    public function down(): void
    {
        BioLink::query()
            ->where('locale', 'bn')
            ->where('icon', 'youtube')
            ->where('url', 'https://www.youtube.com/@HarunRRayhan')
            ->get()
            ->each(fn (BioLink $link) => $link->update([
                'url' => 'https://youtube.com/@skillupwithharun',
            ]));
    }
};
