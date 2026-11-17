<?php

namespace App\Console\Commands;

use App\Mail\RoadmapProgressMail;
use App\Models\Subscriber;
use App\Models\User;
use App\Support\RoadmapDigest;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendRoadmapProgress extends Command
{
    protected $signature = 'roadmaps:send-progress {--dry-run : List who would get an email without sending}';

    protected $description = 'Email newsletter subscribers who follow a roadmap their weekly progress and next lesson';

    public function handle(RoadmapDigest $digests): int
    {
        $dry = (bool) $this->option('dry-run');
        if (! $dry && in_array(config('mail.default'), ['log', 'array'], true) && ! app()->environment('testing')) {
            $this->error('Progress emails need a real mailer. Set MAIL_MAILER=resend and configure RESEND_API_KEY.');

            return self::FAILURE;
        }

        $now = now(config('newsletter.schedule.timezone'));
        $week = $now->format('o-\\WW');
        $sent = 0;
        $failed = 0;

        // Only confirmed newsletter subscribers: that is the consent we hold, and its unsubscribe link ends these emails too.
        User::query()->whereNotNull('email_verified_at')->whereIn('id', DB::table('roadmap_progress')->select('user_id'))
            ->orderBy('id')->each(function (User $user) use ($digests, $now, $week, $dry, &$sent, &$failed) {
                $subscriber = Subscriber::subscribed()->whereRaw('lower(email) = ?', [strtolower($user->email)])->first();
                if (! $subscriber || DB::table('roadmap_digest_sends')->where(['user_id' => $user->id, 'week_key' => $week])->exists()) {
                    return;
                }
                $digest = $digests->for($user, $now);
                if (! $digest) {
                    return;
                }
                if ($dry) {
                    $this->line("Would send to user #{$user->id}: {$digest['lessonsWeek']} lessons, ".count($digest['roadmaps']).' roadmap(s)');
                    $sent++;

                    return;
                }
                try {
                    Mail::to($subscriber->email)->send(new RoadmapProgressMail($user, $subscriber, $digest));
                    DB::table('roadmap_digest_sends')->insert(['user_id' => $user->id, 'week_key' => $week, 'sent_at' => now()]);
                    $sent++;
                } catch (Throwable $e) {
                    report($e);
                    $failed++;
                }
            });

        $this->info(($dry ? 'Would send ' : 'Sent ')."{$sent} progress email(s); {$failed} failed.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
