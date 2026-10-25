<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserInfo extends Model
{
    protected $table = 'user_info';

    protected $primaryKey = 'info_id';

    public const CREATED_AT = null;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'campus_id',
        'course_id',
        'role_id',
        'platoon_id',
        'placement',
        'is_system_admin',
        'date_added',
        'updated_at',
    ];

    protected $casts = [
        'placement' => 'integer',
        'is_system_admin' => 'boolean',
        'date_added' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function campus()
    {
        return $this->belongsTo(Campus::class, 'campus_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function platoon()
    {
        return $this->belongsTo(Platoon::class, 'platoon_id');
    }

    public function attendanceQr()
    {
        return $this->hasOne(AttendanceQr::class, 'user_id', 'user_id');
    }
}
