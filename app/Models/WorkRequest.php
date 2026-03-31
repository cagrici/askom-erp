<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\ApprovalAction;

class WorkRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'requester_id',
        'assignee_id',
        'status',
        'priority',
        'due_date',
        'category',
        'department_id',
        'reviewer_id',
        'completed_at',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'workflow_id',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Get the user who requested the work
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /**
     * Get the user assigned to the work request
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /**
     * Get the reviewer of the work request
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Get the department associated with this work request
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the approval workflow for this request
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    /**
     * Get the approval requests for this work request
     */
    public function approvalRequests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'resource_id')
            ->where('resource_type', 'work_request');
    }

    /**
     * Get the current approval status
     */
    public function getCurrentApprovalStatus(): string
    {
        if ($this->approved_at) {
            return 'approved';
        }

        if ($this->rejected_at) {
            return 'rejected';
        }

        $currentApproval = $this->approvalRequests()
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$currentApproval) {
            return 'pending';
        }

        return $currentApproval->status;
    }

    /**
     * Mark the request as completed
     */
    public function complete(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark the request as approved
     */
    public function approve(int $approverId, ?string $comments = null): void
    {
        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        // Create approval action
        if ($this->workflow_id) {
            $approvalRequest = $this->approvalRequests()
                ->where('status', 'pending')
                ->first();

            if ($approvalRequest) {
                $approvalRequest->update(['status' => 'approved']);

                ApprovalAction::create([
                    'approval_request_id' => $approvalRequest->id,
                    'user_id' => $approverId,
                    'action' => 'approve',
                    'comments' => $comments,
                ]);
            }
        }
    }

    /**
     * Mark the request as rejected
     */
    public function reject(int $rejecterId, string $reason): void
    {
        $this->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        // Create rejection action
        if ($this->workflow_id) {
            $approvalRequest = $this->approvalRequests()
                ->where('status', 'pending')
                ->first();

            if ($approvalRequest) {
                $approvalRequest->update(['status' => 'rejected']);

                ApprovalAction::create([
                    'approval_request_id' => $approvalRequest->id,
                    'user_id' => $rejecterId,
                    'action' => 'reject',
                    'comments' => $reason,
                ]);
            }
        }
    }
}
