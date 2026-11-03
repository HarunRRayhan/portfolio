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

        try {
            // The row lock makes two concurrent identical deliveries run one after the other.
            $after = DB::transaction(function () use ($event, $payload, $credits, $cancel) {
                $locked = GithubWebhookEvent::whereKey($event->id)->lockForUpdate()->first();
                if ($locked->processed_at) {
                    return null;
                }
                $after = $locked->event === 'sponsorship' ? $this->handle($payload, $credits, $cancel) : null;
                $locked->update(['processed_at' => now(), 'failed_at' => null, 'error' => null]);

                return $after;
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

        // After commit: mails, lookups and calendar deletes can't be rolled back, and GitHub won't redeliver.
        if ($after) {
            try {
                $after();
            } catch (\Throwable $e) {
                Log::error('Sponsor webhook follow-up failed', ['delivery' => $delivery, 'error' => $e->getMessage()]);
            }
        }

        return response('OK');
    }

    /** @return (callable(): mixed)|null work to run after commit */
    private function handle(array $payload, SponsorCreditService $credits, CancelSponsorBookings $cancel): ?callable
    {
        $action = $payload['action'] ?? '';
        $sp = $payload['sponsorship'] ?? [];
        $nodeId = $sp['node_id'] ?? null;
        $tier = $sp['tier'] ?? [];

        if ($action === 'cancelled') {
            $s = $nodeId ? GithubSponsorship::where('github_sponsorship_node_id', $nodeId)->first() : null;
            // A replayed cancel from an earlier sponsorship period must not end the current one.
            $stale = $s && isset($sp['created_at']) && Carbon::parse($sp['created_at'])->lt($s->started_at);
            // One-time credits run their full 60 days; refunds go through admin revoke.
            if (! $s || $stale || $s->kind === GithubSponsorship::KIND_ONE_TIME) {
                return null;
            }
            $bookings = $credits->endSponsorship($s, GithubSponsorship::STATUS_CANCELLED);

            return fn () => $cancel->cancelBookings($bookings);
        }

        if (! in_array($action, ['created', 'tier_changed'], true)) {
            return null;
        }

        // The HMAC doesn't cover the delivery id, so a replayed body must not change stored state.
        $existing = $nodeId ? GithubSponsorship::where('github_sponsorship_node_id', $nodeId)->first() : null;
        // A repeat `created` is genuine only if newer than the cancellation (ended_at only moves forward)
        // or, for a one-time sponsorship that never gets cancelled, newer than its start.
        $createdAt = isset($sp['created_at']) ? Carbon::parse($sp['created_at']) : null;
        $responsor = $existing && $action === 'created' && $createdAt && (
            ($existing->status === GithubSponsorship::STATUS_CANCELLED && $existing->ended_at && $createdAt->gt($existing->ended_at))
            || ($existing->status === GithubSponsorship::STATUS_ACTIVE && $existing->kind === GithubSponsorship::KIND_ONE_TIME
                && $createdAt->gt($existing->started_at))
        );
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

        $who = ($sp['sponsor']['type'] ?? '') === 'User' ? $sp['sponsor'] : ($payload['sender'] ?? []);

        if ($existing && ! $responsor) {
            $who = ['id' => $existing->github_sponsor_id, 'login' => $existing->github_login];
        }

        $creditsBefore = $existing ? $existing->credits()->count() : 0;
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

        $granted = $s->credits->count() > $creditsBefore;

        return $action === 'created' && $slug && $granted ? fn () => $this->notify($s, $who['login'], (string) $who['id']) : null;
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
