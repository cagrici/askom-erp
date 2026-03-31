<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseStaff;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseStaffController extends Controller
{
    /**
     * Display staff for a warehouse
     */
    public function index(Request $request, Warehouse $warehouse)
    {
        $query = $warehouse->staff()->with(['user', 'supervisor']);

        // Search filter
        if ($request->filled('search')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            })->orWhere('employee_id', 'like', '%' . $request->search . '%');
        }

        // Role filter
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Shift filter
        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }

        // Employment type filter
        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->employment_type);
        }

        // Availability filter
        if ($request->filled('availability')) {
            if ($request->availability === 'available') {
                $query->where('status', 'active')
                      ->where('is_available', true)
                      ->where('current_status', 'available');
            } elseif ($request->availability === 'busy') {
                $query->where('current_status', 'busy');
            }
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        if ($sortField === 'name') {
            $query->join('users', 'warehouse_staff.user_id', '=', 'users.id')
                  ->orderBy('users.name', $sortDirection)
                  ->select('warehouse_staff.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $staff = $query->paginate(20)->withQueryString();

        // Staff statistics
        $staffStats = $this->getStaffStatistics($warehouse);

        return Inertia::render('Warehouse/Staff/Index', [
            'warehouse' => $warehouse,
            'staff' => $staff,
            'filters' => $request->all(['search', 'role', 'status', 'shift', 'employment_type', 'availability', 'sort_field', 'sort_direction']),
            'staffStats' => $staffStats,
        ]);
    }

    /**
     * Show the form for creating new staff
     */
    public function create(Warehouse $warehouse)
    {
        // Get users who are not already staff in this warehouse
        $availableUsers = User::whereNotIn('id', function($query) use ($warehouse) {
            $query->select('user_id')
                  ->from('warehouse_staff')
                  ->where('warehouse_id', $warehouse->id);
        })->select('id', 'name', 'email')->orderBy('name')->get();

        // Get potential supervisors (managers, supervisors, team leaders)
        $supervisors = $warehouse->staff()
            ->whereIn('role', ['warehouse_manager', 'supervisor', 'team_leader'])
            ->where('status', 'active')
            ->with('user')
            ->get();

        return Inertia::render('Warehouse/Staff/Create', [
            'warehouse' => $warehouse,
            'availableUsers' => $availableUsers,
            'supervisors' => $supervisors,
        ]);
    }

    /**
     * Store newly created staff
     */
    public function store(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:warehouse_staff,user_id,NULL,id,warehouse_id,' . $warehouse->id,
            'employee_id' => 'nullable|string|max:50',
            'employment_type' => 'required|in:full_time,part_time,contractor,seasonal',
            'shift' => 'required|in:day,evening,night,rotating',
            'role' => 'required|in:warehouse_manager,supervisor,team_leader,receiver,picker,packer,shipper,forklift_operator,quality_control,maintenance,inventory_controller,returns_processor',
            'permissions' => 'nullable|array',
            'zone_access' => 'nullable|array',
            'operation_types' => 'nullable|array',
            'skills' => 'nullable|array',
            'certifications' => 'nullable|array',
            'equipment_authorizations' => 'nullable|array',
            'work_schedule' => 'nullable|array',
            'supervisor_id' => 'nullable|exists:users,id',
            'hire_date' => 'nullable|date|before_or_equal:today',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'medical_conditions' => 'nullable|string',
            'safety_notes' => 'nullable|string',
        ]);

        $validated['warehouse_id'] = $warehouse->id;
        $validated['status'] = 'active';
        $validated['is_available'] = true;
        $validated['current_status'] = 'available';
        $validated['created_by'] = auth()->id();

        $staff = WarehouseStaff::create($validated);

        return redirect()->route('warehouses.staff.show', [$warehouse, $staff])
            ->with('success', 'Depo personeli başarıyla eklendi.');
    }

    /**
     * Display the specified staff
     */
    public function show(Warehouse $warehouse, WarehouseStaff $staff)
    {
        $staff->load(['user', 'supervisor', 'creator']);

        // Get recent operations assigned to this staff member
        $recentOperations = $warehouse->operations()
            ->where('assigned_to', $staff->user_id)
            ->with(['items.product'])
            ->latest()
            ->limit(10)
            ->get();

        // Get performance metrics
        $performanceMetrics = [
            'operations_this_month' => $warehouse->operations()
                ->where('assigned_to', $staff->user_id)
                ->whereMonth('completed_at', now()->month)
                ->where('status', 'completed')
                ->count(),
            'average_completion_time' => $warehouse->operations()
                ->where('assigned_to', $staff->user_id)
                ->where('status', 'completed')
                ->whereNotNull('actual_duration')
                ->avg('actual_duration'),
            'accuracy_trend' => $this->getAccuracyTrend($warehouse, $staff->user_id),
            'productivity_trend' => $this->getProductivityTrend($warehouse, $staff->user_id),
        ];

        return Inertia::render('Warehouse/Staff/Show', [
            'warehouse' => $warehouse,
            'staff' => $staff,
            'recentOperations' => $recentOperations,
            'performanceMetrics' => $performanceMetrics,
        ]);
    }

    /**
     * Show the form for editing staff
     */
    public function edit(Warehouse $warehouse, WarehouseStaff $staff)
    {
        $staff->load(['user']);

        // Get potential supervisors (excluding the current staff member)
        $supervisors = $warehouse->staff()
            ->whereIn('role', ['warehouse_manager', 'supervisor', 'team_leader'])
            ->where('status', 'active')
            ->where('user_id', '!=', $staff->user_id)
            ->with('user')
            ->get();

        return Inertia::render('Warehouse/Staff/Edit', [
            'warehouse' => $warehouse,
            'staff' => $staff,
            'supervisors' => $supervisors,
        ]);
    }

    /**
     * Update the specified staff
     */
    public function update(Request $request, Warehouse $warehouse, WarehouseStaff $staff)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|string|max:50',
            'employment_type' => 'required|in:full_time,part_time,contractor,seasonal',
            'shift' => 'required|in:day,evening,night,rotating',
            'role' => 'required|in:warehouse_manager,supervisor,team_leader,receiver,picker,packer,shipper,forklift_operator,quality_control,maintenance,inventory_controller,returns_processor',
            'permissions' => 'nullable|array',
            'zone_access' => 'nullable|array',
            'operation_types' => 'nullable|array',
            'skills' => 'nullable|array',
            'certifications' => 'nullable|array',
            'equipment_authorizations' => 'nullable|array',
            'work_schedule' => 'nullable|array',
            'supervisor_id' => 'nullable|exists:users,id',
            'status' => 'required|in:active,inactive,suspended,terminated',
            'hire_date' => 'nullable|date|before_or_equal:today',
            'termination_date' => 'nullable|date|after:hire_date',
            'performance_rating' => 'nullable|numeric|min:1|max:5',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'medical_conditions' => 'nullable|string',
            'safety_notes' => 'nullable|string',
            'next_review_date' => 'nullable|date|after:today',
        ]);

        $validated['updated_by'] = auth()->id();

        $staff->update($validated);

        return redirect()->route('warehouses.staff.show', [$warehouse, $staff])
            ->with('success', 'Personel bilgileri başarıyla güncellendi.');
    }

    /**
     * Remove the specified staff
     */
    public function destroy(Warehouse $warehouse, WarehouseStaff $staff)
    {
        // Check if staff has active operations
        $activeOperations = $warehouse->operations()
            ->where('assigned_to', $staff->user_id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();

        if ($activeOperations > 0) {
            return back()->with('error', 'Aktif operasyonları olan personel silinemez.');
        }

        $staff->delete();

        return redirect()->route('warehouses.staff.index', $warehouse)
            ->with('success', 'Personel başarıyla silindi.');
    }

    /**
     * Update staff availability status
     */
    public function updateStatus(Request $request, Warehouse $warehouse, WarehouseStaff $staff)
    {
        $validated = $request->validate([
            'current_status' => 'required|in:available,busy,break,offline',
            'reason' => 'nullable|string|max:255',
        ]);

        $staff->updateStatus($validated['current_status'], $validated['reason']);

        return back()->with('success', 'Personel durumu güncellendi.');
    }

    /**
     * Record training completion
     */
    public function recordTraining(Request $request, Warehouse $warehouse, WarehouseStaff $staff)
    {
        $validated = $request->validate([
            'training_name' => 'required|string|max:255',
            'completion_date' => 'required|date|before_or_equal:today',
            'trainer' => 'nullable|string|max:255',
            'certificate_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date|after:completion_date',
            'notes' => 'nullable|string',
        ]);

        $trainingCompleted = $staff->training_completed ?? [];
        $trainingCompleted[] = [
            'name' => $validated['training_name'],
            'completion_date' => $validated['completion_date'],
            'trainer' => $validated['trainer'],
            'certificate_number' => $validated['certificate_number'],
            'expiry_date' => $validated['expiry_date'],
            'notes' => $validated['notes'],
            'recorded_by' => auth()->id(),
            'recorded_at' => now()->toISOString(),
        ];

        $staff->update([
            'training_completed' => $trainingCompleted,
            'last_training_date' => $validated['completion_date'],
        ]);

        return back()->with('success', 'Eğitim kaydı başarıyla eklendi.');
    }

    /**
     * Add certification
     */
    public function addCertification(Request $request, Warehouse $warehouse, WarehouseStaff $staff)
    {
        $validated = $request->validate([
            'certification_name' => 'required|string|max:255',
            'issue_date' => 'required|date|before_or_equal:today',
            'expiry_date' => 'nullable|date|after:issue_date',
            'issuing_authority' => 'required|string|max:255',
            'certificate_number' => 'nullable|string|max:100',
        ]);

        $certifications = $staff->certifications ?? [];
        $certifications[$validated['certification_name']] = [
            'issue_date' => $validated['issue_date'],
            'expiry_date' => $validated['expiry_date'],
            'issuing_authority' => $validated['issuing_authority'],
            'certificate_number' => $validated['certificate_number'],
            'added_by' => auth()->id(),
            'added_at' => now()->toISOString(),
        ];

        $staff->update(['certifications' => $certifications]);

        return back()->with('success', 'Sertifika başarıyla eklendi.');
    }

    /**
     * Get staff statistics
     */
    private function getStaffStatistics(Warehouse $warehouse)
    {
        $staff = $warehouse->staff();

        return [
            'total_staff' => $staff->count(),
            'active_staff' => $staff->where('status', 'active')->count(),
            'available_staff' => $staff->where('status', 'active')
                                      ->where('is_available', true)
                                      ->where('current_status', 'available')
                                      ->count(),
            'busy_staff' => $staff->where('current_status', 'busy')->count(),
            'on_break_staff' => $staff->where('current_status', 'break')->count(),
            'offline_staff' => $staff->where('current_status', 'offline')->count(),
            'by_role' => $staff->where('status', 'active')
                              ->selectRaw('role, count(*) as count')
                              ->groupBy('role')
                              ->pluck('count', 'role'),
            'by_shift' => $staff->where('status', 'active')
                               ->selectRaw('shift, count(*) as count')
                               ->groupBy('shift')
                               ->pluck('count', 'shift'),
        ];
    }

    /**
     * Get accuracy trend for staff member
     */
    private function getAccuracyTrend(Warehouse $warehouse, $userId)
    {
        return $warehouse->operations()
            ->where('assigned_to', $userId)
            ->where('status', 'completed')
            ->whereNotNull('accuracy_rate')
            ->whereDate('completed_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(completed_at) as date, AVG(accuracy_rate) as avg_accuracy')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Get productivity trend for staff member
     */
    private function getProductivityTrend(Warehouse $warehouse, $userId)
    {
        return $warehouse->operations()
            ->where('assigned_to', $userId)
            ->where('status', 'completed')
            ->whereDate('completed_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(completed_at) as date, COUNT(*) as operations_count, AVG(actual_duration) as avg_duration')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    /**
     * Bulk update staff status
     */
    public function bulkUpdateStatus(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'staff_ids' => 'required|array',
            'staff_ids.*' => 'exists:warehouse_staff,id',
            'status' => 'required|in:active,inactive,suspended',
            'reason' => 'nullable|string|max:255',
        ]);

        $updatedCount = $warehouse->staff()
            ->whereIn('id', $validated['staff_ids'])
            ->update([
                'status' => $validated['status'],
                'updated_by' => auth()->id(),
            ]);

        return back()->with('success', "{$updatedCount} personelin durumu güncellendi.");
    }
}
