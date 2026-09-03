<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            $now = now();

            DB::table('consultation_settings')->updateOrInsert(
                ['key' => 'schedule_timezone'],
                [
                    'value' => 'Asia/Dhaka',
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );

            DB::table('consultation_availability_windows')->delete();

            $windows = [];
            foreach ([1, 2, 3, 4, 6] as $weekday) {
                $windows[] = $this->window($weekday, '10:00:00', '12:30:00', $now);
                $windows[] = $this->window($weekday, '14:30:00', '20:00:00', $now);
            }

            $windows[] = $this->window(5, '10:00:00', '11:30:00', $now);
            $windows[] = $this->window(5, '15:00:00', '20:00:00', $now);

            DB::table('consultation_availability_windows')->insert($windows);
        });
    }

    public function down(): void
    {
        DB::transaction(function (): void {
            $now = now();

            DB::table('consultation_settings')
                ->where('key', 'schedule_timezone')
                ->update([
                    'value' => 'UTC',
                    'updated_at' => $now,
                ]);

            DB::table('consultation_availability_windows')->delete();

            $windows = [];
            foreach ([1, 2, 3, 4, 5] as $weekday) {
                $windows[] = $this->window($weekday, '10:00:00', '13:00:00', $now);
                $windows[] = $this->window($weekday, '20:00:00', '23:00:00', $now);
            }

            DB::table('consultation_availability_windows')->insert($windows);
        });
    }

    /**
     * @return array{weekday: int, start_time: string, end_time: string, is_active: bool, created_at: mixed, updated_at: mixed}
     */
    private function window(int $weekday, string $start, string $end, mixed $now): array
    {
        return [
            'weekday' => $weekday,
            'start_time' => $start,
            'end_time' => $end,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
};
