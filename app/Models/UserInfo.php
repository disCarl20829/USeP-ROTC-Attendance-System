<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserInfo extends Model
{
    use HasFactory;

    protected $table = 'user_info';
    protected $primaryKey = 'info_id';

    // Map Eloquent created timestamp to date_added column
    public const CREATED_AT = 'date_added';
    public const UPDATED_AT = 'updated_at';

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
        'status',
        'student_id_number',
        'serial_number',
        'date_added',
        'updated_at',
    ];

    protected $casts = [
        'placement'       => 'integer',
        'is_system_admin' => 'boolean',
        'date_added'      => 'datetime',
        'updated_at'      => 'datetime',
    ];

    public function campus()
    {
        return $this->belongsTo(Campus::class, 'campus_id', 'campus_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'course_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function platoon()
    {
        return $this->belongsTo(Platoon::class, 'platoon_id', 'platoon_id');
    }

    public function attendanceQr()
    {
        return $this->hasOne(AttendanceQr::class, 'user_id', 'user_id');
    }

    /**
     * Get the lowercase role name for the user.
     */
    public function getRoleName(): string
    {
        return strtolower($this->role?->role_name ?? '');
    }

    /**
     * Check if the user has Executive or Admin privileges.
     */
    public function isAdmin(): bool
    {
        if ((bool) $this->is_system_admin) {
            return true;
        }

        $role = $this->getRoleName();
        return in_array($role, ['admin', 'officer', 'system admin', 'test']);
    }

    /**
     * Check if the user is allowed to scan QR codes (Aspirant, Scanner, Officer, Admin).
     */
    public function isScanner(): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($this->getRoleName(), ['aspirant', 'scanner']);
    }

    /**
     * Check if the user is strictly a standard Cadet.
     */
    public function isCadet(): bool
    {
        if ($this->isAdmin()) {
            return false;
        }

        return $this->getRoleName() === 'cadet';
    }
}