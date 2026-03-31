<?php

namespace App\Policies;

use App\Models\MessageGroup;
use App\Models\User;

class MessageGroupPolicy
{
    /**
     * Check if user is super admin
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super admin');
    }

    public function view(User $user, MessageGroup $group): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        return $group->participants()->where('user_id', $user->id)->exists();
    }

    public function participate(User $user, MessageGroup $group): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        return $group->participants()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, MessageGroup $group): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        return $group->participants()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    public function delete(User $user, MessageGroup $group): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        return $group->created_by === $user->id;
    }

    public function manageMember(User $user, MessageGroup $group): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        return $group->participants()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    public function sendMessage(User $user, MessageGroup $group): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }
        
        return $group->participants()->where('user_id', $user->id)->exists();
    }
}