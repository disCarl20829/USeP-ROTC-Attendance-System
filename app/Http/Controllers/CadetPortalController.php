<?php

namespace App\Http\Controllers;

use App\Models\FormationEvent;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CadetPortalController extends Controller
{
    /**
     * Display the Cadet Portal view with personal QR code and upcoming events.
     */
    public function index(Request $request)
    {
        // Fetch session data from Supabase session variables
        $userId = $request->session()->get('supabase_user_id');
        $email = (string) $request->session()->get('supabase_email', '');

        $today = now()->toDateString();

        // 1. Fetch Cadet UserInfo linked to session user
        $cadet = null;
        if ($userId || $email) {
            $cadet = UserInfo::with(['course', 'platoon'])
                ->where(function ($query) use ($userId, $email) {
                    if ($userId) {
                        $query->where('user_id', $userId);
                    }
                    if ($email) {
                        $query->orWhere('email', $email);
                    }
                })
                ->first();
        }

        // Resolve Cadet ID Number safely
        $studentId = $cadet?->student_id_number 
            ?? $cadet?->serial_number 
            ?? ($email !== '' ? explode('@', $email)[0] : 'CADET-0000');

        $firstName = $cadet?->first_name ?? ($email !== '' ? explode('@', $email)[0] : 'Cadet');
        $lastName  = $cadet?->last_name ?? '';
        $fullName  = trim("{$firstName} {$lastName}") ?: 'Cadet';

        // 2. Fetch Upcoming Formation Events
        $upcomingEvents = FormationEvent::where(function ($query) use ($today) {
                $query->where('formation_date', '>=', $today)
                      ->orWhereNull('formation_date');
            })
            ->orderBy('formation_date', 'asc')
            ->take(6)
            ->get()
            ->map(function ($event) {
                return [
                    'id'       => $event->id ?? $event->event_id,
                    'title'    => $event->event_name ?? $event->title ?? 'ROTC Formation',
                    'date'     => $event->formation_date ? Carbon::parse($event->formation_date)->format('M d, Y') : 'TBA',
                    'time'     => $event->start_time ? Carbon::parse($event->start_time)->format('h:i A') : '07:00 AM',
                    'location' => $event->location ?? 'Campus Parade Grounds',
                ];
            });

        return Inertia::render('CadetPortal', [
            'cadet' => [
                'name'       => $fullName,
                'student_id' => $studentId,
                'email'      => $email,
                'course'     => $cadet?->course?->course_name ?? 'ROTC Cadet',
                'platoon'    => $cadet?->platoon?->platoon_name ?? 'N/A',
            ],
            'qrCodeValue'    => $studentId,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }
}