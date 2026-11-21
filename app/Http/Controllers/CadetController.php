<?php

namespace App\Http\Controllers;

use App\Models\Specialization;
use App\Models\UserInfo;
use App\Support\CurrentProfile;
use App\Support\LookupOptions;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CadetController extends Controller
{
    public function index(Request $request)
    {
        $linkedIds = DB::table('auth.users')->pluck('id')->flip();

        $cadets = UserInfo::with(['course', 'campus', 'platoon', 'role', 'specialization'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (UserInfo $u) => [
                ...$u->toProfileArray(),
                'id'        => $u->info_id,
                'firstName' => $u->first_name,
                'lastName'  => $u->last_name,
                'name'      => trim("{$u->last_name}, {$u->first_name}"),
                'idNumber'  => (string) $u->student_id,
                'course'    => $u->course?->course_name ?? 'N/A',
                'has_login' => $linkedIds->has($u->user_id),
            ]);

        $profile = CurrentProfile::get($request);

        return Inertia::render('Cadets', [
            'cadets' => $cadets,
            ...LookupOptions::all(),
            'can'    => [
                'assign' => Permissions::allows($profile, 'cadets.assign'),
                'roles'  => Permissions::allows($profile, 'roles.assign'),
                'delete' => Permissions::allows($profile, 'cadets.delete'),
            ],
        ]);
    }

    /** Hand-add a cadet who has no account yet. Linked on sign-up by email. */
    public function store(Request $request)
    {
        $actor = CurrentProfile::get($request);

        $data = $request->validate([
            'first_name'        => ['required', 'string', 'max:255'],
            'last_name'         => ['required', 'string', 'max:255'],
            'email'             => [
                'required', 'email', 'max:254', 'regex:/^[^@\s]+@usep\.edu\.ph$/i',
                fn ($a, $v, $fail) => UserInfo::findByEmail($v) ? $fail('That email already has a profile.') : null,
            ],
            'student_id'        => LookupOptions::studentIdRules(),
            ...LookupOptions::campusCourseRules($request->integer('campus_id') ?: null),
            'platoon_id'        => ['nullable', 'integer', 'exists:platoon_list,platoon_id'],
            'specialization_id' => ['nullable', 'integer', 'exists:specialization_list,specialization_id'],
            'role_id'           => ['nullable', 'integer', 'exists:role_list,role_id'],
        ]);

        $canAssign = Permissions::allows($actor, 'cadets.assign');
        $canRoles  = Permissions::allows($actor, 'roles.assign');

        DB::transaction(function () use ($data, $canAssign, $canRoles) {
            $cadet = UserInfo::create([
                'user_id'           => (string) Str::uuid(), // replaced by the real login id on sign-up
                'first_name'        => trim($data['first_name']),
                'last_name'         => trim($data['last_name']),
                'email'             => strtolower(trim($data['email'])),
                'student_id'        => trim($data['student_id']),
                'campus_id'         => $data['campus_id'],
                'course_id'         => $data['course_id'],
                'platoon_id'        => $canAssign ? ($data['platoon_id'] ?? null) : null,
                'specialization_id' => ($canAssign ? ($data['specialization_id'] ?? null) : null) ?? Specialization::defaultId(),
                'role_id'           => ($canRoles ? ($data['role_id'] ?? null) : null) ?? LookupOptions::roleId(config('rotc.default_role')),
                'status'            => 'active',
            ]);

            $cadet->ensureQrToken();
        });

        return back()->with('success', 'Cadet added. They can register with the same email to link their account.');
    }

    public function update(Request $request, int $infoId)
    {
        $actor = CurrentProfile::get($request);
        $cadet = UserInfo::with('role')->findOrFail($infoId);

        if (Permissions::roleOf($cadet) === 'admin' && Permissions::roleOf($actor) !== 'admin') {
            return back()->with('error', 'Only admins can edit an admin profile.');
        }

        // Drop / re-enroll buttons send only the status.
        if ($request->keys() === ['status'] || $request->missing('first_name')) {
            $data = $request->validate(['status' => ['required', 'in:active,dropped']]);
            $cadet->update(['status' => $data['status']]);

            return back()->with('success', $data['status'] === 'dropped' ? 'Cadet dropped.' : 'Cadet re-enrolled.');
        }

        $data = $request->validate([
            'first_name'        => ['required', 'string', 'max:255'],
            'last_name'         => ['required', 'string', 'max:255'],
            'student_id'        => LookupOptions::studentIdRules($cadet->info_id),
            ...LookupOptions::campusCourseRules($request->integer('campus_id') ?: null),
            'platoon_id'        => ['nullable', 'integer', 'exists:platoon_list,platoon_id'],
            'specialization_id' => ['nullable', 'integer', 'exists:specialization_list,specialization_id'],
            'role_id'           => ['nullable', 'integer', 'exists:role_list,role_id'],
            'status'            => ['required', 'in:active,dropped'],
        ]);

        $cadet->fill([
            'first_name' => trim($data['first_name']),
            'last_name'  => trim($data['last_name']),
            'student_id' => trim($data['student_id']),
            'campus_id'  => $data['campus_id'],
            'course_id'  => $data['course_id'],
            'status'     => $data['status'],
        ]);

        if (Permissions::allows($actor, 'cadets.assign')) {
            $cadet->platoon_id        = $data['platoon_id'] ?? null;
            $cadet->specialization_id = $data['specialization_id'] ?? Specialization::defaultId();
        }

        if (Permissions::allows($actor, 'roles.assign') && !empty($data['role_id']) && (int) $data['role_id'] !== (int) $cadet->role_id) {
            if ($cadet->info_id === $actor->info_id) {
                throw ValidationException::withMessages(['role_id' => 'You cannot change your own role.']);
            }
            $cadet->role_id = $data['role_id'];
        }

        $cadet->save();

        return back()->with('success', 'Cadet updated.');
    }

    public function destroy(Request $request, int $infoId)
    {
        $actor = CurrentProfile::get($request);

        if (!Permissions::allows($actor, 'cadets.delete')) {
            return back()->with('error', 'Only admins can permanently delete a profile. Drop the cadet instead.');
        }

        $cadet = UserInfo::findOrFail($infoId);

        if ($cadet->info_id === $actor->info_id) {
            return back()->with('error', 'You cannot delete your own profile.');
        }

        $cadet->delete(); // attendance + QR rows cascade

        return back()->with('success', 'Profile deleted.');
    }
}
