<?php

namespace App\Services\Consultation;

use App\Models\ConsultationGoogleCredential;
use Carbon\Carbon;
use Google\Client as GoogleClient;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Oauth2;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    public function isConnected(): bool
    {
        $cred = ConsultationGoogleCredential::current();

        return $cred !== null && filled($cred->refresh_token);
    }

    public function oauthClient(): GoogleClient
    {
        $client = new GoogleClient;
        $client->setClientId(config('consultation.google.client_id'));
        $client->setClientSecret(config('consultation.google.client_secret'));
        $client->setRedirectUri(config('consultation.google.redirect'));
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setScopes(config('consultation.google.scopes'));

        return $client;
    }

    public function authorizationUrl(): string
    {
        return $this->oauthClient()->createAuthUrl();
    }

    public function handleCallback(string $code): ConsultationGoogleCredential
    {
        $client = $this->oauthClient();
        $token = $client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \RuntimeException('Google OAuth failed: '.($token['error_description'] ?? $token['error']));
        }

        $client->setAccessToken($token);
        $email = null;

        try {
            $oauth2 = new Oauth2($client);
            $email = $oauth2->userinfo->get()->getEmail();
        } catch (\Throwable $e) {
            Log::warning('Could not fetch Google user email', ['error' => $e->getMessage()]);
        }

        $existing = ConsultationGoogleCredential::current() ?? new ConsultationGoogleCredential;

        $existing->fill([
            'access_token' => json_encode($client->getAccessToken()),
            'refresh_token' => $token['refresh_token'] ?? $existing->refresh_token,
            'token_expires_at' => isset($token['expires_in'])
                ? now()->addSeconds((int) $token['expires_in'])
                : null,
            'email' => $email,
            'calendar_id' => $existing->calendar_id ?: config('consultation.calendar_id', 'primary'),
        ]);
        $existing->save();

        return $existing;
    }

    public function disconnect(): void
    {
        ConsultationGoogleCredential::query()->delete();
    }

    public function calendar(): ?Calendar
    {
        $client = $this->authenticatedClient();

        return $client ? new Calendar($client) : null;
    }

    public function authenticatedClient(): ?GoogleClient
    {
        $cred = ConsultationGoogleCredential::current();

        if (! $cred || ! filled($cred->refresh_token)) {
            return null;
        }

        $client = $this->oauthClient();
        $access = $cred->access_token ? json_decode($cred->access_token, true) : null;

        if (is_array($access)) {
            $client->setAccessToken($access);
        }

        if ($client->isAccessTokenExpired()) {
            $newToken = $client->fetchAccessTokenWithRefreshToken($cred->refresh_token);

            if (isset($newToken['error'])) {
                Log::error('Google token refresh failed', $newToken);

                return null;
            }

            $cred->access_token = json_encode($client->getAccessToken());
            $cred->token_expires_at = isset($newToken['expires_in'])
                ? now()->addSeconds((int) $newToken['expires_in'])
                : null;
            if (! empty($newToken['refresh_token'])) {
                $cred->refresh_token = $newToken['refresh_token'];
            }
            $cred->save();
        }

        return $client;
    }

    /**
     * @return list<array{start: Carbon, end: Carbon}>
     */
    public function busyPeriods(Carbon $timeMin, Carbon $timeMax): array
    {
        $calendar = $this->calendar();

        if (! $calendar) {
            return [];
        }

        $cred = ConsultationGoogleCredential::current();
        $calendarId = $cred?->calendar_id ?: 'primary';

        try {
            $freebusy = $calendar->freebusy->query(new Calendar\FreeBusyRequest([
                'timeMin' => $timeMin->copy()->utc()->toRfc3339String(),
                'timeMax' => $timeMax->copy()->utc()->toRfc3339String(),
                'items' => [['id' => $calendarId]],
            ]));

            $calendars = $freebusy->getCalendars();
            $busy = $calendars[$calendarId]?->getBusy() ?? [];
            $periods = [];

            foreach ($busy as $block) {
                $periods[] = [
                    'start' => Carbon::parse($block->getStart())->utc(),
                    'end' => Carbon::parse($block->getEnd())->utc(),
                ];
            }

            return $periods;
        } catch (\Throwable $e) {
            Log::error('Google freebusy failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    public function createHoldEvent(string $summary, Carbon $start, Carbon $end, string $description = ''): ?string
    {
        return $this->upsertEvent(null, $summary, $start, $end, $description, transparency: 'opaque', status: 'tentative', withMeet: false);
    }

    public function createConfirmedEvent(
        string $summary,
        Carbon $start,
        Carbon $end,
        string $description,
        string $attendeeEmail,
        bool $withMeet = true,
    ): ?array {
        $eventId = $this->upsertEvent(null, $summary, $start, $end, $description, 'opaque', 'confirmed', $withMeet, $attendeeEmail);

        if (! $eventId) {
            return null;
        }

        $calendar = $this->calendar();
        $cred = ConsultationGoogleCredential::current();
        $calendarId = $cred?->calendar_id ?: 'primary';
        $event = $calendar?->events->get($calendarId, $eventId);
        $meetLink = $event?->getHangoutLink();
        $spaceName = null;

        $entryPoints = $event?->getConferenceData()?->getEntryPoints() ?? [];
        foreach ($entryPoints as $entry) {
            if ($entry->getEntryPointType() === 'video' && $entry->getUri()) {
                $meetLink = $entry->getUri();
            }
        }

        $conferenceId = $event?->getConferenceData()?->getConferenceId();

        return [
            'event_id' => $eventId,
            'meet_link' => $meetLink,
            'conference_id' => $conferenceId,
        ];
    }

    public function updateEvent(
        string $eventId,
        string $summary,
        Carbon $start,
        Carbon $end,
        string $description = '',
        string $status = 'confirmed',
        bool $withMeet = false,
        ?string $attendeeEmail = null,
    ): ?string {
        return $this->upsertEvent($eventId, $summary, $start, $end, $description, 'opaque', $status, $withMeet, $attendeeEmail);
    }

    public function deleteEvent(?string $eventId): void
    {
        if (! $eventId) {
            return;
        }

        $calendar = $this->calendar();

        if (! $calendar) {
            return;
        }

        $cred = ConsultationGoogleCredential::current();
        $calendarId = $cred?->calendar_id ?: 'primary';

        try {
            $calendar->events->delete($calendarId, $eventId);
        } catch (\Throwable $e) {
            Log::warning('Failed to delete Google event', ['event' => $eventId, 'error' => $e->getMessage()]);
        }
    }

    public function enableMeetAutoRecording(?string $meetLink, ?string $conferenceId = null): bool
    {
        $client = $this->authenticatedClient();

        if (! $client || (! $meetLink && ! $conferenceId)) {
            return false;
        }

        $spaceName = $this->resolveMeetSpaceName($meetLink, $conferenceId);

        if (! $spaceName) {
            Log::warning('Could not resolve Meet space for auto-recording');

            return false;
        }

        $token = $client->getAccessToken();
        $accessToken = is_array($token) ? ($token['access_token'] ?? null) : null;

        if (! $accessToken) {
            return false;
        }

        $response = Http::withToken($accessToken)
            ->patch('https://meet.googleapis.com/v2/'.$spaceName.'?updateMask=config.artifactConfig.recordingConfig.autoRecordingGeneration', [
                'config' => [
                    'artifactConfig' => [
                        'recordingConfig' => [
                            'autoRecordingGeneration' => 'ON',
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            Log::warning('Meet auto-recording enable failed', [
                'space' => $spaceName,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;
        }

        return true;
    }

    protected function resolveMeetSpaceName(?string $meetLink, ?string $conferenceId): ?string
    {
        if ($conferenceId) {
            // Conference IDs from Calendar are often the meeting code; Meet spaces use spaces/{id}.
            if (str_starts_with($conferenceId, 'spaces/')) {
                return $conferenceId;
            }
        }

        if ($meetLink && preg_match('#meet\.google\.com/([a-z0-9\-]+)#i', $meetLink, $m)) {
            // Look up space by meeting code via Meet API spaces.get? — list is not available by code.
            // Create/get: spaces are named spaces/{space_id}. For Calendar-created Meet links,
            // patching via meeting code requires resolving. Use spaces.get with alias.
            return 'spaces/'.$m[1];
        }

        return $conferenceId ? 'spaces/'.$conferenceId : null;
    }

    protected function upsertEvent(
        ?string $eventId,
        string $summary,
        Carbon $start,
        Carbon $end,
        string $description,
        string $transparency,
        string $status,
        bool $withMeet,
        ?string $attendeeEmail = null,
    ): ?string {
        $calendar = $this->calendar();

        if (! $calendar) {
            return null;
        }

        $cred = ConsultationGoogleCredential::current();
        $calendarId = $cred?->calendar_id ?: 'primary';

        $event = new Event([
            'summary' => $summary,
            'description' => $description,
            'transparency' => $transparency,
            'status' => $status === 'tentative' ? 'tentative' : 'confirmed',
            'start' => new EventDateTime([
                'dateTime' => $start->copy()->utc()->toRfc3339String(),
                'timeZone' => 'UTC',
            ]),
            'end' => new EventDateTime([
                'dateTime' => $end->copy()->utc()->toRfc3339String(),
                'timeZone' => 'UTC',
            ]),
        ]);

        if ($attendeeEmail) {
            $event->setAttendees([
                new Calendar\EventAttendee(['email' => $attendeeEmail]),
            ]);
        }

        $optParams = [];

        if ($withMeet && ! $eventId) {
            $event->setConferenceData(new Calendar\ConferenceData([
                'createRequest' => [
                    'requestId' => uniqid('meet_', true),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                ],
            ]));
            $optParams['conferenceDataVersion'] = 1;
        }

        try {
            if ($eventId) {
                $updated = $calendar->events->patch($calendarId, $eventId, $event, $optParams);

                return $updated->getId();
            }

            $created = $calendar->events->insert($calendarId, $event, $optParams);

            return $created->getId();
        } catch (\Throwable $e) {
            Log::error('Google Calendar event upsert failed', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
