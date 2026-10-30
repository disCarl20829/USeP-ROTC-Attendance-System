<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\Course;
use App\Models\Platoon;
use App\Models\Role;
use App\Models\UserInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CadetController extends Controller
{
    public function index()
    {
        $cadets = UserInfo::with(['campus', 'course', 'role', 'platoon'])
            ->get()
            ->map(function ($cadet) {
                return [
                    'id' => $cadet->user_id,
                    'name' => trim(($cadet->first_name ?? '') . ' ' . ($cadet->last_name ?? '')),
                    'firstName' => $cadet->first_name,
                    'lastName' => $cadet->last_name,
                    'idNumber' => $cadet->email ? explode('@', $cadet->email)[0] : $cadet->user_id,
                    'email' => $cadet->email,
                    'course_id' => $cadet->course_id,
                    'campus_id' => $cadet->campus_id,
                    'platoon_id' => $cadet->platoon_id,
                    'role_id' => $cadet->role_id,
                    'course' => $cadet->course ? $cadet->course->course_name : 'N/A',
                    'year' => $cadet->year_level ? $cadet->year_level . ' Year' : '1st Year',
                    'status' => 'active',
                ];
            });

        return Inertia::render('Cadets', [
            'cadets' => $cadets,
            'courses' => Course::all(),
            'campuses' => Campus::all(),
            'platoons' => Platoon::all(),
            'roles' => Role::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'student_id_number' => 'required|string',
            'email'             => 'nullable|email|max:255',
            'course_id'          => 'nullable|exists:course_list,course_id',
            'campus_id'          => 'nullable|exists:campus_list,campus_id',
            'platoon_id'         => 'nullable',
            'role_id'            => 'nullable',
            'placement'         => 'nullable|integer|min:1',
        ]);

        $userId = (string) Str::uuid();
        $email = $validated['email'] ?? strtolower($validated['student_id_number']) . '@usep.edu.ph';
        $defaultRoleId = Role::where('role_name', 'cadet')->first()?->role_id ?? 1;

        UserInfo::create([
            'user_id'    => $userId,
            'email'      => $email,
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'course_id'  => $validated['course_id'] ?? null,
            'campus_id'  => $validated['campus_id'] ?? null,
            'platoon_id' => $validated['platoon_id'] ?? null,
            'role_id'    => $validated['role_id'] ?? $defaultRoleId,
            'placement'  => $validated['placement'] ?? 1,
        ]);

        return redirect()->back()->with('success', 'Cadet added successfully!');
    }

    public function update(Request $request, $id)
    {
        $cadet = UserInfo::where('user_id', $id)->firstOrFail();

        $validated = $request->validate([
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'student_id_number' => 'required|string',
            'email'             => 'nullable|email|max:255',
            'course_id'          => 'nullable|exists:course_list,course_id',
            'campus_id'          => 'nullable|exists:campus_list,campus_id',
            'platoon_id'         => 'nullable',
            'role_id'            => 'nullable',
        ]);

        $email = $validated['email'] ?? strtolower($validated['student_id_number']) . '@usep.edu.ph';

        $cadet->update([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'email'      => $email,
            'course_id'  => $validated['course_id'] ?? null,
            'campus_id'  => $validated['campus_id'] ?? null,
            'platoon_id' => $validated['platoon_id'] ?? null,
            'role_id'    => $validated['role_id'] ?? $cadet->role_id,
        ]);

        return redirect()->back()->with('success', 'Cadet updated successfully!');
    }

    public function destroy($id)
    {
        $cadet = UserInfo::where('user_id', $id)->firstOrFail();
        $cadet->delete();

        return redirect()->back()->with('success', 'Cadet deleted successfully!');
    }
}