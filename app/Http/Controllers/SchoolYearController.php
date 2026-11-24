<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use App\Models\SchoolYear;
use App\Models\UserInfo;
use App\Support\AttendanceSheet;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Admin: school years (batches).
 * Closing a year archives its cadets, aspirants, events and attendance. They can be
 * restored for 30 days; after that the database deletes them (purge_archived_records),
 * and login accounts are deleted one year after archiving.
 */
class SchoolYearController extends Controller
{
    /** A backup must have been downloaded within this many minutes before closing. */
    private const BACKUP_FRESH_MINUTES = 15;

    /** Props for the School year section of Settings. */
    public static function settingsProps(Request $request): array
    {
        $tz     = config('rotc.timezone');
        $active = SchoolYear::active();
        $backup = $request->session()->get('school_year_backup');

        return [
            'active'      => $active?->toArrayForUi(),
            'activeCount' => $active ? UserInfo::where('school_year_id', $active->school_year_id)
                ->whereHas('role', fn ($q) => $q->whereIn(DB::raw('lower(role_name)'), config('rotc.attendance_roles')))
                ->count() : 0,
            'archived'    => SchoolYear::where('status', '!=', 'active')->orderByDesc('starts_on')->get()->map->toArrayForUi(),
            'backupReady' => $active && is_array($backup)
                && $backup['id'] === $active->school_year_id
                && $backup['at'] >= now()->subMinutes(self::BACKUP_FRESH_MINUTES)->timestamp,
            'audit'       => AuditLog::orderByDesc('created_at')->limit(20)->get()->map(fn ($a) => [
                'id'      => $a->audit_id,
                'when'    => $a->created_at?->setTimezone($tz)->format('M d, Y h:i A'),
                'who'     => $a->actor_email ?? 'System (daily clean-up)',
                'action'  => $a->action,
                'details' => $a->details,
            ]),
        ];
    }

    private function rules(?int $ignoreId = null): array
    {
        return [
            'name'            => ['required', 'string', 'max:20', Rule::unique('school_years', 'name')->ignore($ignoreId, 'school_year_id')],
            'enrollment_year' => ['required', 'integer', 'between:2000,2100'],
            'starts_on'       => ['required', 'date'],
            'ends_on'         => ['required', 'date', 'after:starts_on'],
        ];
    }

    public function update(Request $request, int $id)
    {
        $year = SchoolYear::where('status', 'active')->findOrFail($id);
        $year->update($request->validate($this->rules($year->school_year_id)));
        AuditLog::record($request, 'school_year.update', ['name' => $year->name]);

        return back()->with('success', "School year {$year->name} updated.");
    }

    public function store(Request $request)
    {
        if (SchoolYear::active()) {
            return back()->with('error', 'Close the current school year before starting a new one.');
        }

        $year = SchoolYear::create([...$request->validate($this->rules()), 'status' => 'active']);
        AuditLog::record($request, 'school_year.start', ['name' => $year->name]);

        return back()->with('success', "School year {$year->name} started. First years with IDs starting {$year->enrollment_year}- can now register.");
    }

    /** Excel backup: attendance sheets + raw Profiles / Events / Records sheets. */
    public function backup(Request $request)
    {
        $year = SchoolYear::active();
        abort_unless($year, 404);

        $book = AttendanceSheet::build();
        $tz   = config('rotc.timezone');

        $profiles = UserInfo::with(['role', 'course', 'campus', 'platoon', 'specialization'])
            ->where('school_year_id', $year->school_year_id)->orderBy('last_name')->get();
        $this->rawSheet($book, 'Profiles', ['Student ID', 'Last name', 'First name', 'Middle name', 'Email', 'Role', 'Campus', 'Course', 'Platoon', 'Specialization', 'Status', 'Registered'],
            $profiles->map(fn ($u) => [$u->student_id, $u->last_name, $u->first_name, $u->middle_name, $u->email, $u->role?->role_name,
                $u->campus?->campus_name, $u->course?->course_name, $u->platoon?->platoon_name, $u->specialization?->specialization_name,
                $u->status, $u->date_added?->setTimezone($tz)->format('Y-m-d H:i')]));

        $events   = FormationEvent::where('school_year_id', $year->school_year_id)->orderBy('formation_date')->get();
        $sessions = FormationSession::with('formation')->whereIn('formation_id', $events->pluck('formation_id'))->get();
        $this->rawSheet($book, 'Events', ['Date', 'Event', 'Type', 'Location', 'Session', 'Start', 'Late after', 'End'],
            $sessions->sortBy(fn ($s) => $s->formation?->formation_date . $s->start_time)->map(fn ($s) => [
                $s->formation?->formation_date?->toDateString(), $s->formation?->formation_name, $s->formation?->formation_type,
                $s->formation?->location, $s->session_type, $s->start_time, $s->late_time, $s->end_time]));

        $names   = $profiles->keyBy('user_id');
        $records = AttendanceRecord::whereIn('session_id', $sessions->pluck('session_id'))->get();
        $this->rawSheet($book, 'Records', ['Student ID', 'Name', 'Date', 'Event', 'Session', 'Status', 'Time in', 'Time out'],
            $records->map(function ($r) use ($names, $sessions, $tz) {
                $s = $sessions->firstWhere('session_id', $r->session_id);
                $u = $names->get($r->user_id);

                return [$u?->student_id, $u?->full_name, $s?->formation?->formation_date?->toDateString(), $s?->formation?->formation_name,
                    $s?->session_type, $r->status, $r->time_in?->setTimezone($tz)->format('H:i'), $r->time_out?->setTimezone($tz)->format('H:i')];
            }));

        $request->session()->put('school_year_backup', ['id' => $year->school_year_id, 'at' => now()->timestamp]);
        AuditLog::record($request, 'school_year.backup', ['name' => $year->name]);

        $filename = "USeP_ROTC_Backup_{$year->name}_" . Carbon::now($tz)->format('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(fn () => (new Xlsx($book))->save('php://output'), $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function close(Request $request)
    {
        $year = SchoolYear::active();
        abort_unless($year, 404);

        $backup = $request->session()->get('school_year_backup');
        if (!is_array($backup) || $backup['id'] !== $year->school_year_id
            || $backup['at'] < now()->subMinutes(self::BACKUP_FRESH_MINUTES)->timestamp) {
            return back()->withErrors(['confirm' => 'Download the backup first (within the last ' . self::BACKUP_FRESH_MINUTES . ' minutes).']);
        }

        $request->validate(['confirm' => ['required', 'string']]);
        if (trim((string) $request->input('confirm')) !== "ARCHIVE {$year->name}") {
            return back()->withErrors(['confirm' => "Type ARCHIVE {$year->name} exactly to confirm."]);
        }

        $now   = now();
        $actor = $request->session()->get('supabase_user_id');

        [$people, $events] = DB::transaction(function () use ($year, $now, $actor) {
            // Only trainees (cadets / aspirants) belong to a batch; officers and admins stay,
            // even if they originally signed up as cadets of this year.
            $people = UserInfo::where('school_year_id', $year->school_year_id)
                ->whereHas('role', fn ($q) => $q->whereIn(DB::raw('lower(role_name)'), config('rotc.attendance_roles')))
                ->update(['archived_at' => $now, 'archived_by' => $actor]);
            $events = FormationEvent::where('school_year_id', $year->school_year_id)
                ->update(['archived_at' => $now]);
            $year->update(['status' => 'archived', 'archived_at' => $now, 'archived_by' => $actor]);

            return [$people, $events];
        });

        $request->session()->forget('school_year_backup');
        AuditLog::record($request, 'school_year.close', ['name' => $year->name, 'profiles' => $people, 'events' => $events]);

        // If the next year's start date has already come, open it right away.
        $next = DB::selectOne('SELECT public.ensure_school_year() AS name')?->name;

        return back()->with('success', "School year {$year->name} archived ({$people} profiles, {$events} events). "
            . 'You can restore it for ' . SchoolYear::RESTORE_DAYS . ' days. '
            . ($next ? "School year {$next} has started: new first years can register now." : 'The next school year will start automatically on its start date.'));
    }

    public function restore(Request $request, int $id)
    {
        $year = SchoolYear::where('status', 'archived')->findOrFail($id);

        if (!$year->restorableUntil()?->isFuture()) {
            return back()->with('error', 'This school year can no longer be restored.');
        }

        if (SchoolYear::active()) {
            return back()->with('error', 'Close the current school year first; only one school year can be active.');
        }

        DB::transaction(function () use ($year) {
            UserInfo::withArchived()->where('school_year_id', $year->school_year_id)
                ->where('archived_at', '>=', $year->archived_at->copy()->subMinute())
                ->update(['archived_at' => null, 'archived_by' => null]);
            FormationEvent::withoutGlobalScope('notArchived')->where('school_year_id', $year->school_year_id)
                ->update(['archived_at' => null]);
            $year->update(['status' => 'active', 'archived_at' => null, 'archived_by' => null]);
        });

        AuditLog::record($request, 'school_year.restore', ['name' => $year->name]);

        return back()->with('success', "School year {$year->name} restored.");
    }

    private function rawSheet($book, string $title, array $header, $rows): void
    {
        $sheet = new Worksheet($book, $title);
        $book->addSheet($sheet);
        $sheet->fromArray([$header, ...collect($rows)->values()->all()]);
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->getFont()->setBold(true);
        foreach (range(1, count($header)) as $c) {
            $sheet->getColumnDimensionByColumn($c)->setAutoSize(true);
        }
        $sheet->freezePane('A2');
    }
}
