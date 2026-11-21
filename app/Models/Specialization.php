<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    protected $table = 'specialization_list';

    protected $primaryKey = 'specialization_id';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = [
        'specialization_name',
        'added_by',
    ];

    public static function defaultId(): ?int
    {
        return static::whereRaw('lower(specialization_name) = ?', [strtolower(config('rotc.default_specialization'))])
            ->value('specialization_id');
    }
}
