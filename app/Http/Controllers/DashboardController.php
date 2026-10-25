<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationEvent;
use App\Models\UserInfo;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalCadets = UserInfo::count();
        $activeEvents = FormationEvent::where('formation_date', '>=', now()->toDateString())->count();
        $todayRecords = AttendanceRecord::whereDate('date_added', now()->toDateString())->count();
        $presentToday = AttendanceRecord::where('status', 'present')
            ->whereDate('date_added', now()->toDateString())
            ->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalCadets' => $totalCadets,
                'activeEvents' => $activeEvents,
                'todayRecords' => $todayRecords,
                'presentToday' => $presentToday,
            ],
        ]);
    }
}
