<?php

namespace App\Policies;

use App\Models\WorkRequest;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class WorkRequestPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Any authenticated user can view work requests
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, WorkRequest $workRequest): bool
    {
        // User is the requester
        if ($user->id === $workRequest->requester_id) {
            return true;
        }

        // User is the assignee
        if ($user->id === $workRequest->assignee_id) {
            return true;
        }

        // User is the reviewer
        if ($user->id === $workRequest->reviewer_id) {
            return true;
        }

        // User is an approver
        if ($workRequest->approvalRequests()->where('approver_id', $user->id)->exists()) {
            return true;
        }

        // User is a department manager for this request's department
        if (
            $user->department && 
            $user->department->manager_id === $user->id && 
            $workRequest->department_id === $user->department_id
        ) {
            return true;
        }

        // Admins can view any work request
        if ($user->is_admin) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // All users can create work requests
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, WorkRequest $workRequest): bool
    {
        // Requester can update if the request is not yet approved/rejected
        if (
            $user->id === $workRequest->requester_id && 
            !in_array($workRequest->status, ['approved', 'rejected', 'completed'])
        ) {
            return true;
        }

        // Assignee can update
        if ($user->id === $workRequest->assignee_id) {
            return true;
        }

        // Department manager can update requests for their department
        if (
            $user->department && 
            $user->department->manager_id === $user->id && 
            $workRequest->department_id === $user->department_id
        ) {
            return true;
        }

        // Admins can update any request
        if ($user->is_admin) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, WorkRequest $workRequest): bool
    {
        // Requester can delete if the request is still pending
        if (
            $user->id === $workRequest->requester_id && 
            $workRequest->status === 'pending'
        ) {
            return true;
        }

        // Department manager can delete requests for their department
        if (
            $user->department && 
            $user->department->manager_id === $user->id && 
            $workRequest->department_id === $user->department_id
        ) {
            return true;
        }

        // Admins can delete any request
        if ($user->is_admin) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can approve the request.
     */
    public function approve(User $user, WorkRequest $workRequest): bool
    {
        // User is an approver for a pending approval request
        $isPendingApprover = $workRequest->approvalRequests()
            ->where('status', 'pending')
            ->where('approver_id', $user->id)
            ->exists();

        if ($isPendingApprover) {
            return true;
        }

        // Department manager can approve requests for their department
        if (
            $user->department && 
            $user->department->manager_id === $user->id && 
            $workRequest->department_id === $user->department_id
        ) {
            return true;
        }

        // Admins can approve any request
        if ($user->is_admin) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can reject the request.
     */
    public function reject(User $user, WorkRequest $workRequest): bool
    {
        // Same logic as approve
        return $this->approve($user, $workRequest);
    }

    /**
     * Determine whether the user can complete the request.
     */
    public function complete(User $user, WorkRequest $workRequest): bool
    {
        // Only assignee can mark as completed
        if ($user->id === $workRequest->assignee_id && $workRequest->status === 'in_progress') {
            return true;
        }

        // Department manager can complete
        if (
            $user->department && 
            $user->department->manager_id === $user->id && 
            $workRequest->department_id === $user->department_id
        ) {
            return true;
        }

        // Admins can complete any request
        if ($user->is_admin) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, WorkRequest $workRequest): bool
    {
        // Only admins can restore
        return $user->is_admin;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, WorkRequest $workRequest): bool
    {
        // Only admins can force delete
        return $user->is_admin;
    }
}
