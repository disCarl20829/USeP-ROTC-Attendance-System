<?php

namespace App\Http\Controllers;

use App\Models\Campus;
use App\Models\Course;
use App\Models\Platoon;
use App\Models\Role;
use App\Models\UserInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CadetController extends Controller
{
    public function index()
    {
        $cadets = UserInfo::with(['course', 'campus', 'platoon', 'role'])
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->get()
            ->map(function ($user) {
                $firstName = $user->first_name ?? '';
                $lastName  = $user->last_name ?? '';
                $fullName  = trim("{$lastName}, {$firstName}");
                
                $idNumber = $user->student_id_number 
                    ?? $user->serial_number 
                    ?? ($user->email ? explode('@', $user->email)[0] : 'N/A');

                return [
                    'id'                => $user->user_id ?? $user->info_id,
                    'user_id'           => $user->user_id ?? $user->info_id,
                    'info_id'           => $user->info_id,
                    'firstName'         => $firstName,
                    'lastName'          => $lastName,
                    'name'              => $fullName ?: 'Unknown Cadet',
                    'idNumber'          => $idNumber,
                    'student_id_number' => $idNumber,
                    'email'             => $user->email ?? '',
                    'course'            => $user->course?->course_name ?? 'N/A',
                    'course_id'         => $user->course_id,
                    'campus_id'         => $user->campus_id,
                    'platoon_id'        => $user->platoon_id,
                    'role_id'           => $user->role_id,
                    'year'              => $user->year_level ?? '1st Year',
                    'status'            => strtolower($user->status ?? 'active'),
                ];
            });

        $courses  = class_exists(Course::class) ? Course::all() : [];
        $campuses = class_exists(Campus::class) ? Campus::all() : [];
        $platoons = class_exists(Platoon::class) ? Platoon::all() : [];
        $roles    = class_exists(Role::class) ? Role::all() : [];

        return Inertia::render('Cadets', [
            'cadets'   => $cadets,
            'courses'  => $courses,
            'campuses' => $campuses,
            'platoons' => $platoons,
            'roles'    => $roles,
        ]);
    }

    /**
     * Store a newly created cadet.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'email'             => 'nullable|email|max:255',
            'student_id_number' => 'nullable|string|max:50',
            'course_id'         => 'nullable',
            'campus_id'         => 'nullable',
            'platoon_id'        => 'nullable',
            'role_id'           => 'nullable',
        ]);

        $cadet = new UserInfo();
        $cadet->user_id         = (string) Str::uuid();
        $cadet->first_name      = trim($validated['first_name']);
        $cadet->last_name       = trim($validated['last_name']);
        $cadet->email           = !empty($validated['email']) ? trim($validated['email']) : null;
        $cadet->course_id       = $validated['course_id'] ?? null;
        $cadet->campus_id       = $validated['campus_id'] ?? 1;
        $cadet->platoon_id      = $validated['platoon_id'] ?? null;
        $cadet->role_id         = $validated['role_id'] ?? 4; // Default to Cadet role ID
        $cadet->placement       = 1;
        $cadet->is_system_admin = false;

        if (Schema::hasColumn('user_info', 'status')) {
            $cadet->status = 'active';
        }

        if (!empty($validated['student_id_number'])) {
            if (Schema::hasColumn('user_info', 'student_id_number')) {
                $cadet->student_id_number = $validated['student_id_number'];
            } elseif (Schema::hasColumn('user_info', 'serial_number')) {
                $cadet->serial_number = $validated['student_id_number'];
            }
        }

        if (Schema::hasColumn('user_info', 'date_added')) {
            $cadet->date_added = now();
        }

        $cadet->save();

        return redirect()->back()->with('success', 'Cadet created successfully.');
    }

    /**
     * Update an existing cadet.
     */
    public function update(Request $request, $id)
    {
        $query = UserInfo::query();

        if (Str::isUuid($id)) {
            $query->where('user_id', $id);
        } elseif (is_numeric($id)) {
            $query->where('info_id', (int) $id);
        } else {
            $query->where('user_id', $id);
        }

        $cadet = $query->firstOrFail();

        $validated = $request->validate([
            'first_name'        => 'nullable|string|max:255',
            'last_name'         => 'nullable|string|max:255',
            'student_id_number' => 'nullable|string|max:50',
            'email'             => 'nullable|email|max:255',
            'course_id'         => 'nullable',
            'campus_id'         => 'nullable',
            'platoon_id'        => 'nullable',
            'role_id'           => 'nullable',
            'status'            => 'required|string|in:active,dropped',
        ]);

        if (Schema::hasColumn('user_info', 'status')) {
            $cadet->status = strtolower($validated['status']);
        }

        if (!empty($validated['first_name'])) {
            $cadet->first_name = $validated['first_name'];
        }
        if (!empty($validated['last_name'])) {
            $cadet->last_name = $validated['last_name'];
        }
        if (array_key_exists('email', $validated)) {
            $cadet->email = !empty($validated['email']) ? trim($validated['email']) : null;
        }
        if (array_key_exists('course_id', $validated)) {
            $cadet->course_id = $validated['course_id'];
        }
        if (array_key_exists('campus_id', $validated)) {
            $cadet->campus_id = $validated['campus_id'];
        }
        if (array_key_exists('platoon_id', $validated)) {
            $cadet->platoon_id = $validated['platoon_id'];
        }
        if (array_key_exists('role_id', $validated)) {
            $cadet->role_id = $validated['role_id'];
        }

        if (!empty($validated['student_id_number'])) {
            if (Schema::hasColumn('user_info', 'student_id_number')) {
                $cadet->student_id_number = $validated['student_id_number'];
            } elseif (Schema::hasColumn('user_info', 'serial_number')) {
                $cadet->serial_number = $validated['student_id_number'];
            }
        }

        $cadet->save();

        return redirect()->back()->with('success', 'Cadet updated successfully.');
    }

    /**
     * Delete a cadet.
     */
    public function destroy($id)
    {
        $query = UserInfo::query();

        if (Str::isUuid($id)) {
            $query->where('user_id', $id);
        } elseif (is_numeric($id)) {
            $query->where('info_id', (int) $id);
        } else {
            $query->where('user_id', $id);
        }

        $cadet = $query->firstOrFail();
        $cadet->delete();

        return redirect()->back()->with('success', 'Cadet deleted successfully.');
    }
}