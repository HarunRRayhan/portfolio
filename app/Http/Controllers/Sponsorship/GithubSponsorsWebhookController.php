<?php

namespace App\Http\Controllers\Sponsorship;

use App\Http\Controllers\Controller;
use App\Mail\Sponsorship\GithubWebhookFailedMail;
use App\Mail\Sponsorship\SponsorCreditsReadyMail;
use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
use App\Services\Sponsorship\CancelSponsorBookings;
use App\Services\Sponsorship\SponsorCreditService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class GithubSponsorsWebhookController extends Controller
{
    public function __invoke(Request $request, SponsorCreditService $credits, CancelSponsorBookings $cancel)
    {
        $secret = config('sponsors.webhook_secret');
        $body = $request->getContent();
        $signature = (string) $request->header('X-Hub-Signature-256');

        if (! filled($secret) || ! hash_equals('sha256='.hash_hmac('sha256', $body, $secret), $signature)) {
            return response('Invalid signature', 401);
        }

        $delivery = (string) $request->header('X-GitHub-Delivery');
        $payload = json_decode($body, true);
        if ($delivery === '' || ! is_array($payload)) {
            return response('Bad request', 400);
        }

        $event = GithubWebhookEvent::firstOrCreate(['delivery_id' => $delivery], [
            'event' => (string) $request->header('X-GitHub-Event'),
            'action' => $payload['action'] ?? null,
            'payload' => $payload,
        ]);

        $notify = null;
        try {
            // The row lock makes two concurrent identical deliveries run one after the other.
            $notify = DB::transaction(function () use ($event, $payload, $credits, $cancel) {
                $locked = GithubWebhookEvent::whereKey($event->id)->lockForUpdate()->first();
                if ($locked->processed_at) {
                    return null;
                }
                $notify = $locked->event === 'sponsorship' ? $this->handle($payload, $credits, $cancel) : null;
                $locked->update(['processed_at' => now(), 'failed_at' => null, 'error' => null]);

                return $notify;
            });
        } catch (\Throwable $e) {
            Log::error('GitHub Sponsors webhook failed', ['delivery' => $delivery, 'error' => $e->getMessage()]);
            $event->update(['failed_at' => now(), 'error' => $e->getMessage()]);
            try {
                Mail::to(config('mail.owner.address'))->send(new GithubWebhookFailedMail($delivery, $e->getMessage()));
            } catch (\Throwable $mailError) {
                Log::error('GitHub Sponsors failure mail failed', ['error' => $mailError->getMessage()]);
            }

            return response('Failed', 500);
        }

        // After commit: a mail or lookup failure must not undo a paid grant, and GitHub won't redeliver.
        if ($notify) {
            try {
                $this->notify(...$notify);
            } catch (\Throwable $e) {
                Log::error('Sponsor credits mail failed', ['delivery' => $delivery, 'error' => $e->getMessage()]);
            }
        }

        return response('OK');
    }

    /** @return array{0: GithubSponsorship, 1: string, 2: string}|null mail to send after commit */
    private function handle(array $payload, SponsorCreditService $credits, CancelSponsorBookings $cancel): ?array
    {
        $action = $payload['action'] ?? '';
        $sp = $payload['sponsorship'] ?? [];
        $nodeId = $sp['node_id'] ?? null;
        $tier = $sp['tier'] ?? [];

        if ($action === 'cancelled') {
            $s = $nodeId ? GithubSponsorship::where('github_sponsorship_node_id', $nodeId)->first() : null;
            if ($s) {
                $cancel($s, GithubSponsorship::STATUS_CANCELLED);
            }

            return null;
        }

        if (! in_array($action, ['created', 'tier_changed'], true)) {
            return null;
        }

        // The HMAC doesn't cover the delivery id, so a replayed body must not change stored state.
        $existing = $nodeId ? GithubSponsorship::where('github_sponsorship_node_id', $nodeId)->first() : null;
        // A cancelled sponsor who sponsors again is genuine only if created after the cancellation (ended_at only moves forward).
        $responsor = $existing && $action === 'created'
            && $existing->status === GithubSponsorship::STATUS_CANCELLED
            && $existing->ended_at && isset($sp['created_at']) && Carbon::parse($sp['created_at'])->gt($existing->ended_at);
        if ($existing && ! $responsor && ($action === 'created' || $existing->status !== GithubSponsorship::STATUS_ACTIVE)) {
            return null;
        }
        if ($responsor) {
            $existing->update(['ended_at' => null]);
        }

        $tierNode = $tier['node_id'] ?? null;
        $slug = collect(config('sponsors.tiers'))->filter(fn ($t) => filled($t['node_id']))
            ->search(fn ($t) => $t['node_id'] === $tierNode) ?: null;
        $kind = $slug ? config("sponsors.tiers.$slug.kind")
            : (($tier['is_one_time'] ?? true) ? GithubSponsorship::KIND_ONE_TIME : GithubSponsorship::KIND_MONTHLY);

        $who = ($payload['sponsor']['type'] ?? '') === 'User' ? $payload['sponsor'] : ($payload['sender'] ?? []);

        if ($existing && ! $responsor) {
            $who = ['id' => $existing->github_sponsor_id, 'login' => $existing->github_login];
        }

        $s = $credits->recordSponsorship([
            'github_sponsor_id' => $who['id'],
            'github_login' => $who['login'],
            'tier_slug' => $slug,
            'github_tier_node_id' => $tierNode,
            'kind' => $kind,
            'status' => GithubSponsorship::STATUS_ACTIVE,
            'source' => GithubSponsorship::SOURCE_WEBHOOK,
            // tier_changed never rewrites the start: a replayed old body must not lower it.
            'started_at' => $existing && ! $responsor ? $existing->started_at : ($sp['created_at'] ?? now()),
            'github_sponsorship_node_id' => $nodeId,
        ]);

        return $action === 'created' && $slug ? [$s, $who['login'], (string) $who['id']] : null;
    }

    private function notify(GithubSponsorship $s, string $login, string $githubId): void
    {
        $email = $s->user?->email;
        if (! $email) {
            try {
                $email = Http::timeout(5)->withHeaders(['Accept' => 'application/vnd.github+json'])
                    ->get("https://api.github.com/user/{$githubId}")->json('email');
            } catch (\Throwable) {
                $email = null;
            }
        }

        if (filled($email)) {
            $expires = $s->kind === GithubSponsorship::KIND_MONTHLY ? null : $s->credits->whereNull('revoked_at')->min('expires_at');
            Mail::to($email)->send(new SponsorCreditsReadyMail($s->user?->name ?: $login, $expires));
        }
    }
}
