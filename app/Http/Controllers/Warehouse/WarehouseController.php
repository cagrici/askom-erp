<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    /**
     * Display a listing of warehouses
     */
    public function index(Request $request)
    {
        $query = Warehouse::with(['manager', 'zones', 'staff']);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('city', 'like', '%' . $request->search . '%');
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Type filter
        if ($request->filled('warehouse_type')) {
            $query->where('warehouse_type', $request->warehouse_type);
        }

        // City filter
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $warehouses = $query->paginate(20)->withQueryString();

        // Statistics
        $warehouseStats = $this->getWarehouseStatistics();

        return Inertia::render('Warehouse/Index', [
            'warehouses' => $warehouses,
            'filters' => $request->all(['search', 'status', 'warehouse_type', 'city', 'sort_field', 'sort_direction']),
            'warehouseStats' => $warehouseStats,
            'cities' => Warehouse::distinct()->pluck('city')->sort()->values(),
        ]);
    }

    /**
     * Show the form for creating a new warehouse
     */
    public function create()
    {
        return Inertia::render('Warehouse/Create', [
            'managers' => User::select('id', 'name', 'email')->orderBy('name')->get(),
            'suggestedCode' => Warehouse::generateCode(),
        ]);
    }

    /**
     * Store a newly created warehouse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:warehouses,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'required|string|max:100',
            'total_area' => 'nullable|numeric|min:0',
            'storage_area' => 'nullable|numeric|min:0',
            'office_area' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'max_capacity' => 'nullable|integer|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'max_volume' => 'nullable|numeric|min:0',
            'warehouse_type' => 'required|in:main,distribution,retail,storage,production,cross_dock,cold_storage,hazardous',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'contact_person' => 'nullable|string|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'operating_hours' => 'nullable|array',
            'features' => 'nullable|array',
            'equipment' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['status'] = 'active';

        $warehouse = Warehouse::create($validated);

        return redirect()->route('warehouses.show', $warehouse)
            ->with('success', 'Depo başarıyla oluşturuldu.');
    }

    /**
     * Display the specified warehouse
     */
    public function show(Warehouse $warehouse)
    {
        $warehouse->load([
            'manager', 'zones.locations', 'staff.user',
            'operations' => function($query) {
                $query->latest()->limit(10);
            }
        ]);

        // Calculate warehouse metrics
        $metrics = [
            'total_zones' => $warehouse->zones->count(),
            'total_locations' => $warehouse->locations->count(),
            'occupied_locations' => $warehouse->locations->where('is_occupied', true)->count(),
            'capacity_utilization' => $warehouse->capacity_utilization,
            'active_staff' => $warehouse->staff->where('status', 'active')->count(),
            'recent_operations' => $warehouse->operations->count(),
        ];

        return Inertia::render('Warehouse/Show', [
            'warehouse' => $warehouse,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Show the form for editing the specified warehouse
     */
    public function edit(Warehouse $warehouse)
    {
        return Inertia::render('Warehouse/Edit', [
            'warehouse' => $warehouse,
            'managers' => User::select('id', 'name', 'email')->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified warehouse
     */
    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:warehouses,code,' . $warehouse->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'country' => 'required|string|max:100',
            'total_area' => 'nullable|numeric|min:0',
            'storage_area' => 'nullable|numeric|min:0',
            'office_area' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'max_capacity' => 'nullable|integer|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'max_volume' => 'nullable|numeric|min:0',
            'warehouse_type' => 'required|in:main,regional,distribution,retail,production,cross_dock,cold_storage,hazardous',
            'status' => 'required|in:active,inactive,maintenance,planned',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'contact_person' => 'nullable|string|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'operating_hours' => 'nullable|array',
            'features' => 'nullable|array',
            'equipment' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $validated['updated_by'] = auth()->id();

        $warehouse->update($validated);

        return redirect()->route('warehouses.show', $warehouse)
            ->with('success', 'Depo başarıyla güncellendi.');
    }

    /**
     * Remove the specified warehouse
     */
    public function destroy(Warehouse $warehouse)
    {
        // Check if warehouse has active operations
        if ($warehouse->operations()->whereNotIn('status', ['completed', 'cancelled'])->exists()) {
            return back()->with('error', 'Aktif operasyonları olan depo silinemez.');
        }

        $warehouse->delete();

        return redirect()->route('warehouses.index')
            ->with('success', 'Depo başarıyla silindi.');
    }

    /**
     * Get warehouse dashboard data
     */
    public function dashboard(Warehouse $warehouse)
    {
        $dashboardData = [
            // Key metrics
            'metrics' => [
                'total_locations' => $warehouse->locations()->count(),
                'occupied_locations' => $warehouse->locations()->where('is_occupied', true)->count(),
                'available_locations' => $warehouse->locations()->where('is_occupied', false)->where('status', 'active')->count(),
                'capacity_utilization' => $warehouse->capacity_utilization,
                'active_staff' => $warehouse->staff()->where('status', 'active')->count(),
                'total_zones' => $warehouse->zones()->count(),
            ],

            // Operations summary
            'operations' => [
                'today_total' => $warehouse->operations()->whereDate('created_at', today())->count(),
                'today_completed' => $warehouse->operations()->whereDate('created_at', today())->where('status', 'completed')->count(),
                'pending' => $warehouse->operations()->where('status', 'created')->count(),
                'in_progress' => $warehouse->operations()->where('status', 'in_progress')->count(),
                'overdue' => $warehouse->operations()->where('due_date', '<', now())->whereNotIn('status', ['completed', 'cancelled'])->count(),
            ],

            // Zone utilization
            'zone_utilization' => $warehouse->zones()->with('locations')->get()->map(function($zone) {
                return [
                    'name' => $zone->name,
                    'type' => $zone->zone_type,
                    'total_locations' => $zone->locations->count(),
                    'occupied_locations' => $zone->locations->where('is_occupied', true)->count(),
                    'utilization' => $zone->capacity_utilization,
                ];
            }),

            // Recent operations
            'recent_operations' => $warehouse->operations()
                ->with(['assignedTo', 'operation_items.product'])
                ->latest()
                ->limit(10)
                ->get(),

            // Staff status
            'staff_status' => $warehouse->staff()
                ->where('status', 'active')
                ->get()
                ->groupBy('current_status')
                ->map(function($group) {
                    return $group->count();
                }),
        ];

        return Inertia::render('Warehouse/Dashboard', [
            'warehouse' => $warehouse,
            'dashboardData' => $dashboardData,
        ]);
    }

    /**
     * Get warehouse statistics
     */
    private function getWarehouseStatistics()
    {
        return [
            'total_warehouses' => Warehouse::count(),
            'active_warehouses' => Warehouse::where('status', 'active')->count(),
            'inactive_warehouses' => Warehouse::where('status', 'inactive')->count(),
            'maintenance_warehouses' => Warehouse::where('status', 'maintenance')->count(),
            'total_zones' => DB::table('warehouse_zones')->count(),
            'total_locations' => DB::table('warehouse_locations')->count(),
            'occupied_locations' => DB::table('warehouse_locations')->where('is_occupied', true)->count(),
        ];
    }

    /**
     * Set warehouse as default
     */
    public function setDefault(Warehouse $warehouse)
    {
        DB::transaction(function() use ($warehouse) {
            // Remove default flag from all warehouses
            Warehouse::where('is_default', true)->update(['is_default' => false]);

            // Set this warehouse as default
            $warehouse->update(['is_default' => true]);
        });

        return back()->with('success', 'Varsayılan depo olarak ayarlandı.');
    }

    /**
     * Export warehouses data
     */
    public function export(Request $request)
    {
        $query = Warehouse::with(['manager']);

        // Apply same filters as index
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('city', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('warehouse_type')) {
            $query->where('warehouse_type', $request->warehouse_type);
        }

        $warehouses = $query->get();

        $filename = 'depolar_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($warehouses) {
            $file = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header
            fputcsv($file, [
                'Depo Kodu',
                'Depo Adı',
                'Tür',
                'Durum',
                'Şehir',
                'Adres',
                'Müdür',
                'Toplam Alan (m²)',
                'Maksimum Kapasite',
                'Oluşturma Tarihi'
            ], ';');

            foreach ($warehouses as $warehouse) {
                fputcsv($file, [
                    $warehouse->code,
                    $warehouse->name,
                    $warehouse->warehouse_type_text,
                    $warehouse->status_text,
                    $warehouse->city,
                    $warehouse->address,
                    $warehouse->manager->name ?? '',
                    $warehouse->total_area ?? 0,
                    $warehouse->max_capacity ?? 0,
                    $warehouse->created_at->format('Y-m-d H:i')
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
