<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class ModulePermissionServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Modül bazlı gate tanımlamaları
        Gate::before(function ($user, $ability) {
            // Super admin her şeye erişebilir
            if ($user->hasRole('super-admin') || $user->hasRole('Super Admin')) {
                return true;
            }
        });

        // Belgeler modülü
        Gate::define('documents.view', function (User $user) {
            return $user->hasModulePermission('documents.view');
        });

        Gate::define('documents.create', function (User $user) {
            return $user->hasModulePermission('documents.create');
        });

        Gate::define('documents.edit', function (User $user) {
            return $user->hasModulePermission('documents.edit');
        });

        Gate::define('documents.delete', function (User $user) {
            return $user->hasModulePermission('documents.delete');
        });

        // Yapılacaklar modülü
        Gate::define('todos.view', function (User $user) {
            return $user->hasModulePermission('todos.view');
        });

        Gate::define('todos.create', function (User $user) {
            return $user->hasModulePermission('todos.create');
        });

        Gate::define('todos.edit', function (User $user) {
            return $user->hasModulePermission('todos.edit');
        });

        Gate::define('todos.delete', function (User $user) {
            return $user->hasModulePermission('todos.delete');
        });

        // Ziyaretçi Yönetimi modülü
        Gate::define('visitors.view', function (User $user) {
            return $user->hasModulePermission('visitors.view');
        });

        Gate::define('visitors.create', function (User $user) {
            return $user->hasModulePermission('visitors.create');
        });

        Gate::define('visitors.edit', function (User $user) {
            return $user->hasModulePermission('visitors.edit');
        });

        Gate::define('visitors.delete', function (User $user) {
            return $user->hasModulePermission('visitors.delete');
        });

        Gate::define('visitors.approve', function (User $user) {
            return $user->hasModulePermission('visitors.approve');
        });

        // Filo Yönetimi modülü
        Gate::define('fleet.view', function (User $user) {
            return $user->hasModulePermission('fleet.view');
        });

        Gate::define('fleet.create', function (User $user) {
            return $user->hasModulePermission('fleet.create');
        });

        Gate::define('fleet.edit', function (User $user) {
            return $user->hasModulePermission('fleet.edit');
        });

        Gate::define('fleet.delete', function (User $user) {
            return $user->hasModulePermission('fleet.delete');
        });

        Gate::define('fleet.reserve', function (User $user) {
            return $user->hasModulePermission('fleet.reserve');
        });

        // Duyurular modülü
        Gate::define('announcements.view', function (User $user) {
            return $user->hasModulePermission('announcements.view');
        });

        Gate::define('announcements.create', function (User $user) {
            return $user->hasModulePermission('announcements.create');
        });

        Gate::define('announcements.edit', function (User $user) {
            return $user->hasModulePermission('announcements.edit');
        });

        Gate::define('announcements.delete', function (User $user) {
            return $user->hasModulePermission('announcements.delete');
        });

        Gate::define('announcements.publish', function (User $user) {
            return $user->hasModulePermission('announcements.publish');
        });

        // Harcamalar modülü
        Gate::define('expenses.view', function (User $user) {
            return $user->hasModulePermission('expenses.view');
        });

        Gate::define('expenses.create', function (User $user) {
            return $user->hasModulePermission('expenses.create');
        });

        Gate::define('expenses.edit', function (User $user) {
            return $user->hasModulePermission('expenses.edit');
        });

        Gate::define('expenses.delete', function (User $user) {
            return $user->hasModulePermission('expenses.delete');
        });

        Gate::define('expenses.approve', function (User $user) {
            return $user->hasModulePermission('expenses.approve');
        });

        // Kullanıcı Yönetimi
        Gate::define('users.view', function (User $user) {
            return $user->hasModulePermission('users.view');
        });

        Gate::define('users.create', function (User $user) {
            return $user->hasModulePermission('users.create');
        });

        Gate::define('users.edit', function (User $user) {
            return $user->hasModulePermission('users.edit');
        });

        Gate::define('users.delete', function (User $user) {
            return $user->hasModulePermission('users.delete');
        });

        // Roller
        Gate::define('roles.view', function (User $user) {
            return $user->hasModulePermission('roles.view');
        });

        Gate::define('roles.create', function (User $user) {
            return $user->hasModulePermission('roles.create');
        });

        Gate::define('roles.edit', function (User $user) {
            return $user->hasModulePermission('roles.edit');
        });

        Gate::define('roles.delete', function (User $user) {
            return $user->hasModulePermission('roles.delete');
        });
    }
}