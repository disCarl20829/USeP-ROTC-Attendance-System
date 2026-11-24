<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $table = 'audit_logs';
    protected $primaryKey = 'audit_id';

    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = null;

    protected $fillable = ['actor_id', 'actor_email', 'action', 'details'];

    protected $casts = ['details' => 'array', 'created_at' => 'datetime'];

    public static function record(Request $request, string $action, array $details = []): void
    {
        static::create([
            'actor_id'    => $request->session()->get('supabase_user_id'),
            'actor_email' => $request->session()->get('supabase_email'),
            'action'      => $action,
            'details'     => $details,
        ]);
    }
}
