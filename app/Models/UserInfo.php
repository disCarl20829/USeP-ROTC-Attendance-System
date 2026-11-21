<?php

namespace App\Models;

use App\Support\Permissions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserInfo extends Model
{
    use HasFactory;

    protected $table = 'user_info';
    protected $primaryKey = 'info_id';

    public const CREATED_AT = 'date_added';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'student_id',
        'campus_id',
        'course_id',
        'role_id',
        'platoon_id',
        'specialization_id',
        'status',
    ];

    protected $casts = [
        'date_added' => 'datetime',
        'updated_at' => 'datetime',
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

    public function specialization()
    {
        return $this->belongsTo(Specialization::class, 'specialization_id', 'specialization_id');
    }

    public function attendanceQr()
    {
        return $this->hasOne(AttendanceQr::class, 'user_id', 'user_id');
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class, 'user_id', 'user_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getRoleName(): string
    {
        return Permissions::roleOf($this);
    }

    public function isActive(): bool
    {
        return strtolower((string) $this->status) !== 'dropped';
    }

    /** Ensure this profile has an active QR token; returns it. */
    public function ensureQrToken(): string
    {
        $qr = $this->attendanceQr()->first();

        if (!$qr) {
            $qr = AttendanceQr::create([
                'user_id'   => $this->user_id,
                'qr_token'  => (string) \Illuminate\Support\Str::uuid(),
                'is_active' => true,
            ]);
        }

        return (string) $qr->qr_token;
    }

    public static function findByEmail(string $email): ?self
    {
        return static::whereRaw('lower(trim(email)) = ?', [strtolower(trim($email))])->first();
    }

    public static function findByStudentId(string $studentId): ?self
    {
        return static::whereRaw('lower(trim(student_id)) = ?', [strtolower(trim($studentId))])->first();
    }

    /** Summary used by Inertia pages. */
    public function toProfileArray(): array
    {
        return [
            'info_id'           => $this->info_id,
            'user_id'           => $this->user_id,
            'first_name'        => $this->first_name,
            'last_name'         => $this->last_name,
            'name'              => $this->full_name,
            'email'             => $this->email,
            'student_id'        => $this->student_id,
            'campus_id'         => $this->campus_id,
            'campus'            => $this->campus?->campus_name,
            'course_id'         => $this->course_id,
            'course'            => $this->course?->course_name,
            'role_id'           => $this->role_id,
            'role'              => $this->role?->role_name,
            'platoon_id'        => $this->platoon_id,
            'platoon'           => $this->platoon?->platoon_name ?? 'Unspecified',
            'specialization_id' => $this->specialization_id,
            'specialization'    => $this->specialization?->specialization_name ?? 'Unspecified',
            'status'            => strtolower((string) ($this->status ?? 'active')),
        ];
    }
}
