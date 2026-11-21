<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\ScanAttendanceRequest;
use App\Models\AttendanceQr;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class QrScanController extends Controller
{
    public const STATUSES = ['present', 'late', 'excused', 'absent'];

    public function showScannerPage()
    {
        return Inertia::render('QRScanner', [
            'points' => config('rotc.points'),
        ]);
    }

    /** Sessions for the scanner dropdown: today's, otherwise the nearest ones. */
    public function getEvents()
    {
        $tz    = config('rotc.timezone');
        $today = Carbon::now($tz)->toDateString();

        $query = FormationSession::with('formation')
            ->join('formations_event', 'formations_event.formation_id', '=', 'formation_sessions.formation_id')
            ->select('formation_sessions.*');

        $sessions = (clone $query)->whereDate('formations_event.formation_date', $today)
            ->orderBy('formation_sessions.start_time')
            ->get();

        if ($sessions->isEmpty()) {
            $sessions = $query
                ->whereBetween('formations_event.formation_date', [
                    Carbon::now($tz)->subDays(7)->toDateString(),
                    Carbon::now($tz)->addDays(7)->toDateString(),
                ])
                ->orderBy('formations_event.formation_date', 'desc')
                ->orderBy('formation_sessions.start_time')
                ->get();
        }

        return response()->json($sessions->map(fn (FormationSession $s) => [
            'session_id'     => $s->session_id,
            'session_type'   => $s->session_type,
            'start_time'     => $s->start_time,
            'end_time'       => $s->end_time,
            'late_time'      => $s->late_time,
            'formation_name' => $s->formation?->formation_name,
            'formation_date' => $s->formation?->formation_date?->toDateString(),
            'is_today'       => $s->formation?->formation_date?->toDateString() === $today,
        ])->values());
    }

    public function scan(ScanAttendanceRequest $request)
    {
        $data    = $request->validated();
        $cadet   = $this->findCadet(trim($data['code']));
        $session = FormationSession::with('formation')->find($data['session_id']);
        $type    = strtolower($data['scan_type']);

        if (!$cadet) {
            return $this->error('No cadet found for that QR code or student ID.', 404);
        }

        $name = $cadet->full_name ?: 'Cadet';

        if (!$cadet->isActive()) {
            return $this->error("{$name} ({$cadet->student_id}) is DROPPED from ROTC and cannot be scanned.", 403, 'dropped');
        }

        $record    = AttendanceRecord::firstOrNew(['user_id' => $cadet->user_id, 'session_id' => $session->session_id]);
        $tz        = config('rotc.timezone');
        $now       = Carbon::now($tz);
        $scannedBy = (string) $request->session()->get('supabase_user_id');

        // Already has a status for this session (scanned, or auto-marked absent):
        // ask the scanner whether to change it.
        $alreadyIn  = $type === 'in' && $record->exists;
        $alreadyOut = $type === 'out' && $record->exists && $record->time_out;

        if ($alreadyIn || $alreadyOut) {
            $when = $alreadyOut ? $record->time_out : $record->time_in;

            return response()->json([
                'status'  => 'duplicate',
                'code'    => 'already_recorded',
                'message' => sprintf(
                    '%s is already marked %s%s for this session.',
                    $name,
                    strtoupper((string) $record->status),
                    $when ? ' (' . ($alreadyOut ? 'out ' : 'in ') . Carbon::parse($when)->setTimezone($tz)->format('h:i A') . ')' : ''
                ),
                'record'  => $this->recordPayload($record, $cadet),
            ], 409);
        }

        if ($type === 'in') {
            $record->time_in            = $now;
            $record->time_in_scanned_by = $scannedBy ?: null;
            $record->status             = $this->isLate($session, $now) ? 'late' : 'present';
            $record->date_added         = $now;
            $record->save();

            return $this->success("IN: {$name} — " . strtoupper($record->status) . ' at ' . $now->format('h:i A'), $record, $cadet);
        }

        // OUT
        if (!$record->exists || !$record->time_in) {
            return $this->error("{$name} has not timed IN for this session yet.", 422);
        }

        $record->time_out            = $now;
        $record->time_out_scanned_by = $scannedBy ?: null;
        $record->save();

        return $this->success("OUT: {$name} at " . $now->format('h:i A'), $record, $cadet);
    }

    /** The scanner chose to change a status after a duplicate scan (or on the roster). */
    public function changeStatus(Request $request, int $recordId)
    {
        $data   = $request->validate(['status' => ['required', 'in:' . implode(',', self::STATUSES)]]);
        $record = AttendanceRecord::with('user')->findOrFail($recordId);

        if ($record->user && !$record->user->isActive()) {
            return $this->error('This cadet is dropped; their attendance cannot be changed.', 403, 'dropped');
        }

        $record->status = $data['status'];

        // Marking present/late after an automatic absence: stamp the time-in.
        if (in_array($data['status'], ['present', 'late'], true) && !$record->time_in) {
            $record->time_in            = Carbon::now(config('rotc.timezone'));
            $record->time_in_scanned_by = (string) $request->session()->get('supabase_user_id') ?: null;
        }

        $record->save();

        return $this->success(
            ($record->user?->full_name ?: 'Cadet') . ' changed to ' . strtoupper($record->status) . '.',
            $record,
            $record->user
        );
    }

    /** UUID => QR token lookup; anything else => exact student ID. */
    private function findCadet(string $code): ?UserInfo
    {
        if ($code === '') {
            return null;
        }

        if (Str::isUuid($code)) {
            $qr = AttendanceQr::where('qr_token', $code)->where('is_active', true)->first();

            return $qr ? UserInfo::where('user_id', $qr->user_id)->first() : null;
        }

        return UserInfo::findByStudentId($code);
    }

    private function isLate(FormationSession $session, Carbon $now): bool
    {
        if (!$session->late_time) {
            return false;
        }

        $date      = $session->formation?->formation_date?->toDateString() ?? $now->toDateString();
        $threshold = Carbon::parse("{$date} {$session->late_time}", config('rotc.timezone'));

        return $now->gt($threshold);
    }

    private function recordPayload(AttendanceRecord $record, ?UserInfo $cadet): array
    {
        $tz = config('rotc.timezone');

        return [
            'record_id'  => $record->record_id,
            'session_id' => $record->session_id,
            'status'     => $record->status,
            'points'     => Permissions::points($record->status),
            'time_in'    => $record->time_in ? Carbon::parse($record->time_in)->setTimezone($tz)->format('h:i A') : null,
            'time_out'   => $record->time_out ? Carbon::parse($record->time_out)->setTimezone($tz)->format('h:i A') : null,
            'cadet'      => $cadet ? [
                'name'       => $cadet->full_name,
                'student_id' => $cadet->student_id,
            ] : null,
        ];
    }

    private function success(string $message, AttendanceRecord $record, ?UserInfo $cadet)
    {
        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'record'  => $this->recordPayload($record, $cadet),
        ]);
    }

    private function error(string $message, int $code, ?string $reason = null)
    {
        return response()->json(['status' => 'error', 'code' => $reason, 'message' => $message], $code);
    }
}
