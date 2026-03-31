<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationPosition;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationPositionController extends Controller
{
    public function index(Request $request)
    {
        $query = OrganizationPosition::query()
            ->with(['department'])
            ->withCount(['employees', 'users'])
            ->orderBy('title');

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                    ->orWhere('code', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('is_management') && $request->is_management !== '') {
            $query->where('is_management', $request->is_management);
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $positions = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Positions/Index', [
            'positions' => $positions,
            'departments' => Department::orderBy('name')->get(),
            'filters' => $request->only(['search', 'department_id', 'is_management', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:organization_positions,code',
            'description' => 'nullable|string|max:1000',
            'department_id' => 'nullable|exists:departments,id',
            'level' => 'nullable|integer|min:1|max:10',
            'is_management' => 'boolean',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0|gte:min_salary',
            'currency' => 'nullable|string|max:10',
            'status' => 'boolean',
        ]);

        $position = OrganizationPosition::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Position created successfully',
            'position' => $position->load(['department'])->loadCount(['employees', 'users'])
        ]);
    }

    public function update(Request $request, OrganizationPosition $position)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:organization_positions,code,' . $position->id,
            'description' => 'nullable|string|max:1000',
            'department_id' => 'nullable|exists:departments,id',
            'level' => 'nullable|integer|min:1|max:10',
            'is_management' => 'boolean',
            'min_salary' => 'nullable|numeric|min:0',
            'max_salary' => 'nullable|numeric|min:0|gte:min_salary',
            'currency' => 'nullable|string|max:10',
            'status' => 'boolean',
        ]);

        $position->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Position updated successfully',
            'position' => $position->fresh(['department'])->loadCount(['employees', 'users'])
        ]);
    }

    public function destroy(OrganizationPosition $position)
    {
        // Check if position has employees or users assigned
        if ($position->employees()->count() > 0 || $position->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bu pozisyona atanmış çalışanlar veya kullanıcılar bulunmaktadır. Önce onları başka pozisyonlara atayınız.'
            ], 422);
        }

        $position->delete();

        return response()->json([
            'success' => true,
            'message' => 'Position deleted successfully'
        ]);
    }

    /**
     * Get positions for a specific department (API)
     */
    public function getByDepartment(Request $request, $departmentId)
    {
        $positions = OrganizationPosition::where('department_id', $departmentId)
            ->active()
            ->orderBy('title')
            ->get(['id', 'title', 'code', 'level', 'is_management']);

        return response()->json([
            'success' => true,
            'data' => $positions
        ]);
    }

    /**
     * Get all active positions (API)
     */
    public function getActive()
    {
        $positions = OrganizationPosition::active()
            ->with('department:id,name')
            ->orderBy('title')
            ->get(['id', 'title', 'code', 'department_id', 'level', 'is_management']);

        return response()->json([
            'success' => true,
            'data' => $positions
        ]);
    }

    /**
     * Get employees assigned to a position
     */
    public function getEmployees(OrganizationPosition $position)
    {
        $employees = $position->employees()
            ->with(['user:id,name,email', 'department:id,name'])
            ->get(['id', 'user_id', 'department_id', 'hire_date', 'salary', 'status']);

        return response()->json([
            'success' => true,
            'data' => $employees,
            'position' => $position->load('department')
        ]);
    }

    /**
     * Get users assigned to a position
     */
    public function getUsers(OrganizationPosition $position)
    {
        $users = $position->users()
            ->with(['department:id,name'])
            ->get(['id', 'name', 'email', 'department_id', 'status']);

        return response()->json([
            'success' => true,
            'data' => $users,
            'position' => $position->load('department')
        ]);
    }

    /**
     * Get available employees for assignment
     */
    public function getAvailableEmployees(Request $request, OrganizationPosition $position)
    {
        $query = Employee::query()
            ->with(['user:id,name,email', 'department:id,name'])
            ->where('status', true);

        // Exclude employees already assigned to this position
        $assignedEmployeeIds = $position->employees()->pluck('id');
        if ($assignedEmployeeIds->isNotEmpty()) {
            $query->whereNotIn('id', $assignedEmployeeIds);
        }

        // Optional search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Optional department filter
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        $employees = $query->limit(50)->get(['id', 'user_id', 'department_id', 'hire_date', 'status']);

        return response()->json([
            'success' => true,
            'data' => $employees
        ]);
    }

    /**
     * Get available users for assignment
     */
    public function getAvailableUsers(Request $request, OrganizationPosition $position)
    {
        $query = User::query()
            ->with(['department:id,name'])
            ->where('status', true);

        // Exclude users already assigned to this position
        $assignedUserIds = $position->users()->pluck('user_id');
        if ($assignedUserIds->isNotEmpty()) {
            $query->whereNotIn('id', $assignedUserIds);
        }

        // Optional search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Optional department filter
        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        $users = $query->limit(50)->get(['id', 'name', 'email', 'department_id', 'status']);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Assign employees to position
     */
    public function assignEmployees(Request $request, OrganizationPosition $position)
    {
        $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id'
        ]);

        $employeeIds = $request->employee_ids;
        
        // Update position_id for selected employees
        Employee::whereIn('id', $employeeIds)->update(['position_id' => $position->id]);

        return response()->json([
            'success' => true,
            'message' => count($employeeIds) . ' çalışan pozisyona atandı',
            'assigned_count' => count($employeeIds)
        ]);
    }

    /**
     * Assign users to position
     */
    public function assignUsers(Request $request, OrganizationPosition $position)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $userIds = $request->user_ids;
        
        // Sync users to position (many-to-many relationship)
        $position->users()->syncWithoutDetaching($userIds);

        return response()->json([
            'success' => true,
            'message' => count($userIds) . ' kullanıcı pozisyona atandı',
            'assigned_count' => count($userIds)
        ]);
    }

    /**
     * Remove employee from position
     */
    public function removeEmployee(Request $request, OrganizationPosition $position, Employee $employee)
    {
        if ($employee->position_id !== $position->id) {
            return response()->json([
                'success' => false,
                'message' => 'Bu çalışan bu pozisyona atanmamış'
            ], 422);
        }

        $employee->update(['position_id' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Çalışan pozisyondan çıkarıldı'
        ]);
    }

    /**
     * Remove user from position
     */
    public function removeUser(Request $request, OrganizationPosition $position, User $user)
    {
        $position->users()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı pozisyondan çıkarıldı'
        ]);
    }
}