<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExpensePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any expenses.
     */
    public function viewAny(User $user): bool
    {
        return true; // All users can view the expenses list (their own expenses)
    }

    /**
     * Determine whether the user can view the expense.
     */
    public function view(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Users can view their own expenses or if they are admin
        return $user->id === $expense->user_id || 
               $user->is_admin ||
               $user->hasRole('admin') ||
               $user->id === $expense->approved_by;
    }

    /**
     * Determine whether the user can create expenses.
     */
    public function create(User $user): bool
    {
        return true; // All users can create expenses
    }

    /**
     * Determine whether the user can update the expense.
     */
    public function update(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only the owner can update their own pending expenses,
        // or users with admin privileges
        return ($user->id === $expense->user_id && $expense->status === 'pending') || 
               $user->is_admin || 
               $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the expense.
     */
    public function delete(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only the owner can delete their own pending expenses,
        // or users with admin privileges
        return ($user->id === $expense->user_id && $expense->status === 'pending') || 
               $user->is_admin || 
               $user->hasRole('admin');
    }

    /**
     * Determine whether the user can approve or reject the expense.
     */
    public function approve(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only managers or admins can approve/reject expenses
        // Also prevent users from approving their own expenses
        return ($user->is_admin || $user->hasRole('admin')) && 
               $user->id !== $expense->user_id &&
               $expense->status === 'pending';
    }

    /**
     * Determine whether the user can manage expenses (mark as paid, reimburse, etc).
     */
    public function manage(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only finance staff, managers, or admins can manage expenses
        return $user->is_admin || 
               $user->hasRole('admin') || 
               $user->hasRole('finance');
    }

    /**
     * Determine whether the user can restore the expense.
     */
    public function restore(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the expense.
     */
    public function forceDelete(User $user, Expense $expense): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->is_admin || $user->hasRole('admin');
    }
}
