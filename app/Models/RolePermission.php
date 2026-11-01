<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $table = 'role_permissions';

    /**
     * Composite primary key (role_id, permission_id). Eloquent does not
     * support composite keys natively, so no single auto-increment key
     * exists for this pivot-style table.
     */
    protected $primaryKey = 'role_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'role_id',
        'permission_id',
        'date_added',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function permission()
    {
        return $this->belongsTo(Permission::class, 'permission_id');
    }
}
