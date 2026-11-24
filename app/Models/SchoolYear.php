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

    /** Reminder for admins: year ending soon / ended / none active. Null when nothing to say. */
    public static function adminNotice(): ?array
    {
        $tz     = config('rotc.timezone');
        $today  = now($tz)->startOfDay();
        $active = static::active();

        if ($active) {
            $end  = $active->ends_on->copy()->startOfDay();
            $days = (int) $today->diffInDays($end, false);

            if ($days < 0) {
                return [
                    'level'   => 'danger',
                    'message' => "School year {$active->name} ended on {$end->format('M d, Y')}. Close it in Settings → School year. "
                        . 'The next school year (and registration for new first years) starts automatically once it is closed.',
                ];
            }

            if ($days <= 14) {
                return [
                    'level'   => 'warning',
                    'message' => "School year {$active->name} ends on {$end->format('M d, Y')} ({$days} day" . ($days === 1 ? '' : 's')
                        . ' left). After the final attendance is checked, close it in Settings → School year.',
                ];
            }

            return null;
        }

        $last  = static::orderByDesc('starts_on')->first();
        $start = $last
            ? $last->starts_on->copy()->year($today->year)
            : $today->copy()->month(8)->day(1);
        if ($start->lt($today) && static::where('enrollment_year', $today->year)->exists()) {
            $start->addYear();
        }

        return [
            'level'   => 'info',
            'message' => "No active school year: cadet registration is closed. The next school year starts automatically on {$start->format('M d, Y')}"
                . ' (or start it now in Settings → School year).',
        ];
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
