<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VisitorAppointment extends Model
{
    use HasFactory;

    protected $table = 'visitor_appointments';
    protected $fillable = [
        'visitor_id',
        'host_id',
        'appointment_date',
        'appointment_time',
        'purpose',
        'status',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'appointment_time' => 'datetime',
    ];

    /**
     * Get the visitor that owns the appointment
     */
    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    /**
     * Get the employee that owns the appointment
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }
}
