<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseZone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseZoneController extends Controller
{
    /**
     * Display zones for a warehouse
     */
    public function index(Request $request, Warehouse $warehouse)
    {
        $query = $warehouse->zones()->with(['locations']);

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%')
                  ->orWhere('zone_type', 'like', '%' . $request->search . '%');
            });
        }

        // Zone type filter
        if ($request->filled('zone_type')) {
            $query->where('zone_type', $request->zone_type);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'name');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $zones = $query->paginate(20)->withQueryString();

        // Add computed attributes
        $zones->getCollection()->transform(function ($zone) {
            $zone->total_locations = $zone->locations->count();
            $zone->occupied_locations = $zone->locations->where('is_occupied', true)->count();
            $zone->available_locations = $zone->locations->where('is_occupied', false)->where('status', 'active')->count();
            return $zone;
        });

        return Inertia::render('Warehouse/Zones/Index', [
            'warehouse' => $warehouse,
            'zones' => $zones,
            'filters' => $request->all(['search', 'zone_type', 'status', 'sort_field', 'sort_direction']),
        ]);
    }

    /**
     * Show the form for creating a new zone
     */
    public function create(Warehouse $warehouse)
    {
        return Inertia::render('Warehouse/Zones/Create', [
            'warehouse' => $warehouse,
        ]);
    }

    /**
     * Store a newly created zone
     */
    public function store(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'zone_type' => 'required|in:receiving,storage,picking,packing,shipping,returns,quarantine,office,maintenance,staging',
            'area' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'capacity' => 'nullable|integer|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'temperature_control' => 'required|in:none,ambient,refrigerated,frozen',
            'min_temperature' => 'nullable|numeric',
            'max_temperature' => 'nullable|numeric',
            'climate_controlled' => 'boolean',
            'security_required' => 'boolean',
            'hazmat_approved' => 'boolean',
            'access_restrictions' => 'nullable|array',
            'safety_requirements' => 'nullable|array',
            'coordinates' => 'nullable|array',
            'floor_level' => 'nullable|string|max:50',
        ]);

        // Check for unique code within warehouse
        $existingZone = $warehouse->zones()->where('code', $validated['code'])->first();
        if ($existingZone) {
            return back()->withErrors(['code' => 'Bu kod bu depoda zaten kullanılıyor.']);
        }

        $validated['warehouse_id'] = $warehouse->id;
        $validated['created_by'] = auth()->id();
        $validated['status'] = 'active';

        $zone = WarehouseZone::create($validated);

        return redirect()->route('warehouses.zones.show', [$warehouse, $zone])
            ->with('success', 'Depo bölgesi başarıyla oluşturuldu.');
    }

    /**
     * Display the specified zone
     */
    public function show(Warehouse $warehouse, WarehouseZone $zone)
    {
        $zone->load(['locations', 'creator']);

        // Calculate zone metrics
        $metrics = [
            'total_locations' => $zone->locations->count(),
            'occupied_locations' => $zone->locations->where('is_occupied', true)->count(),
            'available_locations' => $zone->locations->where('is_occupied', false)->where('status', 'active')->count(),
            'blocked_locations' => $zone->locations->where('status', 'blocked')->count(),
            'capacity_utilization' => $zone->capacity_utilization,
        ];

        return Inertia::render('Warehouse/Zones/Show', [
            'warehouse' => $warehouse,
            'zone' => $zone,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Show the form for editing the specified zone
     */
    public function edit(Warehouse $warehouse, WarehouseZone $zone)
    {
        return Inertia::render('Warehouse/Zones/Edit', [
            'warehouse' => $warehouse,
            'zone' => $zone,
        ]);
    }

    /**
     * Update the specified zone
     */
    public function update(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'zone_type' => 'required|in:receiving,storage,picking,packing,shipping,returns,quarantine,office,maintenance,staging',
            'area' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'capacity' => 'nullable|integer|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'temperature_control' => 'required|in:none,ambient,refrigerated,frozen',
            'min_temperature' => 'nullable|numeric',
            'max_temperature' => 'nullable|numeric',
            'climate_controlled' => 'boolean',
            'security_required' => 'boolean',
            'hazmat_approved' => 'boolean',
            'access_restrictions' => 'nullable|array',
            'safety_requirements' => 'nullable|array',
            'coordinates' => 'nullable|array',
            'floor_level' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive,maintenance,planned',
        ]);

        // Check for unique code within warehouse (excluding current zone)
        $existingZone = $warehouse->zones()
            ->where('code', $validated['code'])
            ->where('id', '!=', $zone->id)
            ->first();
        
        if ($existingZone) {
            return back()->withErrors(['code' => 'Bu kod bu depoda zaten kullanılıyor.']);
        }

        $validated['updated_by'] = auth()->id();

        $zone->update($validated);

        return redirect()->route('warehouses.zones.show', [$warehouse, $zone])
            ->with('success', 'Depo bölgesi başarıyla güncellendi.');
    }

    /**
     * Remove the specified zone
     */
    public function destroy(Warehouse $warehouse, WarehouseZone $zone)
    {
        // Check if zone has locations
        if ($zone->locations()->count() > 0) {
            return back()->with('error', 'Lokasyonları olan bölge silinemez.');
        }

        $zone->delete();

        return redirect()->route('warehouses.zones.index', $warehouse)
            ->with('success', 'Depo bölgesi başarıyla silindi.');
    }

    /**
     * Clone a zone with all its locations
     */
    public function clone(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'clone_locations' => 'boolean',
        ]);

        // Check for unique code within warehouse
        $existingZone = $warehouse->zones()->where('code', $validated['code'])->first();
        if ($existingZone) {
            return back()->withErrors(['code' => 'Bu kod bu depoda zaten kullanılıyor.']);
        }

        // Clone zone
        $newZone = $zone->replicate();
        $newZone->code = $validated['code'];
        $newZone->name = $validated['name'];
        $newZone->created_by = auth()->id();
        $newZone->updated_by = null;
        $newZone->save();

        // Clone locations if requested
        if ($validated['clone_locations']) {
            foreach ($zone->locations as $location) {
                $newLocation = $location->replicate();
                $newLocation->zone_id = $newZone->id;
                $newLocation->code = $newZone->code . '-' . $location->code;
                $newLocation->is_occupied = false;
                $newLocation->current_items = 0;
                $newLocation->utilization_percentage = 0;
                $newLocation->created_by = auth()->id();
                $newLocation->updated_by = null;
                $newLocation->save();
            }
        }

        return redirect()->route('warehouses.zones.show', [$warehouse, $newZone])
            ->with('success', 'Depo bölgesi başarıyla kopyalandı.');
    }

    /**
     * Generate locations for a zone
     */
    public function generateLocations(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $validated = $request->validate([
            'pattern' => 'required|in:grid,linear',
            'aisles' => 'required|integer|min:1|max:50',
            'racks_per_aisle' => 'required|integer|min:1|max:100',
            'shelves_per_rack' => 'required|integer|min:1|max:20',
            'bins_per_shelf' => 'required|integer|min:1|max:10',
            'location_type' => 'required|in:bin,shelf,rack,floor,bulk',
            'max_items' => 'required|integer|min:1',
            'max_weight' => 'nullable|numeric|min:0',
        ]);

        $locationsCreated = 0;
        $aislePrefix = $validated['pattern'] === 'grid' ? 'A' : 'L';

        for ($aisle = 1; $aisle <= $validated['aisles']; $aisle++) {
            for ($rack = 1; $rack <= $validated['racks_per_aisle']; $rack++) {
                for ($shelf = 1; $shelf <= $validated['shelves_per_rack']; $shelf++) {
                    for ($bin = 1; $bin <= $validated['bins_per_shelf']; $bin++) {
                        $aisleCode = $aislePrefix . str_pad($aisle, 2, '0', STR_PAD_LEFT);
                        $rackCode = str_pad($rack, 2, '0', STR_PAD_LEFT);
                        $shelfCode = str_pad($shelf, 2, '0', STR_PAD_LEFT);
                        $binCode = str_pad($bin, 2, '0', STR_PAD_LEFT);
                        
                        $locationCode = "{$aisleCode}-{$rackCode}-{$shelfCode}-{$binCode}";
                        
                        // Check if location already exists
                        if ($zone->locations()->where('code', $locationCode)->exists()) {
                            continue;
                        }

                        $zone->locations()->create([
                            'warehouse_id' => $warehouse->id,
                            'code' => $locationCode,
                            'aisle' => $aisleCode,
                            'rack' => $rackCode,
                            'shelf' => $shelfCode,
                            'bin' => $binCode,
                            'level' => $shelf,
                            'location_type' => $validated['location_type'],
                            'max_items' => $validated['max_items'],
                            'max_weight' => $validated['max_weight'],
                            'pick_sequence' => $locationsCreated + 1,
                            'status' => 'active',
                            'created_by' => auth()->id(),
                        ]);

                        $locationsCreated++;
                    }
                }
            }
        }

        return back()->with('success', "{$locationsCreated} lokasyon başarıyla oluşturuldu.");
    }
}