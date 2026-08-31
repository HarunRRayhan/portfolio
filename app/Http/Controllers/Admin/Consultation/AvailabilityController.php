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
            'windows.*.end_time' => ['required', 'date_format:H:i'],
            'windows.*.is_active' => ['sometimes', 'boolean'],
        ]);

        ConsultationSetting::setValue('schedule_timezone', $data['schedule_timezone']);

        DB::transaction(function () use ($data) {
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
