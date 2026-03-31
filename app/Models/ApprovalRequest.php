<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'resource_id',
        'resource_type',
        'status',
        'approver_id',
        'workflow_id',
        'step',
    ];

    /**
     * Get the user who should approve this request
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    /**
     * Get the workflow this request belongs to
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    /**
     * Get the approval actions for this request
     */
    public function actions(): HasMany
    {
        return $this->hasMany(ApprovalAction::class);
    }

    /**
     * Check if this approval request is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if this approval request is approved
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if this approval request is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
