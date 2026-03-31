<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Permission::query()
            ->with('roles')
            ->orderBy('id', 'desc');

        // Apply filters
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhere('module', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->has('module') && $request->module) {
            $query->where('module', $request->module);
        }

        // Get unique modules for filter
        $modules = Permission::distinct()
            ->orderBy('module')
            ->pluck('module')
            ->filter()
            ->values();

        // Paginate
        $permissions = $query->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'modules' => $modules,
            'filters' => $request->only(['search', 'module']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Get unique modules for dropdown
        $modules = Permission::distinct()
            ->orderBy('module')
            ->pluck('module')
            ->filter()
            ->values();

        return Inertia::render('Admin/Permissions/Create', [
            'modules' => $modules,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:permissions',
            'description' => 'nullable|string',
            'module' => 'required|string|max:100',
        ]);

        // Create permission
        Permission::create([
            'name' => $validatedData['name'],
            'slug' => Str::slug($validatedData['name']),
            'description' => $validatedData['description'],
            'module' => $validatedData['module'],
        ]);
        $this->forgetPermissionCache();

        return redirect()->route('admin.permissions.index')
            ->with('message', 'Permission created successfully');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Permission $permission)
    {
        // Load related roles
        $permission->load('roles');

        // Get unique modules for dropdown
        $modules = Permission::distinct()
            ->orderBy('module')
            ->pluck('module')
            ->filter()
            ->values();

        // Get all roles for assigning permissions
        $roles = Role::all();

        return Inertia::render('Admin/Permissions/Edit', [
            'permission' => $permission,
            'modules' => $modules,
            'roles' => $roles,
            'assignedRoles' => $permission->roles->pluck('id'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Permission $permission)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'description' => 'nullable|string',
            'module' => 'required|string|max:100',
        ]);

        // Update permission
        $permission->update([
            'name' => $validatedData['name'],
            'slug' => Str::slug($validatedData['name']),
            'description' => $validatedData['description'],
            'module' => $validatedData['module'],
        ]);

        // Update role assignments if present
        if ($request->has('roles')) {
            $permission->roles()->sync($request->roles);
            $this->forgetPermissionCache();
        }

        return redirect()->route('admin.permissions.index')
            ->with('message', 'Permission updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Permission $permission)
    {
        // Detach from all roles before deleting
        $permission->roles()->detach();
        
        // Detach from all users before deleting
        $permission->users()->detach();
        
        $permission->delete();
        $this->forgetPermissionCache();

        return redirect()->route('admin.permissions.index')
            ->with('message', 'Permission deleted successfully');
    }

    /**
     * Assign permissions to roles in bulk
     */
    public function assignRoles(Request $request, Permission $permission)
    {
        $validatedData = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $permission->roles()->sync($validatedData['roles']);
        $this->forgetPermissionCache();

        return redirect()->back()
            ->with('message', 'Permission assigned to roles successfully');
    }

    /**
     * Clear spatie permission cache after permission-role mutations.
     */
    private function forgetPermissionCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
