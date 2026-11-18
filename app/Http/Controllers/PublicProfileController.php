<?php

namespace App\Http\Controllers;

use App\Models\RoadmapProgress;
use App\Models\RoadmapStart;
use App\Models\User;
use App\Models\XpAward;
use App\Support\RoadmapRepository;
use App\Support\Xp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PublicProfileController extends Controller
{
    public function show(Request $request, string $slug, RoadmapRepository $repo): Response
    {
        $viewer = $request->user();
        $isAdmin = (bool) $viewer?->isAdmin();
        $user = User::findByProfileHandle($slug) ?? abort(404);
        abort_if($user->deletion_scheduled_at && ! $isAdmin, 404);

        $done = RoadmapProgress::where('user_id', $user->id)->get(['roadmap_slug', 'step_id'])->groupBy('roadmap_slug');
        $roadmaps = [];
        foreach (RoadmapStart::where('user_id', $user->id)->orderBy('created_at')->pluck('roadmap_slug') as $roadmapSlug) {
            $roadmap = $repo->find($roadmapSlug);
            if (! $roadmap) {
                continue;
            }
            $required = array_keys(array_filter($repo->lessonIndex($roadmap), fn (array $l) => ! $l['optional']));
            $ticked = array_intersect($required, $done->get($roadmapSlug)?->pluck('step_id')->all() ?? []);
            $roadmaps[] = ['slug' => $roadmapSlug, 'title' => $roadmap['title'], 'percent' => $required ? (int) round(count($ticked) * 100 / count($required)) : 0];
        }

        $xp = (int) XpAward::where('user_id', $user->id)->sum('points');
        $name = $user->publicName();

        return Inertia::render('Profile/Show', [
            'profile' => [
                'name' => $name,
                'avatarUrl' => $user->publicAvatar(),
                'bio' => $user->bio,
                'anonymous' => (bool) $user->anonymous,
                'joined' => $user->created_at?->format('F Y'),
                'xp' => $xp,
                // Hidden and admin accounts are left off the board, so they have no public rank.
                'rank' => $user->leaderboard_hidden || $user->isAdmin() ? null : Xp::rankOf($user, 'all')['rank'] ?? null,
                'lessonsDone' => $done->flatten()->count(),
                'roadmaps' => $roadmaps,
            ],
            'isOwner' => $viewer?->id === $user->id,
            // Email and account details are for the admin only, never in the public props.
            'admin' => $isAdmin ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'emailVerified' => (bool) $user->email_verified_at,
                'provider' => $user->provider_name,
                'role' => $user->role,
                'createdAt' => $user->created_at?->toDateTimeString(),
                'lastXpAt' => XpAward::where('user_id', $user->id)->max('created_at'),
                'leaderboardHidden' => (bool) $user->leaderboard_hidden,
                'deletionScheduledAt' => $user->deletion_scheduled_at?->toDateTimeString(),
            ] : null,
            'seo' => ['title' => $name.' | harun.dev', 'description' => $name.' is learning on harun.dev roadmaps.', 'canonicalUrl' => url('/u/'.$user->profileHandle()), 'noindex' => true],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->merge(['username' => strtolower(trim((string) $request->input('username'))) ?: null]);
        $data = $request->validate([
            'bio' => ['nullable', 'string', 'max:280'],
            // Lowercase, starts with a letter; can't take someone's /u/ link.
            'username' => ['nullable', 'string', 'regex:'.User::USERNAME_PATTERN, Rule::unique('users', 'username')->ignore($request->user()->id), Rule::unique('users', 'profile_slug')->ignore($request->user()->id)],
            'anonymous' => ['required', 'boolean'],
        ]);
        $user = $request->user();
        $user->forceFill(['bio' => isset($data['bio']) ? trim($data['bio']) : null, 'username' => ($data['username'] ?? null) ?: null])->save();
        $user->setAnonymous((bool) $data['anonymous']);

        return back();
    }
}
