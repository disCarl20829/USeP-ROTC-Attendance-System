<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $table = 'permission_list';

    protected $primaryKey = 'permission_id';

    public $timestamps = false;

    protected $fillable = [
        'permission_name',
        'description',
        'date_added',
    ];
}
