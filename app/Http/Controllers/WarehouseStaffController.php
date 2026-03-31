<?php

namespace App\Http\Controllers;

use App\Models\WarehouseStaff;
use App\Models\Warehouse;
use App\Models\WarehouseOperation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class WarehouseStaffController extends Controller
{
    public function index(): Response
    {
        $staff = WarehouseStaff::with(['warehouse', 'employee'])
            ->get()
            ->map(function ($person) {
                $person->full_name = $person->employee->first_name . ' ' . $person->employee->last_name;
                $person->completed_operations_this_month = $this->getCompletedOperationsThisMonth($person);
                $person->efficiency_rating = $this->calculateEfficiencyRating($person);
                return $person;
            });

        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Staff/Index', [
            'staff' => $staff,
            'warehouses' => $warehouses
        ]);
    }

    public function create(): Response
    {
        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);
        
        // Get all active employees, allowing them to be assigned to multiple warehouses if needed
        $employees = \App\Models\Employee::where('status', 'active')
            ->get(['id', 'first_name', 'last_name', 'employee_id', 'user_id', 'email', 'phone', 'department']);

        return Inertia::render('Warehouses/Staff/Create', [
            'warehouses' => $warehouses,
            'employees' => $employees
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'employee_id' => 'required|exists:employees,id|unique:warehouse_staff,employee_id,NULL,id,warehouse_id,' . $request->warehouse_id,
            'role' => 'required|in:warehouse_manager,supervisor,team_leader,receiver,picker,packer,forklift_operator,shipper,quality_control,maintenance,inventory_controller,returns_processor',
            'employment_type' => 'required|in:full_time,part_time,contractor,seasonal',
            'shift' => 'required|in:day,evening,night,rotating',
            'hire_date' => 'required|date',
            'status' => 'required|in:active,inactive,suspended,terminated',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
        ]);

        // Get user_id from selected employee
        $employee = \App\Models\Employee::find($request->employee_id);
        
        $data = $request->all();
        $data['user_id'] = $employee->user_id;
        
        WarehouseStaff::create($data);

        return redirect()->route('warehouses.staff.index')
            ->with('success', 'Depo personeli başarıyla oluşturuldu.');
    }

    public function show(WarehouseStaff $warehouseStaff): Response
    {
        $warehouseStaff->load(['warehouse', 'employee']);

        // Get recent operations - using user_id since operations are assigned to users, not warehouse staff directly
        $recentOperations = WarehouseOperation::where('assigned_to', $warehouseStaff->user_id)
            ->with(['warehouse'])
            ->latest()
            ->limit(10)
            ->get();

        // Get performance stats
        $performanceStats = [
            'total_operations' => WarehouseOperation::where('assigned_to', $warehouseStaff->user_id)->count(),
            'completed_operations' => WarehouseOperation::where('assigned_to', $warehouseStaff->user_id)
                ->where('status', 'completed')->count(),
            'operations_this_month' => WarehouseOperation::where('assigned_to', $warehouseStaff->user_id)
                ->whereMonth('created_at', now()->month)->count(),
            'average_completion_time' => $this->getAverageCompletionTime($warehouseStaff),
            'efficiency_rating' => $this->calculateEfficiencyRating($warehouseStaff),
        ];

        return Inertia::render('Warehouses/Staff/Show', [
            'staff' => $warehouseStaff,
            'recentOperations' => $recentOperations,
            'performanceStats' => $performanceStats
        ]);
    }

    public function edit(WarehouseStaff $warehouseStaff): Response
    {
        $warehouseStaff->load(['warehouse', 'employee']);
        $warehouses = Warehouse::where('status', 'active')->get(['id', 'name', 'code']);

        return Inertia::render('Warehouses/Staff/Edit', [
            'staff' => $warehouseStaff,
            'warehouses' => $warehouses
        ]);
    }

    public function update(Request $request, WarehouseStaff $warehouseStaff)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'role' => 'required|in:warehouse_manager,supervisor,team_leader,receiver,picker,packer,forklift_operator,shipper,quality_control,maintenance,inventory_controller,returns_processor',
            'employment_type' => 'required|in:full_time,part_time,contractor,seasonal',
            'shift' => 'required|in:day,evening,night,rotating',
            'hire_date' => 'required|date',
            'status' => 'required|in:active,inactive,suspended,terminated',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
        ]);

        $warehouseStaff->update($request->all());

        return redirect()->route('warehouses.staff.index')
            ->with('success', 'Depo personeli başarıyla güncellendi.');
    }

    public function destroy(WarehouseStaff $warehouseStaff)
    {
        $warehouseStaff->delete();

        return redirect()->route('warehouses.staff.index')
            ->with('success', 'Depo personeli başarıyla silindi.');
    }

    private function getCompletedOperationsThisMonth(WarehouseStaff $staff): int
    {
        return WarehouseOperation::where('assigned_to', $staff->user_id)
            ->where('status', 'completed')
            ->whereMonth('completed_at', now()->month)
            ->count();
    }

    private function calculateEfficiencyRating(WarehouseStaff $staff): float
    {
        $totalOperations = WarehouseOperation::where('assigned_to', $staff->user_id)->count();

        if ($totalOperations === 0) {
            return 0;
        }

        $completedOperations = WarehouseOperation::where('assigned_to', $staff->user_id)
            ->where('status', 'completed')
            ->count();

        $onTimeOperations = WarehouseOperation::where('assigned_to', $staff->user_id)
            ->where('status', 'completed')
            ->whereRaw('completed_at <= due_date')
            ->count();

        $completionRate = ($completedOperations / $totalOperations) * 100;
        $onTimeRate = $completedOperations > 0 ? ($onTimeOperations / $completedOperations) * 100 : 0;

        // Weighted average: 70% completion rate + 30% on-time rate
        return round(($completionRate * 0.7) + ($onTimeRate * 0.3), 1);
    }

    private function getAverageCompletionTime(WarehouseStaff $staff): float
    {
        $completedOperations = WarehouseOperation::where('assigned_to', $staff->user_id)
            ->where('status', 'completed')
            ->whereNotNull('started_at')
            ->whereNotNull('completed_at')
            ->get();

        if ($completedOperations->isEmpty()) {
            return 0;
        }

        $totalMinutes = $completedOperations->sum(function ($operation) {
            return Carbon::parse($operation->started_at)->diffInMinutes($operation->completed_at);
        });

        return round($totalMinutes / $completedOperations->count(), 1);
    }
}
