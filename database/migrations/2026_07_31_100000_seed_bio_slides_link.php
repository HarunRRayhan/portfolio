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

        BioLink::updateOrCreate(
            ['url' => '/slides'],
            [
                'label' => 'Slides',
                'description' => "Decks from talks I've given.",
                'icon' => 'presentation',
                'tab' => 'Others',
                'priority' => 10,
                'is_active' => true,
                'featured' => false,
            ]
        );
    }

    public function down(): void
    {
        BioLink::where('url', '/slides')->delete();
    }
};
