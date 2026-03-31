<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Department;
use App\Models\OrganizationPosition;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationChartController extends Controller
{
    /**
     * Admin organization chart management
     */
    public function index()
    {
        // Get all users with their departments, positions, and manager relationships
        $users = User::with(['department', 'positions', 'manager', 'subordinates'])
            ->where('status', true)
            ->orderBy('department_id')
            ->orderBy('position')
            ->get();

        // Get departments
        $departments = Department::all();

        // Get organization positions
        $positions = OrganizationPosition::with('department')->get();

        // Build organizational hierarchy
        $organizationData = $this->buildOrganizationHierarchy($users);

        return Inertia::render('Admin/OrganizationChart/Index', [
            'organizationData' => $organizationData,
            'users' => $users,
            'departments' => $departments,
            'positions' => $positions,
            'isAdmin' => true,
        ]);
    }

    /**
     * Public organization chart view
     */
    public function publicIndex()
    {
        // Get all users with their departments, positions, and manager relationships
        $users = User::with(['department', 'positions', 'manager', 'subordinates'])
            ->where('status', true)
            ->orderBy('department_id')
            ->orderBy('position')
            ->get();

        // Build organizational hierarchy
        $organizationData = $this->buildOrganizationHierarchy($users);

        return Inertia::render('OrganizationChart/Index', [
            'organizationData' => $organizationData,
            'isAdmin' => false,
        ]);
    }

    private function buildOrganizationHierarchy($users)
    {
        $hierarchy = [];

        // Build hierarchy based on manager_id relationships
        foreach ($users as $user) {
            $hierarchy[] = [
                'id' => $user->id,
                'name' => $user->name,
                'title' => $user->position ?? 'Çalışan',
                'img' => $this->getAvatarUrl($user),
                'department' => $user->department ? $user->department->name : '',
                'email' => $user->email,
                'phone' => $user->phone,
                'parentId' => $user->manager_id, // Use the actual manager_id from database
            ];
        }

        // If no manager relationships exist, fall back to position-based hierarchy
        $hasManagerRelationships = $users->whereNotNull('manager_id')->count() > 0;

        if (!$hasManagerRelationships) {
            $hierarchy = [];

            // CEO/President level (no manager)
            $ceo = $users->where('position', 'like', '%CEO%')->first()
                ?? $users->where('position', 'like', '%Genel Müdür%')->first()
                ?? $users->where('position', 'like', '%President%')->first();

            if ($ceo) {
                $hierarchy[] = [
                    'id' => $ceo->id,
                    'name' => $ceo->name,
                    'title' => $ceo->position ?? 'CEO',
                    'img' => $this->getAvatarUrl($ceo),
                    'department' => $ceo->department ? $ceo->department->name : '',
                    'email' => $ceo->email,
                    'phone' => $ceo->phone,
                    'parentId' => null,
                ];
            }

            // Department Managers
            $managers = $users->filter(function ($user) use ($ceo) {
                return $user->id !== ($ceo->id ?? null) && $user->position && (
                    str_contains(strtolower($user->position), 'müdür') ||
                    str_contains(strtolower($user->position), 'manager') ||
                    str_contains(strtolower($user->position), 'director') ||
                    str_contains(strtolower($user->position), 'head')
                );
            });

            foreach ($managers as $manager) {
                $hierarchy[] = [
                    'id' => $manager->id,
                    'name' => $manager->name,
                    'title' => $manager->position,
                    'img' => $this->getAvatarUrl($manager),
                    'department' => $manager->department ? $manager->department->name : '',
                    'email' => $manager->email,
                    'phone' => $manager->phone,
                    'parentId' => $ceo->id ?? null,
                ];
            }

            // Regular employees
            $employees = $users->filter(function ($user) use ($ceo, $managers) {
                return !in_array($user->id, array_merge(
                    [$ceo->id ?? null],
                    $managers->pluck('id')->toArray()
                ));
            });

            foreach ($employees as $employee) {
                // Find their manager based on department
                $managerId = null;
                if ($employee->department_id) {
                    $departmentManager = $managers->where('department_id', $employee->department_id)->first();
                    $managerId = $departmentManager ? $departmentManager->id : ($ceo->id ?? null);
                } else {
                    $managerId = $ceo->id ?? null;
                }

                $hierarchy[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'title' => $employee->position ?? 'Çalışan',
                    'img' => $this->getAvatarUrl($employee),
                    'department' => $employee->department ? $employee->department->name : '',
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'parentId' => $managerId,
                ];
            }
        }

        return $hierarchy;
    }

    /**
     * Update organizational hierarchy (drag and drop)
     */
    public function updateHierarchy(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'new_department_id' => 'nullable|exists:departments,id',
            'new_manager_id' => 'nullable|exists:users,id',
            'new_position' => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($request->user_id);

        // Update department if provided
        if ($request->has('new_department_id')) {
            $user->department_id = $request->new_department_id;
        }

        // Update manager (parent) if provided
        if ($request->has('new_manager_id')) {
            $user->manager_id = $request->new_manager_id;
        }

        // Update position if provided
        if ($request->has('new_position')) {
            $user->position = $request->new_position;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Organization hierarchy updated successfully',
        ]);
    }

    /**
     * Assign position to user
     */
    public function assignPosition(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'position_id' => 'required|exists:organization_positions,id',
            'is_primary' => 'boolean',
            'start_date' => 'nullable|date',
        ]);

        $user = User::findOrFail($request->user_id);

        // Remove existing primary position if this is becoming primary
        if ($request->get('is_primary', true)) {
            $user->positions()->updateExistingPivot(
                $user->positions()->pluck('organization_positions.id'),
                ['is_primary' => false]
            );
        }

        // Attach or update position
        $user->positions()->syncWithoutDetaching([
            $request->position_id => [
                'is_primary' => $request->get('is_primary', true),
                'start_date' => $request->start_date ?? now(),
                'is_acting' => false,
            ]
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Position assigned successfully',
        ]);
    }

    /**
     * Remove position from user
     */
    public function removePosition(User $user, Request $request)
    {
        $request->validate([
            'position_id' => 'required|exists:organization_positions,id',
        ]);

        $user->positions()->detach($request->position_id);

        return response()->json([
            'success' => true,
            'message' => 'Position removed successfully',
        ]);
    }

    /**
     * Save entire organization hierarchy (bulk update)
     */
    public function saveHierarchy(Request $request)
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.user_id' => 'required|exists:users,id',
            'updates.*.new_manager_id' => 'nullable|exists:users,id',
        ]);

        try {
            // Process each update
            foreach ($request->updates as $update) {
                $user = User::findOrFail($update['user_id']);

                // Update manager_id
                $user->manager_id = $update['new_manager_id'];
                $user->save();

                \Log::info("Updated user {$user->id} manager_id to: " . ($update['new_manager_id'] ?? 'null'));
            }

            return response()->json([
                'success' => true,
                'message' => 'Organization hierarchy saved successfully',
                'updated_count' => count($request->updates)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error saving hierarchy: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error saving organization hierarchy: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the proper avatar URL for a user
     */
    private function getAvatarUrl($user)
    {
        if ($user->avatar) {
            // If avatar path exists, prepend /storage/ if not already present
            return strpos($user->avatar, 'storage/') === 0 ? '/' . $user->avatar : '/storage/' . $user->avatar;
        }

        return '/images/users/user-dummy-img.jpg';
    }
}
