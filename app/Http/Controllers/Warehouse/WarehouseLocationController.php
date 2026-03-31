<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseZone;
use App\Models\WarehouseLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseLocationController extends Controller
{
    /**
     * Display locations for a warehouse zone
     */
    public function index(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $query = $zone->locations();

        // Search filter
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('code', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%');
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Location type filter
        if ($request->filled('location_type')) {
            $query->where('location_type', $request->location_type);
        }

        // Occupied filter
        if ($request->filled('occupied')) {
            $query->where('is_occupied', $request->occupied === 'yes');
        }

        // Available filter
        if ($request->filled('available')) {
            if ($request->available === 'yes') {
                $query->where('status', 'active')
                      ->where('is_occupied', false)
                      ->where('is_reserved', false);
            }
        }

        // Aisle filter
        if ($request->filled('aisle')) {
            $query->where('aisle', $request->aisle);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'code');
        $sortDirection = $request->get('sort_direction', 'asc');
        $query->orderBy($sortField, $sortDirection);

        $locations = $query->paginate(50)->withQueryString();

        // Get unique aisles for filter
        $aisles = $zone->locations()->distinct()->pluck('aisle')->filter()->sort()->values();

        return Inertia::render('Warehouse/Locations/Index', [
            'warehouse' => $warehouse,
            'zone' => $zone,
            'locations' => $locations,
            'filters' => $request->all(['search', 'status', 'location_type', 'occupied', 'available', 'aisle', 'sort_field', 'sort_direction']),
            'aisles' => $aisles,
        ]);
    }

    /**
     * Show the form for creating a new location
     */
    public function create(Warehouse $warehouse, WarehouseZone $zone)
    {
        return Inertia::render('Warehouse/Locations/Create', [
            'warehouse' => $warehouse,
            'zone' => $zone,
        ]);
    }

    /**
     * Store a newly created location
     */
    public function store(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'aisle' => 'nullable|string|max:10',
            'rack' => 'nullable|string|max:10',
            'shelf' => 'nullable|string|max:10',
            'bin' => 'nullable|string|max:10',
            'level' => 'nullable|integer|min:0',
            'location_type' => 'required|in:bin,shelf,rack,floor,bulk,pick_face,reserve,staging,dock',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'max_items' => 'required|integer|min:1',
            'multi_sku' => 'boolean',
            'pick_location' => 'boolean',
            'replenishment_location' => 'boolean',
            'is_checkdigit_enabled' => 'boolean',
            'product_restrictions' => 'nullable|array',
            'size_restrictions' => 'nullable|array',
            'weight_restrictions' => 'nullable|array',
            'pick_sequence' => 'nullable|integer|min:0',
            'travel_time' => 'nullable|numeric|min:0',
            'cycle_count_required' => 'boolean',
        ]);

        // Check for unique code within warehouse
        $existingLocation = $warehouse->locations()->where('code', $validated['code'])->first();
        if ($existingLocation) {
            return back()->withErrors(['code' => 'Bu kod bu depoda zaten kullanılıyor.']);
        }

        $validated['warehouse_id'] = $warehouse->id;
        $validated['zone_id'] = $zone->id;
        $validated['created_by'] = auth()->id();
        $validated['status'] = 'active';

        $location = WarehouseLocation::create($validated);

        // Generate barcode if not provided
        $location->generateBarcode();

        return redirect()->route('warehouses.zones.locations.show', [$warehouse, $zone, $location])
            ->with('success', 'Depolama lokasyonu başarıyla oluşturuldu.');
    }

    /**
     * Display the specified location
     */
    public function show(Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        $location->load(['reservedBy', 'creator']);

        // Get location history (operations involving this location)
        $locationHistory = \App\Models\WarehouseOperationItem::with(['operation', 'product', 'processedBy'])
            ->where(function($query) use ($location) {
                $query->where('location_id', $location->id)
                      ->orWhere('from_location_id', $location->id)
                      ->orWhere('to_location_id', $location->id);
            })
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('Warehouse/Locations/Show', [
            'warehouse' => $warehouse,
            'zone' => $zone,
            'location' => $location,
            'locationHistory' => $locationHistory,
        ]);
    }

    /**
     * Show the form for editing the specified location
     */
    public function edit(Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        return Inertia::render('Warehouse/Locations/Edit', [
            'warehouse' => $warehouse,
            'zone' => $zone,
            'location' => $location,
        ]);
    }

    /**
     * Update the specified location
     */
    public function update(Request $request, Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'aisle' => 'nullable|string|max:10',
            'rack' => 'nullable|string|max:10',
            'shelf' => 'nullable|string|max:10',
            'bin' => 'nullable|string|max:10',
            'level' => 'nullable|integer|min:0',
            'location_type' => 'required|in:bin,shelf,rack,floor,bulk,pick_face,reserve,staging,dock',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'height' => 'nullable|numeric|min:0',
            'volume' => 'nullable|numeric|min:0',
            'max_weight' => 'nullable|numeric|min:0',
            'max_items' => 'required|integer|min:1',
            'multi_sku' => 'boolean',
            'pick_location' => 'boolean',
            'replenishment_location' => 'boolean',
            'is_checkdigit_enabled' => 'boolean',
            'product_restrictions' => 'nullable|array',
            'size_restrictions' => 'nullable|array',
            'weight_restrictions' => 'nullable|array',
            'pick_sequence' => 'nullable|integer|min:0',
            'travel_time' => 'nullable|numeric|min:0',
            'cycle_count_required' => 'boolean',
            'status' => 'required|in:active,inactive,blocked,maintenance,damaged',
        ]);

        // Check for unique code within warehouse (excluding current location)
        $existingLocation = $warehouse->locations()
            ->where('code', $validated['code'])
            ->where('id', '!=', $location->id)
            ->first();
        
        if ($existingLocation) {
            return back()->withErrors(['code' => 'Bu kod bu depoda zaten kullanılıyor.']);
        }

        $validated['updated_by'] = auth()->id();

        $location->update($validated);

        return redirect()->route('warehouses.zones.locations.show', [$warehouse, $zone, $location])
            ->with('success', 'Depolama lokasyonu başarıyla güncellendi.');
    }

    /**
     * Remove the specified location
     */
    public function destroy(Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        // Check if location is occupied
        if ($location->is_occupied) {
            return back()->with('error', 'Dolu olan lokasyon silinemez.');
        }

        // Check if location is reserved
        if ($location->is_reserved) {
            return back()->with('error', 'Rezerve edilmiş lokasyon silinemez.');
        }

        $location->delete();

        return redirect()->route('warehouses.zones.locations.index', [$warehouse, $zone])
            ->with('success', 'Depolama lokasyonu başarıyla silindi.');
    }

    /**
     * Reserve location
     */
    public function reserve(Request $request, Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        $validated = $request->validate([
            'duration' => 'required|integer|min:5|max:480', // 5 minutes to 8 hours
            'reason' => 'nullable|string|max:255',
        ]);

        if (!$location->isAvailable()) {
            return back()->with('error', 'Lokasyon müsait değil.');
        }

        $success = $location->reserve(auth()->id(), $validated['duration']);

        if ($success) {
            return back()->with('success', 'Lokasyon başarıyla rezerve edildi.');
        } else {
            return back()->with('error', 'Lokasyon rezerve edilemedi.');
        }
    }

    /**
     * Release location reservation
     */
    public function releaseReservation(Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        if (!$location->is_reserved) {
            return back()->with('error', 'Lokasyon zaten rezerve değil.');
        }

        $location->releaseReservation();

        return back()->with('success', 'Lokasyon rezervasyonu iptal edildi.');
    }

    /**
     * Block location
     */
    public function block(Request $request, Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $location->update([
            'status' => 'blocked',
            'notes' => $validated['reason'],
            'updated_by' => auth()->id(),
        ]);

        return back()->with('success', 'Lokasyon bloke edildi.');
    }

    /**
     * Unblock location
     */
    public function unblock(Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        $location->update([
            'status' => 'active',
            'updated_by' => auth()->id(),
        ]);

        return back()->with('success', 'Lokasyon blokesi kaldırıldı.');
    }

    /**
     * Generate barcode for location
     */
    public function generateBarcode(Warehouse $warehouse, WarehouseZone $zone, WarehouseLocation $location)
    {
        $barcode = $location->generateBarcode();
        
        return response()->json(['barcode' => $barcode]);
    }

    /**
     * Bulk update locations
     */
    public function bulkUpdate(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:warehouse_locations,id',
            'action' => 'required|in:activate,deactivate,block,unblock,delete',
            'reason' => 'nullable|string|max:255',
        ]);

        $locations = $zone->locations()->whereIn('id', $validated['location_ids']);
        $count = 0;

        switch ($validated['action']) {
            case 'activate':
                $count = $locations->update(['status' => 'active', 'updated_by' => auth()->id()]);
                break;
            case 'deactivate':
                $count = $locations->update(['status' => 'inactive', 'updated_by' => auth()->id()]);
                break;
            case 'block':
                $count = $locations->update([
                    'status' => 'blocked', 
                    'notes' => $validated['reason'],
                    'updated_by' => auth()->id()
                ]);
                break;
            case 'unblock':
                $count = $locations->update(['status' => 'active', 'updated_by' => auth()->id()]);
                break;
            case 'delete':
                // Only delete empty locations
                $count = $locations->where('is_occupied', false)->where('is_reserved', false)->delete();
                break;
        }

        return back()->with('success', "{$count} lokasyon başarıyla güncellendi.");
    }

    /**
     * Print location labels
     */
    public function printLabels(Request $request, Warehouse $warehouse, WarehouseZone $zone)
    {
        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:warehouse_locations,id',
            'label_size' => 'required|in:small,medium,large',
            'include_barcode' => 'boolean',
            'include_zone' => 'boolean',
        ]);

        $locations = $zone->locations()->whereIn('id', $validated['location_ids'])->get();

        // Generate PDF labels (implementation would depend on specific requirements)
        // For now, return success message
        return back()->with('success', count($locations) . ' lokasyon etiketi yazdırılmak üzere hazırlandı.');
    }
}