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

        return Inertia::render('Leaderboard', [
            'period' => $period,
            'rows' => Xp::board($period),
            'me' => $request->user() ? Xp::rankOf($request->user(), $period) : null,
            'hidden' => (bool) $request->user()?->leaderboard_hidden,
            'points' => Xp::POINTS,
        ]);
    }

    public function visibility(Request $request): RedirectResponse
    {
        $data = $request->validate(['hidden' => ['required', 'boolean']]);
        $request->user()->forceFill(['leaderboard_hidden' => $data['hidden']])->save();

        return back();
    }
}
