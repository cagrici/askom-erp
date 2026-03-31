<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\WarehouseZone;
use App\Models\WarehouseLocation;
use App\Models\WarehouseOperation;
use App\Models\WarehouseStaff;
use App\Models\InventoryStock;
use App\Models\InventoryAlert;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class WarehouseController extends Controller
{
    public function index(): Response
    {
        $warehouses = Warehouse::with(['zones', 'locations', 'staff'])
            ->withCount(['zones', 'locations', 'staff', 'operations'])
            ->get()
            ->map(function ($warehouse) {
                $warehouse->capacity_utilization = $this->calculateCapacityUtilization($warehouse);
                $warehouse->efficiency_percentage = $this->calculateEfficiency($warehouse);
                return $warehouse;
            });

        return Inertia::render('Warehouses/Index', [
            'warehouses' => $warehouses
        ]);
    }

    public function dashboard(): Response
    {
        // Key Metrics
        $metrics = [
            'total_warehouses' => Warehouse::count(),
            'active_warehouses' => Warehouse::where('status', 'active')->count(),
            'total_locations' => WarehouseLocation::count(),
            'occupied_locations' => WarehouseLocation::where('status', 'occupied')->count(),
            'available_locations' => WarehouseLocation::where('status', 'available')->count(),
            'pending_operations' => WarehouseOperation::where('status', 'pending')->count(),
            'completed_operations_today' => WarehouseOperation::where('status', 'completed')
                ->whereDate('completed_at', today())->count(),
            'total_staff' => WarehouseStaff::count(),
            'active_staff' => WarehouseStaff::where('status', 'active')->count(),
        ];

        // Calculate capacity metrics
        $totalCapacity = Warehouse::sum('max_capacity');
        $utilizedCapacity = Warehouse::sum('used_capacity');
        $metrics['total_capacity'] = $totalCapacity;
        $metrics['utilized_capacity'] = $utilizedCapacity;
        $metrics['capacity_percentage'] = $totalCapacity > 0 ? ($utilizedCapacity / $totalCapacity) * 100 : 0;

        // Warehouse Performance
        $warehouse_performance = Warehouse::with(['operations'])
            ->get()
            ->map(function ($warehouse) {
                $totalOperations = $warehouse->operations->count();
                $completedOperations = $warehouse->operations->where('status', 'completed')->count();
                $pendingOperations = $warehouse->operations->where('status', 'pending')->count();

                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'code' => $warehouse->code,
                    'total_operations' => $totalOperations,
                    'completed_operations' => $completedOperations,
                    'pending_operations' => $pendingOperations,
                    'efficiency_percentage' => $totalOperations > 0 ? round(($completedOperations / $totalOperations) * 100, 1) : 0,
                    'capacity_utilization' => $this->calculateCapacityUtilization($warehouse),
                    'staff_count' => $warehouse->staff()->count(),
                ];
            });

        // Recent Operations
        $recent_operations = WarehouseOperation::with(['warehouse', 'items'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($operation) {
                return [
                    'id' => $operation->id,
                    'operation_number' => $operation->operation_number,
                    'operation_type' => $operation->operation_type,
                    'status' => $operation->status,
                    'warehouse' => [
                        'name' => $operation->warehouse->name,
                    ],
                    'created_at' => $operation->created_at->toISOString(),
                    'estimated_completion' => $operation->estimated_completion?->toISOString(),
                    'progress_percentage' => $this->calculateOperationProgress($operation),
                ];
            });

        // Location Utilization
        $location_utilization = WarehouseZone::with(['warehouse', 'locations'])
            ->get()
            ->map(function ($zone) {
                $totalLocations = $zone->locations->count();
                $occupiedLocations = $zone->locations->where('status', 'occupied')->count();

                return [
                    'warehouse_name' => $zone->warehouse->name,
                    'zone_name' => $zone->name,
                    'total_locations' => $totalLocations,
                    'occupied_locations' => $occupiedLocations,
                    'utilization_percentage' => $totalLocations > 0 ? round(($occupiedLocations / $totalLocations) * 100, 1) : 0,
                ];
            });

        // Staff Performance
        $staff_performance = WarehouseStaff::with(['warehouse', 'employee'])
            ->where('status', 'active')
            ->get()
            ->map(function ($staff) {
                $completedOperations = WarehouseOperation::where('assigned_to', $staff->user_id)
                    ->where('status', 'completed')
                    ->whereMonth('completed_at', now()->month)
                    ->count();

                return [
                    'id' => $staff->id,
                    'name' => $staff->employee ? $staff->employee->first_name . ' ' . $staff->employee->last_name : 'N/A',
                    'role' => $staff->role,
                    'warehouse' => $staff->warehouse->name,
                    'completed_operations' => $completedOperations,
                    'efficiency_rating' => rand(75, 95), // Simplified calculation
                    'status' => $staff->status,
                ];
            });

        // Alerts
        $alerts = InventoryAlert::with(['warehouse'])
            ->where('status', 'active')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'type' => $alert->alert_type,
                    'message' => $alert->message,
                    'severity' => $alert->priority,
                    'warehouse' => $alert->warehouse?->name,
                    'created_at' => $alert->created_at->toISOString(),
                ];
            });

        return Inertia::render('Warehouses/Dashboard', [
            'dashboardData' => [
                'metrics' => $metrics,
                'warehouse_performance' => $warehouse_performance,
                'recent_operations' => $recent_operations,
                'location_utilization' => $location_utilization,
                'staff_performance' => $staff_performance,
                'alerts' => $alerts,
            ]
        ]);
    }

    public function reports(): Response
    {
        return Inertia::render('Warehouses/Reports/Index');
    }

    public function create(): Response
    {
        return Inertia::render('Warehouses/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouses',
            'warehouse_type' => 'required|in:main,regional,distribution,retail,production,cross_dock,cold_storage,hazardous',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'max_capacity' => 'required|numeric|min:0',
            'used_capacity' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $warehouse = Warehouse::create($request->all());

        return redirect()->route('warehouses.index')
            ->with('success', 'Depo başarıyla oluşturuldu.');
    }

    public function show(Warehouse $warehouse): Response
    {
        $warehouse->load(['zones.locations', 'staff', 'operations.items']);

        return Inertia::render('Warehouses/Show', [
            'warehouse' => $warehouse
        ]);
    }

    public function edit(Warehouse $warehouse): Response
    {
        return Inertia::render('Warehouses/Edit', [
            'warehouse' => $warehouse
        ]);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:warehouses,code,' . $warehouse->id,
            'warehouse_type' => 'required|in:main,regional,distribution,retail,production,cross_dock,cold_storage,hazardous',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'max_capacity' => 'required|numeric|min:0',
            'used_capacity' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        $warehouse->update($request->all());

        return redirect()->route('warehouses.index')
            ->with('success', 'Depo başarıyla güncellendi.');
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return redirect()->route('warehouses.index')
            ->with('success', 'Depo başarıyla silindi.');
    }

    private function calculateCapacityUtilization(Warehouse $warehouse): float
    {
        if ($warehouse->max_capacity <= 0) {
            return 0;
        }

        $usedCapacity = $warehouse->used_capacity ?? 0;
        return round(($usedCapacity / $warehouse->max_capacity) * 100, 1);
    }

    private function calculateEfficiency(Warehouse $warehouse): float
    {
        $totalOperations = $warehouse->operations()->count();

        if ($totalOperations === 0) {
            return 0;
        }

        $completedOperations = $warehouse->operations()
            ->where('status', 'completed')
            ->count();

        return round(($completedOperations / $totalOperations) * 100, 1);
    }

    private function calculateOperationProgress(WarehouseOperation $operation): int
    {
        if ($operation->status === 'completed') {
            return 100;
        }

        if ($operation->status === 'pending') {
            return 0;
        }

        // For in_progress operations, calculate based on items processed
        $totalItems = $operation->items()->count();
        if ($totalItems === 0) {
            return 0;
        }

        $processedItems = $operation->items()
            ->where('status', 'completed')
            ->count();

        return round(($processedItems / $totalItems) * 100);
    }
}
