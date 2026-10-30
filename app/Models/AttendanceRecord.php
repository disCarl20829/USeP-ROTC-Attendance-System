<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $table = 'attendance_records';
    protected $primaryKey = 'record_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'session_id',
        'time_in',
        'time_out',
        'status',
        'time_in_scanned_by',
        'date_added',
    ];

    public function user()
    {
        return $this->belongsTo(UserInfo::class, 'user_id', 'user_id');
    }

    public function session()
    {
        return $this->belongsTo(FormationSession::class, 'session_id', 'session_id');
    }

    // Connects AttendanceRecord directly to FormationEvent through FormationSession
    public function event()
    {
        return $this->hasOneThrough(
            FormationEvent::class,
            FormationSession::class,
            'session_id',   // Foreign key on formation_sessions table...
            'formation_id', // Foreign key on formation_events table...
            'session_id',   // Local key on attendance_records table...
            'formation_id'  // Local key on formation_sessions table...
        );
    }
}