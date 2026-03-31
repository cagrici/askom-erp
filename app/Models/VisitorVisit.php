<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VisitorVisit extends Model
{
    use HasFactory;

    protected $table = 'visitor_visits';
    protected $fillable = [
        'visitor_id',
        'location_id',
        'host_id',
        'department_id',
        'purpose',
        'check_in_time',
        'check_out_time',
        'status',
        'notes',
        'badge_number',
        'has_vehicle',
        'vehicle_plate',
        'is_pre_registered',
        'expected_arrival',
        'check_in_photo_path',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
    ];

    /**
     * Get the visitor that owns the visit
     */
    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    /**
     * Get the appointment related to this visit
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(VisitorAppointment::class, 'appointment_id');
    }

    /**
     * Get the host employee
     */
    public function hostEmployee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }
}
