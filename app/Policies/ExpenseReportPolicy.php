<?php

namespace App\Policies;

use App\Models\ExpenseReport;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExpenseReportPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any expense reports.
     */
    public function viewAny(User $user): bool
    {
        return true; // All users can view the expense reports list (their own reports)
    }

    /**
     * Determine whether the user can view the expense report.
     */
    public function view(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Users can view their own expense reports or if they are admin
        return $user->id === $expenseReport->user_id || 
               $user->is_admin ||
               $user->hasRole('admin') ||
               $user->id === $expenseReport->approved_by;
    }

    /**
     * Determine whether the user can create expense reports.
     */
    public function create(User $user): bool
    {
        return true; // All users can create expense reports
    }

    /**
     * Determine whether the user can update the expense report.
     */
    public function update(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only the owner can update their own pending reports,
        // or users with admin privileges
        return ($user->id === $expenseReport->user_id && $expenseReport->status === 'pending') || 
               $user->is_admin || 
               $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the expense report.
     */
    public function delete(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only the owner can delete their own pending reports,
        // or users with admin privileges
        return ($user->id === $expenseReport->user_id && $expenseReport->status === 'pending') || 
               $user->is_admin || 
               $user->hasRole('admin');
    }

    /**
     * Determine whether the user can approve or reject the expense report.
     */
    public function approve(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only managers or admins can approve/reject expense reports
        // Also prevent users from approving their own reports
        return ($user->is_admin || $user->hasRole('admin')) && 
               $user->id !== $expenseReport->user_id &&
               $expenseReport->status === 'pending';
    }

    /**
     * Determine whether the user can manage expense reports (export, etc).
     */
    public function manage(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only finance staff, managers, or admins can manage expense reports
        return $user->is_admin || 
               $user->hasRole('admin') || 
               $user->hasRole('finance');
    }

    /**
     * Determine whether the user can restore the expense report.
     */
    public function restore(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the expense report.
     */
    public function forceDelete(User $user, ExpenseReport $expenseReport): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->is_admin || $user->hasRole('admin');
    }
}
