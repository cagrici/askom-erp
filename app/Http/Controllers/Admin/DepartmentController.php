<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Company;
use App\Models\Location;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query()
            ->with(['company', 'parent', 'location', 'manager.user'])
            ->withCount(['employees', 'users', 'positions', 'children'])
            ->orderBy('name');

        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('code', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->has('company_id') && $request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->has('location_id') && $request->location_id) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->has('parent_id') && $request->parent_id) {
            $query->where('parent_id', $request->parent_id);
        }

        if ($request->has('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->is_active);
        }

        $departments = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Departments/Index', [
            'departments' => $departments,
            'companies' => Company::active()->orderBy('name')->get(),
            'locations' => Location::active()->with('company')->orderBy('name')->get(),
            'parentDepartments' => Department::active()->whereNull('parent_id')->orderBy('name')->get(),
            'employees' => Employee::with('user')->orderBy('user_id')->get(),
            'filters' => $request->only(['search', 'company_id', 'location_id', 'parent_id', 'is_active']),
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:departments,code',
            'description' => 'nullable|string|max:1000',
            'company_id' => 'nullable|exists:companies,id',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
            'location_id' => 'nullable|exists:locations,id',
            'budget' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Prevent circular reference (department can't be its own parent)
        if (isset($validatedData['parent_id'])) {
            $parent = Department::find($validatedData['parent_id']);
            if ($parent && $parent->parent_id) {
                // Could add more complex circular reference checking here
            }
        }

        $department = Department::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully',
            'department' => $department->load(['company', 'parent', 'location', 'manager.user'])
                ->loadCount(['employees', 'users', 'positions', 'children'])
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:departments,code,' . $department->id,
            'description' => 'nullable|string|max:1000',
            'company_id' => 'nullable|exists:companies,id',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
            'location_id' => 'nullable|exists:locations,id',
            'budget' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        // Prevent circular reference (department can't be its own parent or ancestor)
        if (isset($validatedData['parent_id']) && $validatedData['parent_id'] != $department->id) {
            $parent = Department::find($validatedData['parent_id']);
            if ($parent) {
                // Check if the new parent is a descendant of current department
                $ancestors = collect([$parent]);
                while ($ancestors->last() && $ancestors->last()->parent_id) {
                    $nextParent = Department::find($ancestors->last()->parent_id);
                    if ($nextParent->id == $department->id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Döngüsel referans oluşacak! Bu departman seçilen departmanın alt departmanıdır.'
                        ], 422);
                    }
                    $ancestors->push($nextParent);

                    // Prevent infinite loop
                    if ($ancestors->count() > 10) break;
                }
            }
        } elseif (isset($validatedData['parent_id']) && $validatedData['parent_id'] == $department->id) {
            return response()->json([
                'success' => false,
                'message' => 'Departman kendisinin üst departmanı olamaz!'
            ], 422);
        }

        $department->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'department' => $department->fresh(['company', 'parent', 'location', 'manager.user'])
                ->loadCount(['employees', 'users', 'positions', 'children'])
        ]);
    }

    public function destroy(Department $department)
    {
        // Check if department has children
        if ($department->children()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bu departmanın alt departmanları bulunmaktadır. Önce alt departmanları silin veya başka departmanlara taşıyın.'
            ], 422);
        }

        // Check if department has employees
        if ($department->employees()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bu departmanda çalışanlar bulunmaktadır. Önce çalışanları başka departmanlara taşıyın.'
            ], 422);
        }

        // Check if department has users
        if ($department->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bu departmanda kullanıcılar bulunmaktadır. Önce kullanıcıları başka departmanlara taşıyın.'
            ], 422);
        }

        // Check if department has positions
        if ($department->positions()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bu departmanda pozisyonlar bulunmaktadır. Önce pozisyonları başka departmanlara taşıyın.'
            ], 422);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully'
        ]);
    }

    /**
     * Get departments by company (API)
     */
    public function getByCompany(Request $request, $companyId)
    {
        $departments = Department::where('company_id', $companyId)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'parent_id']);

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * Get departments by location (API)
     */
    public function getByLocation(Request $request, $locationId)
    {
        $departments = Department::where('location_id', $locationId)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'parent_id']);

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * Get all active departments (API)
     */
    public function getActive()
    {
        $departments = Department::active()
            ->with(['company:id,name', 'parent:id,name'])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'company_id', 'parent_id']);

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * Get department hierarchy (API)
     */
    public function getHierarchy()
    {
        $departments = Department::active()
            ->with(['children' => function($query) {
                $query->active()->with(['children' => function($subQuery) {
                    $subQuery->active();
                }]);
            }])
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'company_id']);

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }
}
