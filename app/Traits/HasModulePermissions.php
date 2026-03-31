<?php

namespace App\Traits;

use App\Models\Permission;
use App\Models\PermissionModule;

trait HasModulePermissions
{
    /**
     * Check if the user has a specific module permission.
     *
     * @param string $permission
     * @return bool
     */
    public function hasModulePermission(string $permission): bool
    {
        // Super admin has all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Use Spatie's hasPermissionTo method
        return $this->hasPermissionTo($permission);
    }

    /**
     * Check if the user has any of the given module permissions.
     *
     * @param array $permissions
     * @return bool
     */
    public function hasAnyModulePermission(array $permissions): bool
    {
        // Use Spatie's hasAnyPermission method
        return $this->hasAnyPermission($permissions);
    }

    /**
     * Check if the user has all of the given module permissions.
     *
     * @param array $permissions
     * @return bool
     */
    public function hasAllModulePermissions(array $permissions): bool
    {
        // Use Spatie's hasAllPermissions method  
        return $this->hasAllPermissions($permissions);
    }

    /**
     * Check if the user has permission to access a module.
     *
     * @param string $module
     * @return bool
     */
    public function hasModuleAccess(string $module): bool
    {
        // Super admin has access to all modules
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if user has any permission in this module
        $modulePermissions = Permission::where('module', $module)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        return $this->hasAnyModulePermission($modulePermissions);
    }

    /**
     * Get all permissions for a specific module.
     *
     * @param string $module
     * @return \Illuminate\Support\Collection
     */
    public function getModulePermissions(string $module)
    {
        $allPermissions = collect();

        // Get direct permissions
        $directPermissions = $this->permissions()
            ->where('module', $module)
            ->where('is_active', true)
            ->get();

        $allPermissions = $allPermissions->merge($directPermissions);

        // Get role permissions
        foreach ($this->roles as $role) {
            $rolePermissions = $role->permissions()
                ->where('module', $module)
                ->where('is_active', true)
                ->get();
            $allPermissions = $allPermissions->merge($rolePermissions);
        }

        return $allPermissions->unique('id');
    }

    /**
     * Get all accessible modules for the user.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getAccessibleModules()
    {
        // Super admin has access to all modules
        if ($this->isSuperAdmin()) {
            return PermissionModule::active()->ordered()->get();
        }

        $moduleIds = collect();

        // Get modules from direct permissions
        $directModules = $this->permissions()
            ->where('is_active', true)
            ->pluck('module')
            ->unique();

        // Get modules from role permissions
        foreach ($this->roles as $role) {
            $roleModules = $role->permissions()
                ->where('is_active', true)
                ->pluck('module')
                ->unique();
            $directModules = $directModules->merge($roleModules);
        }

        return PermissionModule::active()
            ->whereIn('slug', $directModules->unique())
            ->ordered()
            ->get();
    }
}