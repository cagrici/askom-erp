<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_date',
        'review_period',
        'performance_score',
        'strengths',
        'areas_for_improvement',
        'goals',
        'training_needs',
        'employee_comments',
        'manager_comments',
        'status',
        'next_review_date',
    ];

    protected $casts = [
        'review_date' => 'date',
        'next_review_date' => 'date',
        'performance_score' => 'integer',
    ];

    /**
     * Get the employee that owns the performance review.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who reviewed the employee.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Check if the performance review is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the performance review is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if the performance review is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the performance review is acknowledged by the employee.
     */
    public function isAcknowledged(): bool
    {
        return $this->status === 'acknowledged';
    }
}
