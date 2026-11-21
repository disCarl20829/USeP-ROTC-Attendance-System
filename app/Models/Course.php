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
        'campus_name',
    ];

    // NOTE: course_list.campus_name is actually a campus_id foreign key.
    public function campus()
    {
        return $this->belongsTo(Campus::class, 'campus_name', 'campus_id');
    }

    public function users()
    {
        return $this->hasMany(UserInfo::class, 'course_id');
    }
}
