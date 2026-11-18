<?php

namespace App\Http\Controllers;

use App\Support\Xp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function index(Request $request): Response
    {
        $period = in_array($request->query('period'), Xp::PERIODS, true) ? $request->query('period') : 'all'; // all time first while activity is still low

        $previous = $period !== 'all' && $request->query('when') === 'previous';

        return Inertia::render('Leaderboard', [
            'period' => $period,
            'when' => $previous ? 'previous' : 'current',
            // No numeric ids in public rows: they'd survive a switch to anonymous and link the two names.
            'rows' => Xp::board($period, $previous)->map(fn (array $r) => array_diff_key($r, ['user_id' => true]))->values(),
            'me' => $request->user() ? Xp::rankOf($request->user(), $period, $previous) : null,
            'hidden' => (bool) $request->user()?->leaderboard_hidden,
        ]);
    }

    public function visibility(Request $request): RedirectResponse
    {
        $data = $request->validate(['hidden' => ['required', 'boolean']]);
        $request->user()->forceFill(['leaderboard_hidden' => $data['hidden']])->save();

        return back();
    }

    public function earn(): Response
    {
        return Inertia::render('Earn', ['points' => Xp::POINTS]);
    }
}
