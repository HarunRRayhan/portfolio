<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private const WRONG_URL = 'https://linkedin.com/in/harunrayhan';

    private const CORRECT_URL = 'https://www.linkedin.com/in/harunrrayhan/';

    public function up(): void
    {
        BioLink::where('url', self::WRONG_URL)
            ->each(fn (BioLink $link) => $link->update(['url' => self::CORRECT_URL]));
    }

    public function down(): void
    {
        BioLink::where('url', self::CORRECT_URL)
            ->each(fn (BioLink $link) => $link->update(['url' => self::WRONG_URL]));
    }
};
