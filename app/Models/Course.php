<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $table = 'course_list';

    protected $primaryKey = 'course_id';

    public $timestamps = false;

    protected $fillable = [
        'course_name',
        'added_by',
        'date_added',
    ];

    public function users()
    {
        return $this->hasMany(UserInfo::class, 'course_id');
    }
}
