<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use Spatie\Permission\Models\Permission;

class PermissionServiceProvider extends ServiceProvider
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
        // Register permissions as Gates for more convenient authorization checks
        try {
            // Only attempt to register permissions if the permissions table exists
            if (app()->environment() !== 'testing' && \Schema::hasTable('permissions')) {
                Permission::get()->each(function (Permission $permission) {
                    Gate::define($permission->name, function (User $user) use ($permission) {
                        return $user->hasPermissionTo($permission);
                    });
                });
            }
        } catch (\Exception $e) {
            // If the permissions table doesn't exist yet (during migrations), simply continue
            report($e);
        }

        // Define super admin gate
        Gate::define('viewRoles', function (User $user) {
            return $user->hasPermissionTo('roles.view');
        });

        Gate::define('createRoles', function (User $user) {
            return $user->hasPermissionTo('roles.create');
        });

        Gate::define('updateRoles', function (User $user) {
            return $user->hasPermissionTo('roles.edit');
        });

        Gate::define('deleteRoles', function (User $user) {
            return $user->hasPermissionTo('roles.delete');
        });

        Gate::define('viewPermissions', function (User $user) {
            return $user->hasPermissionTo('permissions.view');
        });

        Gate::define('createPermissions', function (User $user) {
            return $user->hasPermissionTo('permissions.create');
        });

        Gate::define('updatePermissions', function (User $user) {
            return $user->hasPermissionTo('permissions.edit');
        });

        Gate::define('deletePermissions', function (User $user) {
            return $user->hasPermissionTo('permissions.delete');
        });
    }
}
