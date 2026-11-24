<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $table = 'attendance_records';
    protected $primaryKey = 'record_id';

    /** Records of archived people or archived events are hidden. */
    protected static function booted(): void
    {
        static::addGlobalScope('notArchived', fn ($q) => $q
            ->whereIn('attendance_records.user_id', fn ($s) => $s->select('user_id')->from('user_info')->whereNull('archived_at'))
            ->whereIn('attendance_records.session_id', fn ($s) => $s->select('formation_sessions.session_id')
                ->from('formation_sessions')
                ->join('formations_event', 'formations_event.formation_id', '=', 'formation_sessions.formation_id')
                ->whereNull('formations_event.archived_at')));
    }

    // Disable default created_at and updated_at column expectations
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'session_id',
        'time_in',
        'time_out',
        'status',
        'time_in_scanned_by',
        'time_out_scanned_by',
        'date_added',
    ];

    /**
     * Cast attributes to native Carbon datetime objects.
     */
    protected $casts = [
        'time_in'    => 'datetime',
        'time_out'   => 'datetime',
        'date_added' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserInfo::class, 'user_id', 'user_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(FormationSession::class, 'session_id', 'session_id');
    }

    /**
     * Relationship for eager loading 'event' in DashboardController
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(FormationSession::class, 'session_id', 'session_id');
    }
}