<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campus extends Model
{
    protected $table = 'campus_list';

    protected $primaryKey = 'campus_id';

    public $timestamps = false;

    protected $fillable = [
        'campus_name',
        'added_by',
        'date_added',
    ];

    public function users()
    {
        return $this->hasMany(UserInfo::class, 'campus_id');
    }
}
