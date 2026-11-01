<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Utility extends Model
{
    protected $table = 'utilities';

    public const CREATED_AT = null;

    protected $fillable = [
        'id',
        'default_start_time',
        'default_end_time',
        'default_late_time',
        'updated_by',
        'updated_at',
    ];

    public static function instance(): self
    {
        return new self;
    }
}
