<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Role::query()
            ->with('users')
            ->orderBy('id', 'desc');

        // Apply filters
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        // Paginate
        $roles = $query->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $permissions = Permission::orderBy('module')->orderBy('name')->get()
            ->groupBy('module');

        return Inertia::render('Admin/Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'level' => 'nullable|integer',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        // Create role
        $role = Role::create([
            'name' => $validatedData['name'],
            'slug' => Str::slug($validatedData['name']),
            'description' => $validatedData['description'],
            'is_active' => $validatedData['is_active'] ?? true,
            'level' => $validatedData['level'] ?? 1,
            'is_system' => false,
        ]);

        // Sync permissions
        if (isset($validatedData['permissions'])) {
            $role->permissions()->sync($validatedData['permissions']);
            $this->forgetPermissionCache();
        }

        return redirect()->route('admin.roles.index')
            ->with('message', 'Role created successfully');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        // Try to get modules first, fallback to direct permissions if modules don't exist
        $modules = \App\Models\PermissionModule::active()
            ->ordered()
            ->with(['permissions' => function($query) {
                $query->active()->orderBy('group')->orderBy('order');
            }])
            ->get();

        $groupedPermissions = [];
        
        if ($modules->isNotEmpty()) {
            // Use module-based approach
            foreach ($modules as $module) {
                $modulePermissions = [];
                foreach ($module->permissions->groupBy('group') as $group => $permissions) {
                    $modulePermissions[$group] = $permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'display_name' => $permission->display_name,
                            'description' => $permission->description,
                        ];
                    });
                }
                if (!empty($modulePermissions)) {
                    $groupedPermissions[] = [
                        'module' => $module,
                        'permissions' => $modulePermissions,
                    ];
                }
            }
        } else {
            // Fallback: Group permissions by module field directly
            $permissions = Permission::active()
                ->orderBy('module')
                ->orderBy('group')
                ->orderBy('order')
                ->get();
                
            // If no permissions exist at all, create basic ones
            if ($permissions->isEmpty()) {
                $this->createBasicPermissions();
                $permissions = Permission::active()
                    ->orderBy('module')
                    ->orderBy('group')
                    ->orderBy('order')
                    ->get();
            }
            
            $permissions = $permissions->groupBy('module');

            foreach ($permissions as $moduleName => $modulePermissions) {
                $groupedModulePermissions = [];
                foreach ($modulePermissions->groupBy('group') as $group => $groupPermissions) {
                    $groupedModulePermissions[$group] = $groupPermissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'display_name' => $permission->display_name ?? $permission->name,
                            'description' => $permission->description ?? '',
                        ];
                    });
                }
                
                if (!empty($groupedModulePermissions)) {
                    $groupedPermissions[] = [
                        'module' => (object)[
                            'name' => ucfirst(str_replace('-', ' ', $moduleName)),
                            'slug' => $moduleName,
                            'display_name' => ucfirst(str_replace('-', ' ', $moduleName)),
                        ],
                        'permissions' => $groupedModulePermissions,
                    ];
                }
            }
        }

        $role->load('permissions');

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role,
            'groupedPermissions' => $groupedPermissions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        // System roles cannot be modified
        if ($role->is_system) {
            return redirect()->back()
                ->with('error', 'System roles cannot be modified');
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'level' => 'nullable|integer',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        // Update role
        $role->update([
            'name' => $validatedData['name'],
            'slug' => Str::slug($validatedData['name']),
            'description' => $validatedData['description'],
            'is_active' => $validatedData['is_active'] ?? true,
            'level' => $validatedData['level'] ?? 1,
        ]);

        // Sync permissions
        if (isset($validatedData['permissions'])) {
            $role->permissions()->sync($validatedData['permissions']);
            $this->forgetPermissionCache();
        }

        return redirect()->route('admin.roles.index')
            ->with('message', 'Role updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        // System roles cannot be deleted
        if ($role->is_system) {
            return redirect()->back()
                ->with('error', 'System roles cannot be deleted');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete a role with assigned users');
        }

        $role->delete();
        $this->forgetPermissionCache();

        return redirect()->route('admin.roles.index')
            ->with('message', 'Role deleted successfully');
    }

    /**
     * Create basic permissions if none exist
     */
    private function createBasicPermissions()
    {
        $basicPermissions = [
            ['name' => 'view users', 'display_name' => 'Kullanıcıları Görüntüleme', 'module' => 'users', 'group' => 'view'],
            ['name' => 'create users', 'display_name' => 'Kullanıcı Ekleme', 'module' => 'users', 'group' => 'create'],
            ['name' => 'edit users', 'display_name' => 'Kullanıcı Düzenleme', 'module' => 'users', 'group' => 'edit'],
            ['name' => 'delete users', 'display_name' => 'Kullanıcı Silme', 'module' => 'users', 'group' => 'delete'],
            ['name' => 'view roles', 'display_name' => 'Rolleri Görüntüleme', 'module' => 'roles', 'group' => 'view'],
            ['name' => 'create roles', 'display_name' => 'Rol Ekleme', 'module' => 'roles', 'group' => 'create'],
            ['name' => 'edit roles', 'display_name' => 'Rol Düzenleme', 'module' => 'roles', 'group' => 'edit'],
            ['name' => 'delete roles', 'display_name' => 'Rol Silme', 'module' => 'roles', 'group' => 'delete'],
            ['name' => 'view permissions', 'display_name' => 'İzinleri Görüntüleme', 'module' => 'permissions', 'group' => 'view'],
            ['name' => 'edit permissions', 'display_name' => 'İzin Düzenleme', 'module' => 'permissions', 'group' => 'edit'],
        ];

        foreach ($basicPermissions as $index => $permission) {
            Permission::create([
                'name' => $permission['name'],
                'display_name' => $permission['display_name'],
                'module' => $permission['module'],
                'group' => $permission['group'],
                'order' => $index + 1,
                'is_active' => true,
                'guard_name' => 'web',
                'description' => $permission['display_name'],
            ]);
        }
    }

    /**
     * Clear spatie permission cache after role/permission mutations.
     */
    private function forgetPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
