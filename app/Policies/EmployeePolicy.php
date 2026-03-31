<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class EmployeePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->hasPermissionTo('view employees') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Employee $employee): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Users can always view their own employee record
        if ($user->id === $employee->user_id) {
            return true;
        }

        return $user->hasPermissionTo('view employees') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->hasPermissionTo('create employees') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Employee $employee): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->hasPermissionTo('edit employees') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Employee $employee): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->hasPermissionTo('delete employees') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Employee $employee): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->hasPermissionTo('delete employees') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Employee $employee): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $user->hasRole('admin');
    }
}
