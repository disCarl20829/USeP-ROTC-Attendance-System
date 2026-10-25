<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Platoon extends Model
{
    protected $table = 'platoon_list';

    protected $primaryKey = 'platoon_id';

    public $timestamps = false;

    protected $fillable = [
        'platoon_name',
        'added_by',
        'date_added',
    ];

    public function users()
    {
        return $this->hasMany(UserInfo::class, 'platoon_id');
    }
}
