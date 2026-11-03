<?php

namespace App\Http\Controllers\Sponsorship;

use App\Http\Controllers\Controller;
use App\Mail\Sponsorship\GithubWebhookFailedMail;
use App\Mail\Sponsorship\SponsorCreditsReadyMail;
use App\Models\GithubSponsorship;
use App\Models\GithubWebhookEvent;
use App\Services\Sponsorship\CancelSponsorBookings;
use App\Services\Sponsorship\SponsorCreditService;
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
            DB::transaction(function () use ($event, $payload, $credits, $cancel) {
                $locked = GithubWebhookEvent::whereKey($event->id)->lockForUpdate()->first();
                if ($locked->processed_at) {
                    return;
                }
                if ($locked->event === 'sponsorship') {
                    $this->handle($payload, $credits, $cancel);
                }
                $locked->update(['processed_at' => now(), 'failed_at' => null, 'error' => null]);
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

        return response('OK');
    }

    private function handle(array $payload, SponsorCreditService $credits, CancelSponsorBookings $cancel): void
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

            return;
        }

        if (! in_array($action, ['created', 'tier_changed'], true)) {
            return;
        }

        $tierNode = $tier['node_id'] ?? null;
        $slug = collect(config('sponsors.tiers'))->filter(fn ($t) => filled($t['node_id']))
            ->search(fn ($t) => $t['node_id'] === $tierNode) ?: null;
        $kind = $slug ? config("sponsors.tiers.$slug.kind")
            : (($tier['is_one_time'] ?? true) ? GithubSponsorship::KIND_ONE_TIME : GithubSponsorship::KIND_MONTHLY);

        $who = ($payload['sponsor']['type'] ?? '') === 'User' ? $payload['sponsor'] : ($payload['sender'] ?? []);

        if ($action === 'tier_changed' && $nodeId && ($existing = GithubSponsorship::where('github_sponsorship_node_id', $nodeId)->first())) {
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
            'started_at' => $sp['created_at'] ?? now(),
            'github_sponsorship_node_id' => $nodeId,
        ]);

        if ($action === 'created' && $slug) {
            $this->notify($s, $who['login'], (string) $who['id']);
        }
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
            $expires = $s->kind === GithubSponsorship::KIND_MONTHLY ? null : $s->credits->min('expires_at');
            Mail::to($email)->send(new SponsorCreditsReadyMail($s->user?->name ?: $login, $expires));
        }
    }
}
