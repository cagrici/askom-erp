<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Training extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'training_type',
        'start_date',
        'end_date',
        'location',
        'trainer',
        'status',
        'cost',
        'currency',
        'materials',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'cost' => 'decimal:2',
    ];

    /**
     * Get the employees for the training.
     */
    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_training')
                    ->withPivot('status', 'is_completed', 'completion_date', 'feedback', 'score', 'certificate')
                    ->withTimestamps();
    }

    /**
     * Check if the training is scheduled.
     */
    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }

    /**
     * Check if the training is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if the training is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the training is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Get the duration of the training in days.
     */
    public function getDurationAttribute(): int
    {
        if (!$this->end_date) {
            return 1;
        }
        
        return $this->start_date->diffInDays($this->end_date) + 1;
    }
}
