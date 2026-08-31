<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ConsultationSetting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, ?string $default = null): ?string
    {
        return Cache::remember("consultation_setting:{$key}", 60, function () use ($key, $default) {
            $row = static::query()->where('key', $key)->first();

            return $row?->value ?? $default;
        });
    }

    public static function setValue(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("consultation_setting:{$key}");
    }

    public static function scheduleTimezone(): string
    {
        return static::getValue('schedule_timezone', config('consultation.default_schedule_timezone', 'UTC')) ?: 'UTC';
    }
}
