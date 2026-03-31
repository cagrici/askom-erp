<?php

namespace App\Policies;

use App\Models\IdeaPool\IdeaComment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IdeaCommentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, IdeaComment $comment): bool
    {
        // User can update their own comment or if they have permission
        return $user->id === $comment->user_id || $user->can('idea_comments.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, IdeaComment $comment): bool
    {
        // User can delete their own comment or if they have permission
        return $user->id === $comment->user_id || $user->can('idea_comments.delete');
    }
}
