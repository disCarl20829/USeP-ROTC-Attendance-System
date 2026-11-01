<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceQr extends Model
{
    protected $table = 'attendance_qr';

    protected $primaryKey = 'qr_id';

    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'qr_token',
        'is_active',
        'created_at',
    ];

    public function user()
    {
        return $this->belongsTo(UserInfo::class, 'user_id', 'user_id');
    }
}
