<?php

namespace App\Policies;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ExpenseCategoryPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any expense categories.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only users with admin privileges can view all categories
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the expense category.
     */
    public function view(User $user, ExpenseCategory $expenseCategory): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only users with admin privileges can view categories
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can create expense categories.
     */
    public function create(User $user): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only users with admin privileges can create categories
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the expense category.
     */
    public function update(User $user, ExpenseCategory $expenseCategory): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only users with admin privileges can update categories
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the expense category.
     */
    public function delete(User $user, ExpenseCategory $expenseCategory): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Only users with admin privileges can delete categories
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can restore the expense category.
     */
    public function restore(User $user, ExpenseCategory $expenseCategory): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->is_admin || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the expense category.
     */
    public function forceDelete(User $user, ExpenseCategory $expenseCategory): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->is_admin || $user->hasRole('admin');
    }
}
