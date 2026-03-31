<?php

namespace App\Policies;

use App\Models\IdeaPool\IdeaCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IdeaCategoryPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('idea_categories.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, IdeaCategory $ideaCategory): bool
    {
        return $user->can('idea_categories.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('idea_categories.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, IdeaCategory $ideaCategory): bool
    {
        return $user->can('idea_categories.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, IdeaCategory $ideaCategory): bool
    {
        return $user->can('idea_categories.delete');
    }
}
