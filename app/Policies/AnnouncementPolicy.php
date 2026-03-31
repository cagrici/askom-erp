<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnnouncementPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Tüm kullanıcılar duyuruları listeleyebilir
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Announcement $announcement): bool
    {
        return $announcement->isVisibleFor($user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission(['announcement.create', 'announcement.manage']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Announcement $announcement): bool
    {
        // Kendi oluşturduğu duyuruyu güncelleyebilir
        if ($announcement->created_by === $user->id) {
            return true;
        }

        // Yönetim yetkisi varsa güncelleyebilir
        return $user->hasAnyPermission(['announcement.update', 'announcement.manage']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Announcement $announcement): bool
    {
        // Kendi oluşturduğu duyuruyu silebilir
        if ($announcement->created_by === $user->id) {
            return true;
        }

        // Yönetim yetkisi varsa silebilir
        return $user->hasAnyPermission(['announcement.delete', 'announcement.manage']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Announcement $announcement): bool
    {
        return $user->hasAnyPermission(['announcement.restore', 'announcement.manage']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Announcement $announcement): bool
    {
        return $user->hasPermission('announcement.manage');
    }

    /**
     * Determine whether the user can view statistics.
     */
    public function viewStatistics(User $user): bool
    {
        return $user->hasAnyPermission(['announcement.statistics', 'announcement.manage']);
    }
}
