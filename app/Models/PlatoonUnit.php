<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A numbered platoon, e.g. Golf 1st. */
class PlatoonUnit extends Model
{
    protected $table = 'platoon_units';
    protected $primaryKey = 'unit_id';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = ['platoon_id', 'number', 'added_by'];

    protected $casts = ['number' => 'integer'];

    public function platoon()
    {
        return $this->belongsTo(Platoon::class, 'platoon_id', 'platoon_id');
    }

    public static function ordinal(int $n): string
    {
        $suffix = in_array($n % 100, [11, 12, 13], true) ? 'th' : (['th', 'st', 'nd', 'rd'][$n % 10] ?? 'th');

        return $n . $suffix;
    }

    public function getLabelAttribute(): string
    {
        return trim(($this->platoon?->platoon_name ?? '') . ' ' . self::ordinal($this->number));
    }
}
