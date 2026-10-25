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
        'time_in_scanned_by',
        'time_out_scanned_by',
        'status',
        'date_added',
    ];

    public function user()
    {
        return $this->belongsTo(UserInfo::class, 'user_id', 'user_id');
    }

    public function session()
    {
        return $this->belongsTo(FormationSession::class, 'session_id');
    }
}
