<?php

namespace App\Console\Commands;

use App\Mail\Sponsorship\RoadmapAccessGrantedMail;
use App\Models\RoadmapAccessGrant;
use App\Models\User;
use App\Support\SponsorXp;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/** Sends "access unlocked" emails for new grants and keeps every sponsor's XP and Sponsor tag current. */
class SyncSponsors extends Command
{
    protected $signature = 'sponsors:sync';

    protected $description = 'Email new roadmap access grants and sync sponsor XP';

    public function handle(): int
    {
        foreach (RoadmapAccessGrant::query()->active()->whereNull('notified_at')->get() as $grant) {
            try {
                Mail::to($grant->email)->send(new RoadmapAccessGrantedMail($grant));
                $grant->forceFill(['notified_at' => now()])->save();
                $this->line("Emailed {$grant->email}");
            } catch (\Throwable $e) {
                report($e); // retried next run
            }
        }

        $changed = 0;
        // shortcut: walks every account; fine at hundreds of users, move to a sponsor-candidates query past ~10k.
        User::query()->whereNull('deletion_scheduled_at')->chunkById(500, function ($users) use (&$changed) {
            foreach ($users as $user) {
                $changed += SponsorXp::sync($user) !== 0 ? 1 : 0;
            }
        });
        $this->info("Sponsor XP changed for {$changed} account(s).");

        return self::SUCCESS;
    }
}
