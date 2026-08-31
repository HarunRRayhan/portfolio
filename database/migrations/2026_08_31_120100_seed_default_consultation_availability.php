<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $rows = [];

        foreach ([1, 2, 3, 4, 5] as $weekday) {
            $rows[] = [
                'weekday' => $weekday,
                'start_time' => '10:00:00',
                'end_time' => '13:00:00',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            $rows[] = [
                'weekday' => $weekday,
                'start_time' => '20:00:00',
                'end_time' => '23:00:00',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('consultation_availability_windows')->insert($rows);
    }

    public function down(): void
    {
        DB::table('consultation_availability_windows')->truncate();
    }
};
