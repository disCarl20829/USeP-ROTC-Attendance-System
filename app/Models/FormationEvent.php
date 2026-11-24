<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormationEvent extends Model
{
    protected $table = 'formations_event';

    protected $primaryKey = 'formation_id';

    protected static function booted(): void
    {
        static::addGlobalScope('notArchived', fn ($q) => $q->whereNull('formations_event.archived_at'));
    }

    public $timestamps = false;

    protected $fillable = [
        'formation_name',
        'formation_date',
        'formation_type',
        'location',
        'school_year_id',
        'archived_at',
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

}