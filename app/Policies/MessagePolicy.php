<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function update(User $user, Message $message): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $message->user_id === $user->id && $message->created_at->diffInHours(now()) < 24;
    }

    public function delete(User $user, Message $message): bool
    {
        // Super Admin bypass
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        return $message->user_id === $user->id || $user->hasRole('admin');
    }
}