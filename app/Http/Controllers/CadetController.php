<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\SchoolYear;
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

        $cadets = UserInfo::with(['course', 'campus', 'platoon', 'platoonUnit', 'role', 'specialization'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (UserInfo $u) => [
                ...$u->toProfileArray(),
                'id'        => $u->info_id,
                'firstName' => $u->first_name,
                'middleName' => $u->middle_name,
                'lastName'  => $u->last_name,
                'name'      => trim("{$u->last_name}, {$u->first_name}" . ($u->middle_initial ? " {$u->middle_initial}." : '')),
                'idNumber'  => (string) $u->student_id,
                'course'    => $u->course?->course_name ?? 'N/A',
                'has_login' => $linkedIds->has($u->user_id),
            ]);

        $profile = CurrentProfile::get($request);
        $tz      = config('rotc.timezone');

        $archived = UserInfo::withArchived()->with('role')
            ->whereNotNull('archived_at')
            ->where('archived_at', '>', now()->subDays(SchoolYear::RESTORE_DAYS))
            ->orderByDesc('archived_at')
            ->get()
            ->map(fn (UserInfo $u) => [
                'id'               => $u->info_id,
                'name'             => trim("{$u->last_name}, {$u->first_name}"),
                'student_id'       => (string) $u->student_id,
                'role'             => $u->role?->role_name,
                'archived_at'      => $u->archived_at->setTimezone($tz)->format('M d, Y'),
                'restorable_until' => $u->archived_at->copy()->addDays(SchoolYear::RESTORE_DAYS)->setTimezone($tz)->format('M d, Y'),
            ]);

        return Inertia::render('Cadets', [
            'cadets'   => $cadets,
            'archived' => $archived,
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
            'middle_name'       => ['nullable', 'string', 'max:255'],
            'last_name'         => ['required', 'string', 'max:255'],
            'email'             => [
                'required', 'email', 'max:254', 'regex:/^[^@\s]+@usep\.edu\.ph$/i',
                fn ($a, $v, $fail) => UserInfo::findByEmail($v) ? $fail('That email already has a profile.') : null,
            ],
            'student_id'        => LookupOptions::studentIdRules(),
            ...LookupOptions::campusCourseRules($request->integer('campus_id') ?: null),
            'platoon_id'        => ['nullable', 'integer', 'exists:platoon_list,platoon_id'],
            'platoon_unit_id'   => LookupOptions::platoonUnitRules($request->integer('platoon_id') ?: null),
            'specialization_id' => ['nullable', 'integer', 'exists:specialization_list,specialization_id'],
            'role_id'           => ['nullable', 'integer', 'exists:role_list,role_id'],
        ]);

        $canAssign = Permissions::allows($actor, 'cadets.assign');
        $canRoles  = Permissions::allows($actor, 'roles.assign');

        DB::transaction(function () use ($data, $canAssign, $canRoles) {
            $cadet = UserInfo::create([
                'user_id'           => (string) Str::uuid(), // replaced by the real login id on sign-up
                'first_name'        => trim($data['first_name']),
                'middle_name'       => trim((string) ($data['middle_name'] ?? '')) ?: null,
                'last_name'         => trim($data['last_name']),
                'email'             => strtolower(trim($data['email'])),
                'student_id'        => trim($data['student_id']),
                'campus_id'         => $data['campus_id'],
                'course_id'         => $data['course_id'],
                'platoon_id'        => $canAssign ? ($data['platoon_id'] ?? null) : null,
                'platoon_unit_id'   => $canAssign && !empty($data['platoon_id']) ? ($data['platoon_unit_id'] ?? null) : null,
                'specialization_id' => ($canAssign ? ($data['specialization_id'] ?? null) : null) ?? Specialization::defaultId(),
                'role_id'           => ($canRoles ? ($data['role_id'] ?? null) : null) ?? LookupOptions::roleId(config('rotc.default_role')),
                'status'            => 'active',
                'school_year_id'    => SchoolYear::active()?->school_year_id,
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
            $cadet->setEnrollment($data['status']);
            $cadet->save();

            return back()->with('success', $data['status'] === 'dropped' ? 'Cadet dropped.' : 'Cadet re-enrolled.');
        }

        $data = $request->validate([
            'first_name'        => ['required', 'string', 'max:255'],
            'middle_name'       => ['nullable', 'string', 'max:255'],
            'last_name'         => ['required', 'string', 'max:255'],
            'student_id'        => LookupOptions::studentIdRules($cadet->info_id),
            ...LookupOptions::campusCourseRules($request->integer('campus_id') ?: null),
            'platoon_id'        => ['nullable', 'integer', 'exists:platoon_list,platoon_id'],
            'platoon_unit_id'   => LookupOptions::platoonUnitRules($request->integer('platoon_id') ?: null),
            'specialization_id' => ['nullable', 'integer', 'exists:specialization_list,specialization_id'],
            'role_id'           => ['nullable', 'integer', 'exists:role_list,role_id'],
            'status'            => ['required', 'in:active,dropped'],
        ]);

        $cadet->fill([
            'first_name'  => trim($data['first_name']),
            'middle_name' => trim((string) ($data['middle_name'] ?? '')) ?: null,
            'last_name'   => trim($data['last_name']),
            'student_id'  => trim($data['student_id']),
            'campus_id'   => $data['campus_id'],
            'course_id'   => $data['course_id'],
        ]);
        $cadet->setEnrollment($data['status']);

        if (Permissions::allows($actor, 'cadets.assign')) {
            $cadet->platoon_id        = $data['platoon_id'] ?? null;
            $cadet->platoon_unit_id   = !empty($data['platoon_id']) ? ($data['platoon_unit_id'] ?? null) : null;
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

    /** Archive one profile (restorable for 30 days, then deleted). */
    public function destroy(Request $request, int $infoId)
    {
        return $this->archive($request, [$infoId], null);
    }

    /** Archive several profiles at once; requires typing "ARCHIVE <count>". */
    public function archiveMany(Request $request)
    {
        $data = $request->validate([
            'ids'     => ['required', 'array', 'min:1', 'max:1000'],
            'ids.*'   => ['integer'],
            'confirm' => ['required', 'string'],
        ]);

        $ids = array_values(array_unique($data['ids']));

        if (trim($data['confirm']) !== 'ARCHIVE ' . count($ids)) {
            return back()->withErrors(['confirm' => 'Type ARCHIVE ' . count($ids) . ' exactly to confirm.']);
        }

        return $this->archive($request, $ids, 'bulk');
    }

    private function archive(Request $request, array $ids, ?string $mode)
    {
        $actor = CurrentProfile::get($request);

        if (!Permissions::allows($actor, 'cadets.delete')) {
            return back()->with('error', 'Only admins can archive profiles. Drop the cadet instead.');
        }

        $targets = UserInfo::with('role')->whereIn('info_id', $ids)->get()
            ->reject(fn ($u) => $u->info_id === $actor->info_id || Permissions::roleOf($u) === 'admin');

        if ($targets->isEmpty()) {
            return back()->with('error', 'Nothing to archive (you cannot archive yourself or an admin).');
        }

        UserInfo::whereIn('info_id', $targets->pluck('info_id'))->update([
            'archived_at' => now(),
            'archived_by' => $request->session()->get('supabase_user_id'),
        ]);

        AuditLog::record($request, $mode === 'bulk' ? 'cadets.archive_bulk' : 'cadets.archive', [
            'count'       => $targets->count(),
            'student_ids' => $targets->pluck('student_id')->values()->all(),
        ]);

        return back()->with('success', $targets->count() . ' profile(s) archived. You can restore them for ' . SchoolYear::RESTORE_DAYS . ' days.');
    }

    public function restore(Request $request, int $infoId)
    {
        if (!Permissions::allows(CurrentProfile::get($request), 'cadets.delete')) {
            return back()->with('error', 'Only admins can restore profiles.');
        }

        $profile = UserInfo::withArchived()->whereNotNull('archived_at')->findOrFail($infoId);
        $profile->update(['archived_at' => null, 'archived_by' => null]);

        AuditLog::record($request, 'cadets.restore', ['student_id' => $profile->student_id]);

        return back()->with('success', "{$profile->full_name} restored.");
    }
}
