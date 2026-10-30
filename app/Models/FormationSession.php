<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormationSession extends Model
{
    protected $table = 'formation_sessions';

    protected $primaryKey = 'session_id';

    public $timestamps = false;

    protected $fillable = [
        'formation_id',
        'session_type',
        'start_time',
        'end_time',
        'late_time',
        'date_added',
    ];

    public function formation()
    {
        return $this->belongsTo(FormationEvent::class, 'formation_id', 'formation_id');
    }

    // Alias relationship so calls to session.event resolve correctly
    public function event()
    {
        return $this->belongsTo(FormationEvent::class, 'formation_id', 'formation_id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'session_id');
    }
}