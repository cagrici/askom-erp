<?php

namespace App\Policies;

use App\Models\JobGroup;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class JobGroupPolicy
{
    use HandlesAuthorization;

    public function view(User $user, JobGroup $jobGroup): bool
    {
        return $jobGroup->isUserMember($user);
    }

    public function update(User $user, JobGroup $jobGroup): bool
    {
        return $jobGroup->isUserAdmin($user) || $user->id === $jobGroup->created_by;
    }

    public function delete(User $user, JobGroup $jobGroup): bool
    {
        return $user->id === $jobGroup->created_by;
    }

    public function manageMember(User $user, JobGroup $jobGroup): bool
    {
        return $jobGroup->isUserAdmin($user) || $user->id === $jobGroup->created_by;
    }

    public function sendMessage(User $user, JobGroup $jobGroup): bool
    {
        return $jobGroup->isUserMember($user);
    }
}