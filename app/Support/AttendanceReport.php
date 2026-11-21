<?php

namespace App\Support;

use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Builds the LE 1 attendance matrix used by the Reports page and the Excel export.
 * Cells: points (10 / 5 / 8), "A" for absent, "" for no record yet or after a drop.
 */
class AttendanceReport
{
    /** Minimum number of session columns on the sheet. */
    public const SHEET_COLUMNS = 15;

    /** @return array{sessions: Collection, rows: Collection} */
    public static function build(): array
    {
        $tz       = config('rotc.timezone');
        $sessions = Attendance::sessions()->values();
        $cadets   = Attendance::cadetsQuery(includeDropped: true)->get();
        $records  = AttendanceRecord::whereIn('user_id', $cadets->pluck('user_id'))->get()
            ->groupBy('user_id')
            ->map(fn ($rs) => $rs->keyBy('session_id'));

        $rows = $cadets->values()->map(function ($cadet, $i) use ($sessions, $records, $tz) {
            $mine     = $records->get($cadet->user_id, collect());
            $dropped  = strtolower((string) $cadet->status) === 'dropped';
            $dropDate = $dropped && $cadet->dropped_at ? $cadet->dropped_at->setTimezone($tz)->toDateString() : null;
            $matrix   = [];
            $tally    = ['present' => 0, 'late' => 0, 'excused' => 0, 'absent' => 0];
            $total    = 0;

            foreach ($sessions as $s) {
                // Sessions after the cadet was dropped stay blank.
                if ($dropDate && $s['date'] && $s['date'] > $dropDate) {
                    $matrix[$s['session_id']] = '';
                    continue;
                }

                $status = strtolower((string) $mine->get($s['session_id'])?->status);

                if (isset($tally[$status])) {
                    $tally[$status]++;
                    $total += Permissions::points($status);
                    $matrix[$s['session_id']] = $status === 'absent' ? 'A' : Permissions::points($status);
                } else {
                    $matrix[$s['session_id']] = '';
                }
            }

            return [
                'nr'                => $i + 1,
                'id'                => $cadet->user_id,
                'user_id'           => $cadet->user_id,
                'last_name'         => (string) $cadet->last_name,
                'first_name'        => (string) $cadet->first_name,
                'middle_initial'    => $cadet->middle_initial,
                'name'              => trim("{$cadet->last_name}, {$cadet->first_name}" . ($cadet->middle_initial ? " {$cadet->middle_initial}." : '')),
                'student_id'        => (string) $cadet->student_id,
                'program'           => $cadet->course?->course_name ?? 'N/A',
                'platoon'           => $cadet->platoon?->platoon_name,
                'matrix'            => $matrix,
                'attendance_points' => $total,
                'lates'             => $tally['late'],
                'excused'           => $tally['excused'],
                'absences'          => $tally['absent'],
                'attended'          => $tally['present'] + $tally['late'] + $tally['excused'],
                'recorded'          => array_sum($tally),
                'status'            => $dropped ? 'dropped' : 'active',
                'dropped_at'        => $dropDate,
            ];
        });

        return ['sessions' => $sessions, 'rows' => $rows];
    }

    /** Number of session columns on the sheet (at least 15). */
    public static function columnCount(Collection $sessions): int
    {
        return max(self::SHEET_COLUMNS, $sessions->count());
    }
}
