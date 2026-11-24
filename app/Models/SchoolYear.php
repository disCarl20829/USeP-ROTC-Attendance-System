<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolYear extends Model
{
    protected $table = 'school_years';
    protected $primaryKey = 'school_year_id';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    /** Days an archived year / profile can still be restored. */
    public const RESTORE_DAYS = 30;

    protected $fillable = ['name', 'enrollment_year', 'starts_on', 'ends_on', 'status', 'archived_at', 'archived_by'];

    protected $casts = [
        'starts_on'       => 'date',
        'ends_on'         => 'date',
        'archived_at'     => 'datetime',
        'enrollment_year' => 'integer',
    ];

    public static function active(): ?self
    {
        return static::where('status', 'active')->first();
    }

    public function restorableUntil(): ?\Carbon\Carbon
    {
        return $this->archived_at?->copy()->addDays(self::RESTORE_DAYS);
    }

    public function toArrayForUi(): array
    {
        return [
            'school_year_id'   => $this->school_year_id,
            'name'             => $this->name,
            'enrollment_year'  => $this->enrollment_year,
            'starts_on'        => $this->starts_on?->toDateString(),
            'ends_on'          => $this->ends_on?->toDateString(),
            'status'           => $this->status,
            'archived_at'      => $this->archived_at?->setTimezone(config('rotc.timezone'))->format('M d, Y h:i A'),
            'restorable_until' => $this->restorableUntil()?->setTimezone(config('rotc.timezone'))->format('M d, Y'),
            'can_restore'      => $this->status === 'archived' && $this->restorableUntil()?->isFuture(),
        ];
    }
}
