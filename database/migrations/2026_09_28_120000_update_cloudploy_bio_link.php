<?php

use App\Models\BioLink;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        BioLink::query()
            ->where('url', 'https://ploy.cloud')
            ->get()
            ->each(function (BioLink $link): void {
                $link->update([
                    'label' => 'CloudPloy',
                    'url' => 'https://cloudploy.com',
                    'description' => 'Deploy apps from Claude Code, Cursor, or any MCP client',
                ]);
            });
    }

    public function down(): void
    {
        BioLink::query()
            ->where('url', 'https://cloudploy.com')
            ->where('label', 'CloudPloy')
            ->get()
            ->each(function (BioLink $link): void {
                $link->update([
                    'label' => 'PloyCloud',
                    'url' => 'https://ploy.cloud',
                    'description' => 'Managed hosting for Laravel, WordPress, PHP, and Node.js',
                ]);
            });
    }
};
