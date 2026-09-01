<?php

namespace App\Http\Controllers\Admin\Consultation;

use App\Http\Controllers\Controller;
use App\Models\ConsultationAvailabilityWindow;
use App\Models\ConsultationGoogleCredential;
use App\Models\ConsultationSetting;
use App\Services\Consultation\GoogleCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AvailabilityController extends Controller
{
    public function edit(GoogleCalendarService $google): Response
    {
        return Inertia::render('Admin/Consultations/Availability', [
            'scheduleTimezone' => ConsultationSetting::scheduleTimezone(),
            'windows' => ConsultationAvailabilityWindow::query()->orderBy('weekday')->orderBy('start_time')->get()->map(fn ($w) => [
                'id' => $w->id,
                'weekday' => $w->weekday,
                'start_time' => substr((string) $w->start_time, 0, 5),
                'end_time' => substr((string) $w->end_time, 0, 5),
                'is_active' => $w->is_active,
            ]),
            'googleConnected' => $google->isConnected(),
            'googleEmail' => ConsultationGoogleCredential::current()?->email,
            'timezones' => timezone_identifiers_list(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'schedule_timezone' => ['required', 'timezone'],
            'windows' => ['present', 'array'],
            'windows.*.weekday' => ['required', 'integer', 'between:0,6'],
            'windows.*.start_time' => ['required', 'date_format:H:i'],
            'windows.*.end_time' => ['required', 'date_format:H:i', 'after:windows.*.start_time'],
            'windows.*.is_active' => ['sometimes', 'boolean'],
        ]);

        $windowsByWeekday = collect($data['windows'])
            ->filter(fn (array $window): bool => (bool) ($window['is_active'] ?? true))
            ->groupBy('weekday');

        foreach ($windowsByWeekday as $windows) {
            $previousEnd = null;

            foreach ($windows->sortBy('start_time') as $window) {
                if ($previousEnd !== null && $window['start_time'] < $previousEnd) {
                    throw ValidationException::withMessages([
                        'windows' => 'Active availability windows cannot overlap on the same day.',
                    ]);
                }

                $previousEnd = max($previousEnd ?? $window['end_time'], $window['end_time']);
            }
        }

        DB::transaction(function () use ($data) {
            $setting = ConsultationSetting::query()
                ->where('key', 'schedule_timezone')
                ->lockForUpdate()
                ->firstOrFail();
            $setting->value = $data['schedule_timezone'];
            $setting->save();
            cache()->forget('consultation_setting:schedule_timezone');

            ConsultationAvailabilityWindow::query()->delete();

            foreach ($data['windows'] as $window) {
                ConsultationAvailabilityWindow::create([
                    'weekday' => $window['weekday'],
                    'start_time' => $window['start_time'].':00',
                    'end_time' => $window['end_time'].':00',
                    'is_active' => $window['is_active'] ?? true,
                ]);
            }
        });

        return back()->with('flash', ['type' => 'success', 'message' => 'Availability saved.']);
    }
}
