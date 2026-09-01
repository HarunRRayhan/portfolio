<?php

namespace App\Services\Consultation;

use App\Models\ConsultationGoogleCredential;
use Carbon\Carbon;
use Google\Client as GoogleClient;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Meet;
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

    public function authorizationUrl(?string $state = null): string
    {
        $client = $this->oauthClient();

        if ($state) {
            $client->setState($state);
        }

        return $client->createAuthUrl();
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
     * @param  string|list<string>|null  $excludeEventId
     * @return list<array{start: Carbon, end: Carbon}>
     */
    public function busyPeriods(Carbon $timeMin, Carbon $timeMax, string|array|null $excludeEventId = null): array
    {
        $calendar = $this->calendar();

        if (! $calendar) {
            if ($this->isConnected()) {
                throw new \RuntimeException('Google Calendar is temporarily unavailable.');
            }

            return [];
        }

        $cred = ConsultationGoogleCredential::current();
        $calendarId = $cred?->calendar_id ?: 'primary';
        $excludedEventIds = is_array($excludeEventId)
            ? array_values(array_filter($excludeEventId, 'is_string'))
            : ($excludeEventId ? [$excludeEventId] : []);

        try {
            if ($excludedEventIds) {
                $periods = [];
                $pageToken = null;

                do {
                    $params = [
                        'timeMin' => $timeMin->copy()->utc()->toRfc3339String(),
                        'timeMax' => $timeMax->copy()->utc()->toRfc3339String(),
                        'singleEvents' => true,
                        'showDeleted' => false,
                        'orderBy' => 'startTime',
                    ];
                    if ($pageToken) {
                        $params['pageToken'] = $pageToken;
                    }

                    $events = $calendar->events->listEvents($calendarId, $params);

                    foreach ($events->getItems() ?? [] as $event) {
                        if (
                            in_array($event->getId(), $excludedEventIds, true)
                            || $event->getStatus() === 'cancelled'
                            || $event->getTransparency() === 'transparent'
                        ) {
                            continue;
                        }

                        $start = $event->getStart();
                        $end = $event->getEnd();
                        $startAt = $start?->getDateTime() ?: $start?->getDate();
                        $endAt = $end?->getDateTime() ?: $end?->getDate();

                        if (! $startAt || ! $endAt) {
                            continue;
                        }

                        $periods[] = [
                            'start' => Carbon::parse($startAt)->utc(),
                            'end' => Carbon::parse($endAt)->utc(),
                        ];
                    }

                    $pageToken = $events->getNextPageToken();
                } while ($pageToken);

                return $periods;
            }

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

            throw new \RuntimeException('Google Calendar availability could not be checked.', 0, $e);
        }
    }

    public function createHoldEvent(
        string $summary,
        Carbon $start,
        Carbon $end,
        string $description = '',
        ?string $idempotencyKey = null,
    ): ?string {
        return $this->upsertEvent(
            null,
            $summary,
            $start,
            $end,
            $description,
            transparency: 'opaque',
            status: 'tentative',
            withMeet: false,
            idempotencyKey: $idempotencyKey,
        );
    }

    public function createConfirmedEvent(
        string $summary,
        Carbon $start,
        Carbon $end,
        string $description,
        string $attendeeEmail,
        bool $withMeet = true,
        ?string $idempotencyKey = null,
    ): ?array {
        $eventId = $this->upsertEvent(
            null,
            $summary,
            $start,
            $end,
            $description,
            'opaque',
            'confirmed',
            $withMeet,
            $attendeeEmail,
            $idempotencyKey,
        );

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

    public function deleteEvent(?string $eventId): bool
    {
        if (! $eventId) {
            return true;
        }

        $calendar = $this->calendar();

        if (! $calendar) {
            return ! $this->isConnected();
        }

        $cred = ConsultationGoogleCredential::current();
        $calendarId = $cred?->calendar_id ?: 'primary';

        try {
            $calendar->events->delete($calendarId, $eventId);

            return true;
        } catch (\Throwable $e) {
            if (in_array((int) $e->getCode(), [404, 410], true)) {
                return true;
            }

            Log::warning('Failed to delete Google event', ['event' => $eventId, 'error' => $e->getMessage()]);

            return false;
        }
    }

    public function enableMeetAutoRecording(?string $meetLink, ?string $conferenceId = null): ?string
    {
        $client = $this->authenticatedClient();

        if (! $client || (! $meetLink && ! $conferenceId)) {
            return null;
        }

        $spaceName = $this->resolveMeetSpaceName($meetLink, $conferenceId, $client);

        if (! $spaceName) {
            Log::warning('Could not resolve Meet space for auto-recording');

            return null;
        }

        $token = $client->getAccessToken();
        $accessToken = is_array($token) ? ($token['access_token'] ?? null) : null;

        if (! $accessToken) {
            return null;
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

            return null;
        }

        return $spaceName;
    }

    protected function resolveMeetSpaceName(?string $meetLink, ?string $conferenceId, ?GoogleClient $client = null): ?string
    {
        $candidate = null;

        if ($conferenceId) {
            if (str_starts_with($conferenceId, 'spaces/')) {
                $candidate = $conferenceId;
            }
        }

        if (! $candidate && $meetLink && preg_match('#meet\.google\.com/([a-z0-9\-]+)#i', $meetLink, $m)) {
            $candidate = 'spaces/'.$m[1];
        }

        if (! $candidate && $conferenceId) {
            $candidate = 'spaces/'.$conferenceId;
        }

        if (! $candidate) {
            return null;
        }

        $client ??= $this->authenticatedClient();
        if (! $client) {
            return null;
        }

        try {
            $space = (new Meet($client))->spaces->get($candidate);

            return $space->getName() ?: null;
        } catch (\Throwable $e) {
            Log::warning('Could not resolve Meet space resource', [
                'candidate' => $candidate,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
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
        ?string $idempotencyKey = null,
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

        $stableEventId = $eventId === null && $idempotencyKey !== null
            ? $this->stableEventId($idempotencyKey)
            : null;

        if ($stableEventId) {
            $event->setId($stableEventId);
        }

        if ($attendeeEmail) {
            $event->setAttendees([
                new Calendar\EventAttendee(['email' => $attendeeEmail]),
            ]);
        }

        $optParams = [];

        if ($withMeet && ! $eventId) {
            $event->setConferenceData(new Calendar\ConferenceData([
                'createRequest' => [
                    'requestId' => $idempotencyKey
                        ? 'consultation-meet-'.substr(hash('sha256', $idempotencyKey), 0, 40)
                        : uniqid('meet_', true),
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
            if ($stableEventId && (int) $e->getCode() === 409) {
                try {
                    $existing = $calendar->events->get($calendarId, $stableEventId);

                    if (! $this->eventMatches($existing, $summary, $start, $end)) {
                        Log::error('Google Calendar idempotent event has unexpected contents', [
                            'event' => $stableEventId,
                        ]);

                        return null;
                    }

                    return $existing->getId();
                } catch (\Throwable $lookupException) {
                    Log::warning('Google Calendar idempotent event lookup failed', [
                        'event' => $stableEventId,
                        'error' => $lookupException->getMessage(),
                    ]);
                }
            }

            Log::error('Google Calendar event upsert failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    protected function stableEventId(string $idempotencyKey): string
    {
        // Calendar event IDs use lowercase base32hex characters only.
        return 'consultation'.substr(hash('sha256', $idempotencyKey), 0, 48);
    }

    protected function eventMatches(Event $event, string $summary, Carbon $start, Carbon $end): bool
    {
        $eventStart = $event->getStart()?->getDateTime();
        $eventEnd = $event->getEnd()?->getDateTime();

        return $event->getSummary() === $summary
            && $eventStart !== null
            && $eventEnd !== null
            && Carbon::parse($eventStart)->utc()->timestamp === $start->copy()->utc()->timestamp
            && Carbon::parse($eventEnd)->utc()->timestamp === $end->copy()->utc()->timestamp;
    }
}
