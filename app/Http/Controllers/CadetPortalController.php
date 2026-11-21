<?php

namespace App\Http\Controllers;

use App\Support\CurrentProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CadetPortalController extends Controller
{
    public function index(Request $request)
    {
        $profile = CurrentProfile::get($request);

        return Inertia::render('CadetPortal', [
            'profile'      => [...$profile->toProfileArray(), 'qr_token' => $profile->ensureQrToken()],
            'myAttendance' => DashboardController::attendanceSummary($profile),
            'points'       => config('rotc.points'),
            'upcomingEvents' => DashboardController::upcomingEvents(
                \Carbon\Carbon::now(config('rotc.timezone'))->toDateString()
            ),
        ]);
    }
}
