<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DocumentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Any authenticated user can view documents
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Document $document): bool
    {
        // Check if document is accessible by this user
        return $document->isAccessibleBy($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // All users can create documents by default
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Document $document): bool
    {
        // Document owner can update
        if ($user->id === $document->user_id) {
            return true;
        }

        // Admins can update any document
        if ($user->is_admin) {
            return true;
        }

        // Department managers can update documents for their department
        if (
            $user->department && 
            $user->department->manager_id === $user->id && 
            $document->department_id === $user->department_id
        ) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Document $document): bool
    {
        // Same logic as update
        return $this->update($user, $document);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Document $document): bool
    {
        // Only admins or the document owner can restore
        return $user->is_admin || $user->id === $document->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Document $document): bool
    {
        // Only admins can force delete
        return $user->is_admin;
    }
}
