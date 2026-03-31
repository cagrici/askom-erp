<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query()
            ->with(['roles', 'companyLocations', 'department'])
            ->orderBy('id', 'desc');

        // Apply filters
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%")
                    ->orWhere('username', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->has('role') && $request->role) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->role);
            });
        }

        if ($request->has('location') && $request->location) {
            $query->whereHas('companyLocations', function ($q) use ($request) {
                $q->where('locations.id', $request->location);
            });
        }

        if ($request->has('department') && $request->department) {
            $query->where('department_id', $request->department);
        }

        // Paginate
        $perPage = in_array((int) $request->per_page, [10, 20, 30, 50, 100]) ? (int) $request->per_page : 10;
        $users = $query->paginate($perPage)
            ->withQueryString();

        // Ensure companyLocations is always an array even if empty
        $users->getCollection()->transform(function ($user) {
            // Initialize companyLocations as empty array if not set
            if (!isset($user->companyLocations)) {
                $user->companyLocations = [];
            }
            return $user;
        });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => Role::all(),
            'companyLocations' => Location::where('is_active', true)->get(),
            'departments' => Department::all(),
            'filters' => $request->only(['search', 'role', 'location', 'department', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Users/Create', [
            'roles' => Role::all(),
            'companyLocations' => Location::where('is_active', true)->get(),
            'departments' => Department::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Modify validation based on available columns
        $validationRules = [
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
        ];

        // Add optional validation rules based on schema
        if (Schema::hasColumn('users', 'username')) {
            $validationRules['username'] = 'required|string|max:255|unique:users';
        }

        if (Schema::hasColumn('users', 'department_id')) {
            $validationRules['department_id'] = 'nullable|exists:departments,id';
        }

        if (Schema::hasColumn('users', 'position')) {
            $validationRules['position'] = 'nullable|string|max:255';
        }

        if (Schema::hasColumn('users', 'host_id')) {
            $validationRules['host_id'] = 'nullable|string|max:100';
        }

        if (Schema::hasColumn('users', 'is_admin')) {
            $validationRules['is_admin'] = 'boolean';
        }

        if (Schema::hasColumn('users', 'status')) {
            $validationRules['status'] = 'boolean';
        } else if (Schema::hasColumn('users', 'is_active')) {
            $validationRules['status'] = 'boolean';
        }

        $validationRules['roles'] = 'required|array|min:1';
        $validationRules['roles.*'] = 'exists:roles,id';

        $validatedData = $request->validate($validationRules, [
            'roles.required' => 'Rol seçimi zorunludur.',
            'roles.min' => 'En az bir rol seçilmelidir.',
        ]);

        // Prepare data for user creation
        $userData = [
            'name' => $validatedData['first_name'] . ' ' . $validatedData['last_name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
        ];

        // Add optional fields if they exist in database
        if (Schema::hasColumn('users', 'first_name')) {
            $userData['first_name'] = $validatedData['first_name'];
        }

        if (Schema::hasColumn('users', 'last_name')) {
            $userData['last_name'] = $validatedData['last_name'];
        }

        if (Schema::hasColumn('users', 'username') && isset($validatedData['username'])) {
            $userData['username'] = $validatedData['username'];
        } else if (Schema::hasColumn('users', 'username')) {
            $userData['username'] = strtolower(str_replace(' ', '.', $userData['name']));
        }

        if (Schema::hasColumn('users', 'department_id') && isset($validatedData['department_id'])) {
            $userData['department_id'] = $validatedData['department_id'];
        }

        if (Schema::hasColumn('users', 'position') && isset($validatedData['position'])) {
            $userData['position'] = $validatedData['position'];
        }

        if (Schema::hasColumn('users', 'host_id') && isset($validatedData['employee_id'])) {
            $userData['host_id'] = $validatedData['host_id'];
        }

        if (Schema::hasColumn('users', 'is_admin') && isset($validatedData['is_admin'])) {
            $userData['is_admin'] = $validatedData['is_admin'];
        }

        if (Schema::hasColumn('users', 'status') && isset($validatedData['status'])) {
            $userData['status'] = $validatedData['status'];
        } else if (Schema::hasColumn('users', 'is_active') && isset($validatedData['status'])) {
            $userData['is_active'] = $validatedData['status'];
        }

        // Create user
        $user = User::create($userData);

        // Assign roles
        if ($request->has('roles')) {
            $user->roles()->attach($request->roles);
        }

        // Assign company locations
        if ($request->has('companyLocations')) {
            $locationsData = [];
            foreach ($request->companyLocations as $location) {
                $locationsData[$location['id']] = [
                    'is_primary' => $location['is_primary'] ?? false,
                    'is_admin' => $location['is_admin'] ?? false,
                ];
            }
            $user->companyLocations()->attach($locationsData);
        }

        return redirect()->route('admin.users.index')
            ->with('message', 'User created successfully');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        $user->load(['roles', 'companyLocations', 'department', 'assignedAccounts']);

        // Ensure companyLocations is always an array even if empty
        if (!isset($user->companyLocations)) {
            $user->companyLocations = [];
        }

        // Ensure roles is always an array even if empty
        if (!isset($user->roles)) {
            $user->roles = [];
        }

        // Ensure assignedAccounts is always an array even if empty
        if (!isset($user->assignedAccounts)) {
            $user->assignedAccounts = [];
        }

        // Debugging - Log user data
        \Log::info('User data for edit page:', ['user' => $user->toArray()]);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => Role::all(),
            'companyLocations' => Location::where('is_active', true)->get(),
            'departments' => Department::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        // Log incoming request data for debugging
        \Log::info('User update request data:', $request->all());

        // Modify validation according to available database columns
        $validatedData = $request->validate([
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'password' => 'nullable|string|min:8|confirmed',
            'department_id' => 'nullable|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'host_id' => 'nullable|string|max:100',
            'is_admin' => 'boolean',
            'status' => 'boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,id',
        ], [
            'roles.required' => 'Rol seçimi zorunludur.',
            'roles.min' => 'En az bir rol seçilmelidir.',
        ]);

        // Update user data with available columns
        $updateData = [
            // Combine first_name and last_name into name
            'name' => $validatedData['first_name'] . ' ' . $validatedData['last_name'],
            'email' => $validatedData['email'],
        ];

        // Add optional fields if they exist in database
        if (Schema::hasColumn('users', 'first_name')) {
            $updateData['first_name'] = $validatedData['first_name'];
        }

        if (Schema::hasColumn('users', 'last_name')) {
            $updateData['last_name'] = $validatedData['last_name'];
        }

        if (Schema::hasColumn('users', 'username')) {
            $updateData['username'] = $request->username;
        }

        if (Schema::hasColumn('users', 'department_id')) {
            $updateData['department_id'] = $validatedData['department_id'];
        }

        if (Schema::hasColumn('users', 'position')) {
            $updateData['position'] = $validatedData['position'];
        }

        if (Schema::hasColumn('users', 'host_id')) {
            $updateData['host_id'] = $validatedData['host_id'];
        }

        if (Schema::hasColumn('users', 'is_admin')) {
            $updateData['is_admin'] = $validatedData['is_admin'];
        }

        if (Schema::hasColumn('users', 'status')) {
            $updateData['status'] = $validatedData['status'];
        } else if (Schema::hasColumn('users', 'is_active')) {
            $updateData['is_active'] = $validatedData['status'];
        }

        // Update password only if provided
        if (!empty($validatedData['password'])) {
            $updateData['password'] = Hash::make($validatedData['password']);
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if it exists
            if ($user->avatar && \Storage::disk('public')->exists($user->avatar)) {
                \Storage::disk('public')->delete($user->avatar);
            }
            
            // Store new avatar
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $updateData['avatar'] = $avatarPath;
        }

        $user->update($updateData);

        // Update roles
        if ($request->has('roles')) {
            $user->roles()->sync($request->roles);
        }

        // Update company locations
        if ($request->has('companyLocations')) {
            $locationsData = [];
            foreach ($request->companyLocations as $location) {
                $locationsData[$location['id']] = [
                    'is_primary' => $location['is_primary'] ?? false,
                    'is_admin' => $location['is_admin'] ?? false,
                ];
            }
            $user->companyLocations()->sync($locationsData);
        }

        return redirect()->route('admin.users.index')
            ->with('message', 'User updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('message', 'User deleted successfully');
    }

    /**
     * Manage company locations for a user
     */
    public function manageCompanyLocations(Request $request, User $user)
    {
        \Log::info('Managing company locations for user: ' . $user->id);
        \Log::info('Request data: ', $request->all());
        
        $validatedData = $request->validate([
            'companyLocations' => 'required|array',
            'companyLocations.*.id' => 'required|exists:locations,id',
            'companyLocations.*.is_primary' => 'boolean',
            'companyLocations.*.is_admin' => 'boolean',
        ]);

        $locationsData = [];
        foreach ($validatedData['companyLocations'] as $location) {
            $locationsData[$location['id']] = [
                'is_primary' => $location['is_primary'] ?? false,
                'is_admin' => $location['is_admin'] ?? false,
            ];
        }

        $user->companyLocations()->sync($locationsData);

        // If it's an AJAX request, return JSON response
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Company locations updated successfully'
            ]);
        }

        return redirect()->back()
            ->with('message', 'Company locations updated successfully');
    }

    /**
     * Manage assigned customer accounts for a user
     */
    public function manageAccounts(Request $request, User $user)
    {
        $validatedData = $request->validate([
            'accounts' => 'required|array',
            'accounts.*.id' => 'required|exists:current_accounts,id',
            'accounts.*.is_default' => 'boolean',
        ]);

        // Ensure only one default account
        $hasDefault = collect($validatedData['accounts'])->contains('is_default', true);

        $accountsData = [];
        foreach ($validatedData['accounts'] as $index => $account) {
            $isDefault = $account['is_default'] ?? false;

            // If this is the first account and no default is set, make it default
            if (!$hasDefault && $index === 0) {
                $isDefault = true;
            }

            $accountsData[$account['id']] = [
                'is_default' => $isDefault,
            ];
        }

        $user->assignedAccounts()->sync($accountsData);

        // If it's an AJAX request, return JSON response
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Cari hesaplar başarıyla güncellendi',
                'accounts' => $user->assignedAccounts()->get()
            ]);
        }

        return redirect()->back()
            ->with('message', 'Cari hesaplar başarıyla güncellendi');
    }

    /**
     * Get available customer accounts for assignment (AJAX)
     */
    public function getAvailableAccounts(Request $request)
    {
        $search = $request->get('search', '');

        $accounts = \App\Models\CurrentAccount::query()
            ->where('account_type', 'customer')
            ->where('is_active', true)
            ->when($search, function($q) use ($search) {
                $q->where(function($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                          ->orWhere('account_code', 'like', "%{$search}%");
                });
            })
            ->select('id', 'title', 'account_code')
            ->limit(50)
            ->get();

        return response()->json($accounts);
    }
}
