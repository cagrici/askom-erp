<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'total_hours',
        'overtime_hours',
        'status',
        'notes',
        'is_holiday',
        'is_weekend',
    ];

    protected $casts = [
        'date' => 'date',
        'total_hours' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'is_holiday' => 'boolean',
        'is_weekend' => 'boolean',
    ];

    /**
     * Get the employee that owns the attendance.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Calculate the total working hours.
     */
    public function calculateWorkingHours(): float
    {
        if (!$this->check_in || !$this->check_out) {
            return 0;
        }

        $checkIn = new \DateTime($this->check_in);
        $checkOut = new \DateTime($this->check_out);
        $diff = $checkOut->diff($checkIn);

        $hours = $diff->h;
        $minutes = $diff->i / 60;

        return $hours + $minutes;
    }

    /**
     * Check if the employee is present.
     */
    public function isPresent(): bool
    {
        return $this->status === 'present';
    }

    /**
     * Check if the employee is absent.
     */
    public function isAbsent(): bool
    {
        return $this->status === 'absent';
    }

    /**
     * Check if the employee is on leave.
     */
    public function isOnLeave(): bool
    {
        return $this->status === 'leave';
    }

    /**
     * Check if the employee is on half day.
     */
    public function isHalfDay(): bool
    {
        return $this->status === 'half_day';
    }
}
