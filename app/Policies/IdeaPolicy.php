<?php

namespace App\Policies;

use App\Models\IdeaPool\Idea;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IdeaPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Anyone authenticated can view ideas
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Idea $idea): bool
    {
        return true; // Anyone authenticated can view an idea
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true; // Anyone authenticated can create ideas
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Idea $idea): bool
    {
        // User can update their own idea or if they have permission
        return $user->id === $idea->user_id || $user->can('ideas.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Idea $idea): bool
    {
        // User can delete their own idea or if they have permission
        return $user->id === $idea->user_id || $user->can('ideas.delete');
    }

    /**
     * Determine whether the user can vote on the model.
     */
    public function vote(User $user, Idea $idea): bool
    {
        // Users cannot vote on their own ideas
        return $user->id !== $idea->user_id;
    }

    /**
     * Determine whether the user can comment on the model.
     */
    public function comment(User $user, Idea $idea): bool
    {
        return true; // Anyone authenticated can comment
    }

    /**
     * Determine whether the user can update the status of the model.
     */
    public function updateStatus(User $user, Idea $idea): bool
    {
        // Only users with the appropriate permission can update status
        return $user->can('ideas.update_status');
    }
}
