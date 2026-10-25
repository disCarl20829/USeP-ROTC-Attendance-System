<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormationEvent extends Model
{
    protected $table = 'formations_event';

    protected $primaryKey = 'formation_id';

    public $timestamps = false;

    protected $fillable = [
        'formation_name',
        'formation_date',
        'formation_type',
        'created_by',
        'date_added',
    ];

    protected $casts = [
        'formation_date' => 'date',
    ];

    public function sessions()
    {
        return $this->hasMany(FormationSession::class, 'formation_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
