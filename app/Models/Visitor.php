<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Visitor extends Model
{
    use HasFactory;

    protected $table = 'visitors';
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'company',
        'id_number',
        'notes',
    ];

    /**
     * Get all appointments for this visitor
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(VisitorAppointment::class);
    }

    /**
     * Get all visits for this visitor
     */
    public function visits(): HasMany
    {
        return $this->hasMany(VisitorVisit::class);
    }
}
